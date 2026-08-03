CREATE TABLE analytics_runner_state (
    group_id BIGINT PRIMARY KEY,
    payload JSONB NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

