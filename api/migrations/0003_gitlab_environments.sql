CREATE TABLE gitlab_environments (
    id BIGSERIAL PRIMARY KEY,
    namespace_id SMALLINT NOT NULL UNIQUE CHECK (namespace_id BETWEEN 0 AND 127),
    name TEXT NOT NULL,
    base_url TEXT NOT NULL UNIQUE,
    token_ciphertext BYTEA NOT NULL,
    company_logo_url TEXT NOT NULL DEFAULT '',
    group_ids BIGINT[] NOT NULL DEFAULT '{}',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    only_top_level BOOLEAN NOT NULL DEFAULT TRUE,
    include_subgroups BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_tested_at TIMESTAMPTZ,
    last_error TEXT
);
