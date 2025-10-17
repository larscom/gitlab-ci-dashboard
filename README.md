# Gitlab CI Dashboard

[![Docker Image Version](https://img.shields.io/docker/v/larscom/gitlab-ci-dashboard?sort=semver&label=latest%20release&color=blue)](https://hub.docker.com/r/larscom/gitlab-ci-dashboard)
[![workflow](https://github.com/larscom/gitlab-ci-dashboard/actions/workflows/workflow.yml/badge.svg)](https://github.com/larscom/gitlab-ci-dashboard/actions/workflows/workflow.yml)
[![License MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![Preview](https://github.com/larscom/gitlab-ci-dashboard/blob/main/.github/img/preview.png)

<br />

Gitlab CI Dashboard will provide you with a **global** overview of all pipelines, schedules, and their statuses within a
single group.
The default functionality of Gitlab is limited at the project level. This can become hard to manage when you have a lot
of
projects, potentially resulting in undetected failed pipelines.

## 👉 [Demo](https://gitlab-ci-dashboard.larscom.nl)

<br />

## 🚀 Highlights

- View all pipeline statuses per group (e.g: failed/canceled/success)
- View all pipeline schedules per group
- You won't get rate limited by the Gitlab API, due to server-side caching
- Communication to the Gitlab API happens only server side
- Only 1 `read only` token is needed to serve a whole team
    - Optionally use a `read/write` token to perform actions like restarting failed pipelines, create new pipelines or
      cancel pipelines.

## ✅ Features (DONE)

- [x] Overview of all latest pipeline statuses within a group
- [x] Overview of all pipeline statuses within a group
- [x] Overview of all schedules within a group
- [x] Navigate to Gitlab
- [x] Shows jobs and their status per pipeline
- [x] Download artifacts from jobs directly
- [x] Search for projects within a group
- [x] Filter pipelines by status
- [x] Filter pipelines by projects and topic
- [x] Filter pipelines by failed jobs
- [x] Add projects to favorites
- [x] Start a new pipeline (requires read/write API token)
- [x] Restart failed pipelines (requires read/write API token)
- [x] Cancel pipelines (requires read/write API token)

## 📒 Features (PLANNED)

- [ ] Overview of all registries (container/package) within a group
- [ ] ... suggestions are welcome

## ⚡️ Requirements

- Gitlab server (v4 API)
- API token (read only or read/write)
- Docker

## 💡 Getting started

1. Generate a `read_api` or `api` access token in Gitlab, depending on your requirements (
   e.g: https://gitlab.com/-/profile/personal_access_tokens)

![Access Token](https://github.com/larscom/gitlab-ci-dashboard/blob/main/.github/img/access_token.png)

2. Run docker with the required environment variables (GITLAB_BASE_URL, GITLAB_API_TOKEN)

```bash
docker run \
  -p 8080:8080 \
  -e GITLAB_BASE_URL=https://gitlab.com \
  -e GITLAB_API_TOKEN=my_token \
  larscom/gitlab-ci-dashboard:latest
```

Or you can run it with a TOML configration file

```bash
docker run \
  -p 8080:8080 \
  -e GITLAB_BASE_URL=https://gitlab.com \
  -e GITLAB_API_TOKEN=my_token \
  -v ./config.toml:/app/config.toml \
  larscom/gitlab-ci-dashboard:latest
```

3. Dashboard should be available at: http://localhost:8080/ showing (by default) all available groups and their
   projects

## 👉 Create/Cancel/Retry Pipelines

You are able to perform write operations like creating,canceling,retrying pipelines, but you need to set the environment
variable: `API_READ_ONLY` to `false` and provide a valid `read/write` access token.

## 👉 Hide the 'write' operations button

You are able to hide the ellipsis (...) when you just want to use `READ_ONLY` mode. Set the `UI_HIDE_WRITE_ACTIONS` to
true.

## ⏰ Prometheus

Prometheus metrics are exposed on the following endpoint

> http://localhost:8080/metrics/prometheus

## 🔌 Configration

You have the option to set the configuration via environment variables or a TOML file.
A TOML file takes precedence over environment variables, except for the `RUST_LOG` variable.

### Load from TOML file

> An example TOML file can be found inside the `./api` folder.

Mount the `config.toml` inside the container (`/app/config.toml`)

```bash
docker run \
  -p 8080:8080 \
  -e GITLAB_BASE_URL=https://gitlab.com \
  -e GITLAB_API_TOKEN=my_token \
  -v ./config.toml:/app/config.toml \
  larscom/gitlab-ci-dashboard:latest
```

## 📜 Custom CA certificate
If you are running a gitlab instance that is using a TLS certificate signed with a private CA you are able to provide that CA as mount (PEM encoded)

This is needed when the dashboard backend is unable to make a connection to the gitlab API over HTTPS.

Mount the `ca.crt` inside the container (`/app/certs/ca.crt`)

```bash
docker run \
  -p 8080:8080 \
  -e GITLAB_BASE_URL=https://gitlab.com \
  -e GITLAB_API_TOKEN=my_token \
  -v ./ca.crt:/app/certs/ca.crt \
  larscom/gitlab-ci-dashboard:latest
```

### Troubleshooting
If you are still unable to connect with a custom CA cert, be sure that the gitlab server certificate contains a valid SAN (Subject Alternative Name)

If there is a mismatch the HTTP client is still unable to make a proper connection.

## 🌍 Environment variables

| Variable                          | Type   | Description                                                                                                                        | Required | Default      |
|-----------------------------------|--------|------------------------------------------------------------------------------------------------------------------------------------|----------|--------------|
| GITLAB_BASE_URL                   | string | The base url to the Gitlab server (e.g: https://gitlab.com)                                                                        | yes      |              |
| GITLAB_API_TOKEN                  | string | A readonly or read/write access token generated in Gitlab (see: https://gitlab.com/-/profile/personal_access_tokens)               | yes      |              |
| GITLAB_GROUP_ONLY_IDS             | string | Provide a comma seperated string of group ids which will only be displayed (e.g: 123,789,888)                                      | no       |              |
| GITLAB_GROUP_SKIP_IDS             | string | Provide a comma seperated string of group ids which will be ignored (e.g: 123,789,888)                                             | no       |              |
| GITLAB_GROUP_ONLY_TOP_LEVEL       | bool   | Show only top level groups, projects in sub groups will be shown inside the top level groups (see: GITLAB_GROUP_INCLUDE_SUBGROUPS) | no       | true         |
| GITLAB_GROUP_INCLUDE_SUBGROUPS    | bool   | Whether to include subgroup projects whenever projects are fetched for a specific group                                            | no       | true         |
| GITLAB_GROUP_CACHE_TTL_SECONDS    | int    | Expire after write time in seconds for groups (cache)                                                                              | no       | 300          |
| GITLAB_PROJECT_SKIP_IDS           | string | Provide a comma seperated string of project ids which will be ignored (e.g: 123,789,888)                                           | no       |              |
| GITLAB_PROJECT_CACHE_TTL_SECONDS  | int    | Expire after write time in seconds for projects (cache)                                                                            | no       | 300          |
| GITLAB_PIPELINE_CACHE_TTL_SECONDS | int    | Expire after write time in seconds for pipelines (cache)                                                                           | no       | 5            |
| GITLAB_PIPELINE_HISTORY_DAYS      | int    | How far back in time (days), it should fetch pipelines from gitlab (pipelines tab only)                                            | no       | 5            |
| GITLAB_BRANCH_CACHE_TTL_SECONDS   | int    | Expire after write time in seconds for branches (cache)                                                                            | no       | 60           |
| GITLAB_SCHEDULE_CACHE_TTL_SECONDS | int    | Expire after write time in seconds for schedules (cache)                                                                           | no       | 300          |
| GITLAB_JOB_CACHE_TTL_SECONDS      | int    | Expire after write time in seconds for jobs (cache)                                                                                | no       | 5            |
| GITLAB_ARTIFACT_CACHE_TTL_SECONDS | int    | Expire after write time in seconds for artifacts (cache)                                                                           | no       | 1800         |
| API_READ_ONLY                     | bool   | If true, you are not able to perform 'write' operations like retrying a pipeline                                                   | no       | true         |
| UI_HIDE_WRITE_ACTIONS             | bool   | If true, the ellipsis action button (...) is hidden, handy if you want to use this application in read-only mode                   | no       | false        |
| SERVER_LISTEN_IP                  | string | The IP address where the web server should listen on                                                                               | no       | 0.0.0.0      |
| SERVER_LISTEN_PORT                | int    | The port where the web server should listen on                                                                                     | no       | 8080         |
| SERVER_WORKER_COUNT               | int    | The amount of worker threads the web server should have                                                                            | no       | CPU specific |
| RUST_LOG                          | string | The log level of the application, set to "debug" to enable debug logging                                                           | no       | info         |
