package model

import (
	"time"
)

type ProjectWithPipeline struct {
	Project  Project   `json:"project"`
	Pipeline *Pipeline `json:"pipeline"`
}

type BranchWithPipeline struct {
	Branch   Branch    `json:"branch"`
	Pipeline *Pipeline `json:"pipeline"`
}

type ScheduleWithProjectAndPipeline struct {
	Schedule Schedule  `json:"schedule"`
	Project  Project   `json:"project"`
	Pipeline *Pipeline `json:"pipeline"`
}

type Group struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type Project struct {
	Id            int      `json:"id"`
	Name          string   `json:"name"`
	WebUrl        string   `json:"web_url"`
	DefaultBranch string   `json:"default_branch"`
	Topics        []string `json:"topics"`
}

type Branch struct {
	Name      string `json:"name"`
	Merged    bool   `json:"merged"`
	Protected bool   `json:"protected"`
	Default   bool   `json:"default"`
	CanPush   bool   `json:"can_push"`
	WebUrl    string `json:"web_url"`
	Commit    Commit `json:"commit"`
}
type Commit struct {
	Id            string    `json:"id"`
	AuthorName    string    `json:"author_name"`
	CommitterName string    `json:"committer_name"`
	CommittedDate time.Time `json:"committed_date"`
	Title         string    `json:"title"`
	Message       string    `json:"message"`
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

type Schedule struct {
	Id           int       `json:"id"`
	Description  string    `json:"description"`
	Ref          string    `json:"ref"`
	Cron         string    `json:"cron"`
	CronTimezone string    `json:"cron_timezone"`
	NextRunAt    time.Time `json:"next_run_at"`
	Active       bool      `json:"active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	Owner        User      `json:"owner"`
}
type User struct {
	Id       int    `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
	State    string `json:"state"`
	IsAdmin  bool   `json:"is_admin"`
}

type Job struct {
	Id                int       `json:"id"`
	Commit            Commit    `json:"commit"`
	AllowFailure      bool      `json:"allow_failure"`
	CreatedAt         time.Time `json:"created_at"`
	StartedAt         time.Time `json:"started_at"`
	FinishedAt        time.Time `json:"finished_at"`
	Duration          float64   `json:"duration"`
	QueuedDuration    float64   `json:"queued_duration"`
	ArtifactsExpireAt time.Time `json:"artifacts_expire_at"`
	Name              string    `json:"name"`
	Pipeline          Pipeline  `json:"pipeline"`
	Ref               string    `json:"ref"`
	Stage             string    `json:"stage"`
	Status            string    `json:"status"`
	FailureReason     string    `json:"failure_reason"`
	Tag               bool      `json:"tag"`
	WebUrl            string    `json:"web_url"`
	User              User      `json:"user"`
}
