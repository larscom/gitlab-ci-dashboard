package model

import "time"

type GroupId int
type Group struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type ProjectId int
type Project struct {
	Id            int      `json:"id"`
	Name          string   `json:"name"`
	WebUrl        string   `json:"web_url"`
	DefaultBranch string   `json:"default_branch"`
	Topics        []string `json:"topics"`
}

type Pipeline struct {
	Id        int       `json:"id"`
	Iid       int       `json:"iid"`
	ProjectId int       `json:"project_id"`
	Sha       string    `json:"sha"`
	Status    string    `json:"status"`
	Source    string    `json:"source"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	WebUrl    string    `json:"web_url"`
}

type ProjectPipeline struct {
	Project  *Project  `json:"project"`
	Pipeline *Pipeline `json:"pipeline"`
}

type Branch struct {
	Name      string  `json:"name"`
	Merged    bool    `json:"merged"`
	Protected bool    `json:"protected"`
	Default   bool    `json:"default"`
	CanPush   bool    `json:"can_push"`
	WebUrl    string  `json:"web_url"`
	Commit    *Commit `json:"commit"`
}

type Commit struct {
	Id            string    `json:"id"`
	AuthorName    string    `json:"author_name"`
	CommitterName string    `json:"committer_name"`
	CommittedDate time.Time `json:"committed_date"`
	Title         string    `json:"title"`
	Message       string    `json:"message"`
}

type BranchPipeline struct {
	Branch   *Branch   `json:"branch"`
	Pipeline *Pipeline `json:"pipeline"`
}
