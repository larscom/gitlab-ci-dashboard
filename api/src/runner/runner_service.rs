use crate::analytics::AnalyticsStore;
use crate::config::config_app::AppConfig;
use crate::error::ApiError;
use crate::gitlab::GitlabApi;
use crate::model::{Runner, RunnerJob, RunnerManager, RunnerWithJobs};
use moka::future::Cache;
use std::sync::Arc;

#[derive(Clone)]
pub struct RunnerService {
    runners: Cache<u64, Vec<Runner>>,
    details: Cache<u64, Option<Runner>>,
    managers: Cache<u64, Vec<RunnerManager>>,
    jobs: Cache<u64, Vec<RunnerJob>>,
    last_known_runners: Cache<u64, Vec<Runner>>,
    last_known_jobs: Cache<u64, Vec<RunnerJob>>,
    client: Arc<dyn GitlabApi>,
    analytics: AnalyticsStore,
}

impl RunnerService {
    pub fn new(client: Arc<dyn GitlabApi>, config: AppConfig, analytics: AnalyticsStore) -> Self {
        Self {
            runners: Cache::builder()
                .time_to_live(config.ttl_runner_cache)
                .build(),
            details: Cache::builder()
                .time_to_live(config.ttl_runner_detail_cache)
                .build(),
            managers: Cache::builder()
                .time_to_live(config.ttl_runner_detail_cache)
                .build(),
            jobs: Cache::builder()
                .time_to_live(config.ttl_runner_job_cache)
                .build(),
            last_known_runners: Cache::new(100),
            last_known_jobs: Cache::new(10_000),
            client,
            analytics,
        }
    }

    pub async fn get_runners(
        &self,
        group_id: u64,
        refresh: bool,
    ) -> Result<Vec<RunnerWithJobs>, ApiError> {
        if !refresh {
            match self.analytics.load_runners(group_id).await {
                Ok(Some(runners)) => return Ok(runners),
                Ok(None) => {}
                Err(error) => {
                    log::warn!("Could not load persisted runners for group {group_id}: {error}");
                }
            }
        }

        if refresh {
            self.runners.invalidate(&group_id).await;
        }

        let runners = match self
            .runners
            .try_get_with(group_id, self.client.runners(group_id))
            .await
        {
            Ok(runners) => {
                self.last_known_runners
                    .insert(group_id, runners.clone())
                    .await;
                runners
            }
            Err(error) => {
                if let Some(stale) = self.last_known_runners.get(&group_id).await {
                    log::warn!(
                        "Could not refresh runners for group {}: {}; using the last known data",
                        group_id,
                        error
                    );
                    stale
                } else if error.is_forbidden() {
                    log::warn!(
                        "Runner data is not permitted for group {}. Projects and pipelines remain available.",
                        group_id
                    );
                    Vec::new()
                } else {
                    return Err(error.as_ref().to_owned());
                }
            }
        };

        let runners = runners
            .into_iter()
            .filter(is_self_hosted)
            .collect::<Vec<_>>();

        if refresh {
            for runner in &runners {
                self.details.invalidate(&runner.id).await;
                self.managers.invalidate(&runner.id).await;
                self.jobs.invalidate(&runner.id).await;
            }
        }

        let mut result = Vec::with_capacity(runners.len());
        for summary in runners {
            let runner_id = summary.id;
            let client = self.client.clone();
            let details = self
                .details
                .get_with(runner_id, async move {
                    match client.runner_details(runner_id).await {
                        Ok(details) => Some(details),
                        Err(error) => {
                            log::warn!(
                                "Could not load details for self-hosted runner {}: {}; tags will \
                                 remain unavailable until the detail cache is refreshed",
                                runner_id,
                                error
                            );
                            None
                        }
                    }
                })
                .await;
            let mut runner = merge_runner_details(summary, details);
            if runner.ip_address.is_empty() {
                let client = self.client.clone();
                let managers = self
                    .managers
                    .get_with(runner_id, async move {
                        match client.runner_managers(runner_id).await {
                            Ok(managers) => managers,
                            Err(error) => {
                                log::warn!(
                                    "Could not load managers for runner {}: {}; IP address will \
                                     remain unavailable until the detail cache is refreshed",
                                    runner_id,
                                    error
                                );
                                Vec::new()
                            }
                        }
                    })
                    .await;
                runner.ip_address = manager_ip_addresses(&managers);
            }

            let jobs = if is_running(&runner) {
                match self
                    .jobs
                    .try_get_with(runner.id, self.client.runner_jobs(runner.id))
                    .await
                {
                    Ok(jobs) => {
                        self.last_known_jobs.insert(runner.id, jobs.clone()).await;
                        jobs
                    }
                    Err(error) => {
                        log::warn!(
                            "Could not load active jobs for runner {}: {}; using last known job \
                             details when available",
                            runner.id,
                            error
                        );
                        self.last_known_jobs
                            .get(&runner.id)
                            .await
                            .unwrap_or_default()
                    }
                }
            } else {
                Vec::new()
            };

            result.push(RunnerWithJobs {
                group_id,
                runner,
                jobs,
            });
        }

        result.sort_unstable_by(|a, b| {
            runner_priority(&a.runner)
                .cmp(&runner_priority(&b.runner))
                .then_with(|| a.runner.description.cmp(&b.runner.description))
        });
        if let Err(error) = self.analytics.persist_runners(group_id, &result).await {
            log::error!("Could not persist runners for group {group_id}: {error}");
        }
        Ok(result)
    }
}

fn manager_ip_addresses(managers: &[RunnerManager]) -> String {
    let mut managers = managers
        .iter()
        .filter(|manager| !manager.ip_address.is_empty())
        .collect::<Vec<_>>();
    managers.sort_unstable_by(|a, b| {
        manager_priority(a)
            .cmp(&manager_priority(b))
            .then_with(|| b.contacted_at.cmp(&a.contacted_at))
    });

    let mut addresses = Vec::new();
    for manager in managers {
        if !addresses.contains(&manager.ip_address) {
            addresses.push(manager.ip_address.clone());
        }
    }
    addresses.join(", ")
}

fn manager_priority(manager: &RunnerManager) -> u8 {
    if manager.job_execution_status.eq_ignore_ascii_case("running") {
        0
    } else if manager.status.eq_ignore_ascii_case("online") {
        1
    } else {
        2
    }
}

fn is_self_hosted(runner: &Runner) -> bool {
    !runner.is_shared && !runner.runner_type.eq_ignore_ascii_case("instance_type")
}

fn merge_runner_details(summary: Runner, details: Option<Runner>) -> Runner {
    match details {
        Some(mut details) => {
            // The group list is refreshed more frequently and is authoritative for live state.
            details.paused = summary.paused;
            details.is_shared = summary.is_shared;
            details.online = summary.online;
            details.runner_type = summary.runner_type;
            details.status = summary.status;
            details.job_execution_status = summary.job_execution_status;
            details.scope_name = summary.scope_name;
            details
        }
        None => summary,
    }
}

fn is_running(runner: &Runner) -> bool {
    runner.job_execution_status.eq_ignore_ascii_case("running")
        || runner.job_execution_status.eq_ignore_ascii_case("active")
}

fn runner_priority(runner: &Runner) -> u8 {
    if is_running(runner) {
        0
    } else if runner.paused {
        2
    } else if runner.online.unwrap_or(false) {
        1
    } else {
        3
    }
}
