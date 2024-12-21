use crate::config::Config;
use crate::error::ApiError;
use crate::gitlab::GitlabApi;
use crate::model::Schedule;
use moka::future::Cache;
use std::sync::Arc;

pub struct ScheduleService {
    cache: Cache<u64, Vec<Schedule>>,
    client: Arc<dyn GitlabApi>,
}

impl ScheduleService {
    pub fn new(client: Arc<dyn GitlabApi>, config: Config) -> Self {
        let cache = Cache::builder()
            .time_to_live(config.ttl_schedule_cache)
            .build();

        Self { cache, client }
    }
}

impl ScheduleService {
    pub async fn get_schedules(&self, project_id: u64) -> Result<Vec<Schedule>, ApiError> {
        self.cache
            .try_get_with(project_id, async {
                self.client.schedules(project_id).await
            })
            .await
            .map_err(|error| error.as_ref().to_owned())
    }
}
