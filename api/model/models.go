package model

import "time"

type GroupId int
type Group struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type ProjectId int
type Project struct {
	Id             int       `json:"id"`
	Name           string    `json:"name"`
	WebUrl         string    `json:"web_url"`
	DefaultBranch  string    `json:"default_branch"`
	Topics         []string  `json:"topics"`
	LatestPipeline *Pipeline `json:"latest_pipeline"`
}

type Pipeline struct {
	Id        int       `json:"id"`
	Iid       int       `json:"iid"`
	ProjectId int       `json:"project_id"`
	Sha       string    `json:"sha"`
	Ref       string    `json:"ref"`
	Status    string    `json:"status"`
	Source    string    `json:"source"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	WebUrl    string    `json:"web_url"`
}

type Branch struct {
	Name           string    `json:"name"`
	Merged         bool      `json:"merged"`
	Protected      bool      `json:"protected"`
	Default        bool      `json:"default"`
	CanPush        bool      `json:"can_push"`
	WebUrl         string    `json:"web_url"`
	Commit         Commit    `json:"commit"`
	LatestPipeline *Pipeline `json:"latest_pipeline"`
}

type Commit struct {
	Id            string    `json:"id"`
	AuthorName    string    `json:"author_name"`
	CommitterName string    `json:"committer_name"`
	CommittedDate time.Time `json:"committed_date"`
	Title         string    `json:"title"`
	Message       string    `json:"message"`
}

type Schedule struct {
	Id             int       `json:"id"`
	Description    string    `json:"description"`
	Ref            string    `json:"ref"`
	Cron           string    `json:"cron"`
	CronTimezone   string    `json:"cron_timezone"`
	NextRunAt      time.Time `json:"next_run_at"`
	Active         bool      `json:"active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	Owner          User      `json:"owner"`
	Project        Project   `json:"project"`
	PipelineStatus string    `json:"pipeline_status"`
}

type User struct {
	Id       int    `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
	State    string `json:"state"`
	IsAdmin  bool   `json:"is_admin"`
}
