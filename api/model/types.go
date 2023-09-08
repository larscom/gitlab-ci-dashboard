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

type GroupId int
type Group struct {
	Id   GroupId `json:"id"`
	Name string  `json:"name"`
}

type ProjectId int
type Project struct {
	Id            ProjectId `json:"id"`
	Name          string    `json:"name"`
	WebUrl        string    `json:"web_url"`
	DefaultBranch string    `json:"default_branch"`
	Topics        []string  `json:"topics"`
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

type PipelineId int
type Pipeline struct {
	Id        PipelineId `json:"id"`
	Iid       int        `json:"iid"`
	ProjectId ProjectId  `json:"project_id"`
	Sha       string     `json:"sha"`
	Ref       string     `json:"ref"`
	Status    string     `json:"status"`
	Source    string     `json:"source"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	WebUrl    string     `json:"web_url"`
}

type ScheduleId int
type Schedule struct {
	Id           ScheduleId `json:"id"`
	Description  string     `json:"description"`
	Ref          string     `json:"ref"`
	Cron         string     `json:"cron"`
	CronTimezone string     `json:"cron_timezone"`
	NextRunAt    time.Time  `json:"next_run_at"`
	Active       bool       `json:"active"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	Owner        User       `json:"owner"`
}
type User struct {
	Id       int    `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
	State    string `json:"state"`
	IsAdmin  bool   `json:"is_admin"`
}
