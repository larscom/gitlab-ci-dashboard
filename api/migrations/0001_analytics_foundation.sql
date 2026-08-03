CREATE TABLE analytics_projects (
    gitlab_id BIGINT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    path TEXT,
    web_url TEXT NOT NULL,
    default_branch TEXT,
    namespace_path TEXT NOT NULL,
    topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    jobs_enabled BOOLEAN NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX analytics_projects_group_id_idx ON analytics_projects (group_id);

CREATE TABLE analytics_pipelines (
    gitlab_id BIGINT PRIMARY KEY,
    iid BIGINT NOT NULL,
    project_id BIGINT NOT NULL REFERENCES analytics_projects(gitlab_id) ON DELETE CASCADE,
    sha TEXT NOT NULL,
    branch TEXT NOT NULL,
    status TEXT NOT NULL,
    source TEXT NOT NULL,
    coverage DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    web_url TEXT NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX analytics_pipelines_project_updated_idx ON analytics_pipelines (project_id, updated_at DESC);
CREATE INDEX analytics_pipelines_status_updated_idx ON analytics_pipelines (status, updated_at DESC);

CREATE TABLE analytics_jobs (
    gitlab_id BIGINT PRIMARY KEY,
    pipeline_id BIGINT NOT NULL REFERENCES analytics_pipelines(gitlab_id) ON DELETE CASCADE,
    project_id BIGINT NOT NULL REFERENCES analytics_projects(gitlab_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stage TEXT NOT NULL,
    branch TEXT NOT NULL,
    status TEXT NOT NULL,
    allow_failure BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    web_url TEXT NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX analytics_jobs_pipeline_id_idx ON analytics_jobs (pipeline_id);
CREATE INDEX analytics_jobs_status_created_idx ON analytics_jobs (status, created_at DESC);

CREATE TABLE analytics_runner_snapshots (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL,
    runner_id BIGINT NOT NULL,
    status TEXT NOT NULL,
    job_count INTEGER NOT NULL DEFAULT 0,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX analytics_runner_snapshots_group_captured_idx ON analytics_runner_snapshots (group_id, captured_at DESC);

CREATE TABLE analytics_sync_state (
    scope TEXT PRIMARY KEY,
    last_started_at TIMESTAMPTZ,
    last_completed_at TIMESTAMPTZ,
    last_error TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX analytics_runner_snapshots_retention_idx ON analytics_runner_snapshots (captured_at);
CREATE INDEX analytics_pipelines_retention_idx ON analytics_pipelines (updated_at);
