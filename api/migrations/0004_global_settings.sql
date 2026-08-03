CREATE TABLE app_global_settings (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    company_name TEXT NOT NULL DEFAULT 'GitLab CI Dashboard',
    company_logo TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO app_global_settings (singleton) VALUES (TRUE)
ON CONFLICT (singleton) DO NOTHING;
