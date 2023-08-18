# Gitlab CI Dashboard

[![Docker Image Version](https://img.shields.io/docker/v/larscom/gitlab-ci-dashboard?sort=semver&label=latest%20release&color=blue)](https://hub.docker.com/r/larscom/gitlab-ci-dashboard)
[![Dockerhub Pulls](https://img.shields.io/docker/pulls/larscom/gitlab-ci-dashboard)](https://hub.docker.com/r/larscom/gitlab-ci-dashboard)
[![Docker Image Size](https://img.shields.io/docker/image-size/larscom/gitlab-ci-dashboard?sort=semver)](https://hub.docker.com/r/larscom/gitlab-ci-dashboard)
[![codecov](https://codecov.io/gh/larscom/gitlab-ci-dashboard/branch/master/graph/badge.svg?token=PK57YGR5YA)](https://codecov.io/gh/larscom/gitlab-ci-dashboard)

[![workflow](https://github.com/larscom/gitlab-ci-dashboard/actions/workflows/workflow.yml/badge.svg)](https://github.com/larscom/gitlab-ci-dashboard/actions/workflows/workflow.yml)
[![License MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![Preview](https://github.com/larscom/gitlab-ci-dashboard/blob/master/.github/img/preview.png)

<br />


Gitlab CI Dashboard will provide you with a **global** overview of all pipelines, schedules, and their statuses within a single group.
The default functionality of Gitlab is limited at the project level. This can become problematic when you have a lot of projects to manage, potentially resulting in undetected failed pipelines.

## 👉 [Demo (master)](https://gitlab-ci-dashboard.larscom.nl)

> Demo may contain functionality that has not been released yet.

<br />

## 🚀 Highlights

- View all pipeline statuses per group (e.g: failed/canceled/success)
- View all pipeline schedules per group
- You won't get rate limited by the Gitlab API, due to server-side caching
- Communication to the Gitlab API happens only server side
- Only 1 `read only` token is needed to serve a whole team

## 📒 Checklist

- [x] Overview of all latest pipeline statuses within a group
- [x] Overview of all pipeline statuses within a group
- [x] Overview of all schedules within a group
- [ ] Overview of all artifacts within a group
- [ ] ...

## ⚡️ Requirements

- Gitlab server (v4 API)
- Readonly API token
- Docker

## 💡 Getting started

1. Generate a `read_api` access token in Gitlab (e.g: https://gitlab.com/-/profile/personal_access_tokens)

![Access Token](https://github.com/larscom/gitlab-ci-dashboard/blob/master/.github/img/access_token.png)

2. Run docker with the required environment variables (GITLAB_BASE_URL, GITLAB_API_TOKEN)

```bash
docker run -p 8080:8080 -e GITLAB_BASE_URL=https://example.gitlab.com -e GITLAB_API_TOKEN=my_token larscom/gitlab-ci-dashboard:latest
```

3. Dashboard should be available at: http://localhost:8080/ showing (by default) all available groups and their
   projects

<br />

## ⏰ Metrics

### Prometheus

> http://localhost:8080/metrics/prometheus

### Fiber

> http://localhost:8080/metrics

<br />

## 🔌 Environment variables

| Variable                          | Type    | Description                                                                                            | Required | Default |
| --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ | -------- | ------- |
| GITLAB_BASE_URL                   | string  | The base url to the Gitlab server (e.g: https://gitlab.com)                                            | yes      |         |
| GITLAB_API_TOKEN                  | string  | A readonly access token generated in Gitlab (see: https://gitlab.com/-/profile/personal_access_tokens) | yes      |         |
| GITLAB_GROUP_ONLY_IDS             | string  | Provide a comma seperated string of group ids which will only be displayed (e.g: 123,789,888)          | no       |         |
| GITLAB_GROUP_SKIP_IDS             | string  | Provide a comma seperated string of group ids which will be ignored (e.g: 123,789,888)                 | no       |         |
| GITLAB_GROUP_ONLY_TOP_LEVEL       | boolean | Show only top level groups                                                                             | no       | false   |
| GITLAB_GROUP_CACHE_TTL_SECONDS    | int     | Expire after write time in seconds for groups (cache)                                                  | no       | 300     |
| GITLAB_PROJECT_SKIP_IDS           | string  | Provide a comma seperated string of project ids which will be ignored (e.g: 123,789,888)               | no       |         |
| GITLAB_PROJECT_CACHE_TTL_SECONDS  | int     | Expire after write time in seconds for projects (cache)                                                | no       | 300     |
| GITLAB_PROJECT_HIDE_UNKNOWN       | boolean | Hide projects with 'unknown' pipeline status (mostly means that the pipeline is not configured)        | no       | false   |
| GITLAB_PIPELINE_CACHE_TTL_SECONDS | int     | Expire after write time in seconds for pipelines (cache)                                               | no       | 10      |
| GITLAB_PIPELINE_HISTORY_DAYS      | int     | How far back in time (days), it should fetch pipelines from gitlab                                     | no       | 5       |
| GITLAB_BRANCH_CACHE_TTL_SECONDS   | int     | Expire after write time in seconds for branches (cache)                                                | no       | 60      |
| GITLAB_SCHEDULE_CACHE_TTL_SECONDS | int     | Expire after write time in seconds for schedules (cache)                                               | no       | 300     |
