use super::AnalyticsStore;
use actix_web::web::{self, Data, Json};
use serde::{Deserialize, Serialize};
use serde_querystring_actix::QueryString;
use sqlx::Row;

#[derive(Serialize)]
pub struct AnalyticsHistoryPoint {
    label: String,
    pipeline_count: i64,
    project_count: i64,
}

#[derive(Default, Serialize)]
pub struct AnalyticsSummary {
    window_days: i32,
    window_hours: i32,
    project_count: i64,
    pipeline_count: i64,
    success_count: i64,
    failed_count: i64,
    manual_count: i64,
    active_count: i64,
    canceled_count: i64,
    runner_count: i64,
    runner_running_count: i64,
    runner_idle_count: i64,
    runner_offline_count: i64,
    history: Vec<AnalyticsHistoryPoint>,
    success_rate: f64,
}

#[derive(Deserialize)]
struct SummaryQuery {
    #[serde(default)]
    group_ids: Vec<u64>,
    hours: Option<i32>,
}

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route("/analytics/summary", web::get().to(get_summary))
        .route("/analytics/pipelines", web::get().to(super::pipelines::get_pipelines));
}

async fn get_summary(
    QueryString(query): QueryString<SummaryQuery>,
    store: Data<AnalyticsStore>,
) -> Result<Json<AnalyticsSummary>, crate::error::ApiError> {
    let hours = query.hours.unwrap_or(24).clamp(1, 24 * 365);
    summary(&store, query.group_ids, hours)
        .await
        .map(Json)
        .map_err(|error| {
            log::error!("Could not load analytics summary: {error}");
            crate::error::ApiError::server_error("Could not load analytics summary")
        })
}

async fn summary(
    store: &AnalyticsStore,
    group_ids: Vec<u64>,
    hours: i32,
) -> Result<AnalyticsSummary, sqlx::Error> {
    let Some(pool) = &store.pool else {
        return Ok(AnalyticsSummary::default());
    };
    let group_ids = group_ids.into_iter().map(|id| id as i64).collect::<Vec<_>>();
    let row = sqlx::query(
        r#"WITH selected_projects AS (
             SELECT gitlab_id FROM analytics_projects
             WHERE cardinality($1::bigint[]) = 0 OR group_id = ANY($1)
           ), selected_pipelines AS (
             SELECT status FROM analytics_pipelines
             WHERE project_id IN (SELECT gitlab_id FROM selected_projects)
               AND updated_at >= NOW() - make_interval(hours => $2)
           ), runner_items AS (
             SELECT item
             FROM analytics_runner_state state
             CROSS JOIN LATERAL jsonb_array_elements(state.payload) AS item
             WHERE cardinality($1::bigint[]) = 0 OR state.group_id = ANY($1)
           )
           SELECT
             (SELECT COUNT(*) FROM selected_projects) AS project_count,
             COUNT(*) AS pipeline_count,
             COUNT(*) FILTER (WHERE status = 'success') AS success_count,
             COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
             COUNT(*) FILTER (WHERE status = 'manual') AS manual_count,
             COUNT(*) FILTER (WHERE status IN ('running','pending','created','preparing','waiting_for_resource')) AS active_count,
             COUNT(*) FILTER (WHERE status IN ('canceled','canceling')) AS canceled_count,
             (SELECT COUNT(*) FROM runner_items) AS runner_count,
             (SELECT COUNT(*) FROM runner_items WHERE item->'runner'->>'job_execution_status' IN ('running','active')) AS runner_running_count,
             (SELECT COUNT(*) FROM runner_items WHERE (item->'runner'->>'online')::boolean AND item->'runner'->>'job_execution_status' = 'idle') AS runner_idle_count,
             (SELECT COUNT(*) FROM runner_items WHERE NOT COALESCE((item->'runner'->>'online')::boolean, false)) AS runner_offline_count
           FROM selected_pipelines"#,
    )
    .bind(&group_ids)
    .bind(hours)
    .fetch_one(pool)
    .await?;

    let history = sqlx::query(
        r#"WITH bounds AS (
             SELECT NOW() - make_interval(hours => $2) AS start_time, NOW() AS end_time
           ), selected_projects AS (
             SELECT gitlab_id FROM analytics_projects
             WHERE cardinality($1::bigint[]) = 0 OR group_id = ANY($1)
           ), buckets AS (
             SELECT bucket_index,
                    start_time + (end_time - start_time) * bucket_index / 12 AS bucket_start,
                    start_time + (end_time - start_time) * (bucket_index + 1) / 12 AS bucket_end
             FROM bounds CROSS JOIN generate_series(0, 11) AS bucket_index
           )
           SELECT CASE WHEN $2 <= 48
                       THEN to_char(bucket_start AT TIME ZONE 'UTC', 'Mon DD HH24:MI')
                       ELSE to_char(bucket_start AT TIME ZONE 'UTC', 'Mon DD') END AS label,
                  COUNT(p.gitlab_id) AS pipeline_count,
                  COUNT(DISTINCT p.project_id) AS project_count
           FROM buckets
           LEFT JOIN analytics_pipelines p
             ON p.updated_at >= bucket_start AND p.updated_at < bucket_end
            AND p.project_id IN (SELECT gitlab_id FROM selected_projects)
           GROUP BY bucket_index, bucket_start
           ORDER BY bucket_index"#,
    )
    .bind(&group_ids)
    .bind(hours)
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|point| AnalyticsHistoryPoint {
        label: point.try_get("label").unwrap_or_default(),
        pipeline_count: point.try_get("pipeline_count").unwrap_or_default(),
        project_count: point.try_get("project_count").unwrap_or_default(),
    })
    .collect::<Vec<_>>();
    let success_count: i64 = row.try_get("success_count")?;
    let failed_count: i64 = row.try_get("failed_count")?;
    let completed = success_count + failed_count;
    Ok(AnalyticsSummary {
        window_days: (hours + 23) / 24,
        window_hours: hours,
        project_count: row.try_get("project_count")?,
        pipeline_count: row.try_get("pipeline_count")?,
        success_count,
        failed_count,
        manual_count: row.try_get("manual_count")?,
        active_count: row.try_get("active_count")?,
        canceled_count: row.try_get("canceled_count")?,
        runner_count: row.try_get("runner_count")?,
        runner_running_count: row.try_get("runner_running_count")?,
        runner_idle_count: row.try_get("runner_idle_count")?,
        runner_offline_count: row.try_get("runner_offline_count")?,
        history,
        success_rate: if completed == 0 { 0.0 } else { success_count as f64 * 100.0 / completed as f64 },
    })
}
