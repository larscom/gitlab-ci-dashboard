# Gitlab CI Dashboard

[![Docker Image Version](https://img.shields.io/docker/v/larscom/gitlab-ci-dashboard?sort=semver&label=latest%20release&color=blue)](https://hub.docker.com/r/larscom/gitlab-ci-dashboard)
[![License MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![master](https://github.com/larscom/gitlab-ci-dashboard/actions/workflows/master-build.yml/badge.svg?branch=master)](https://github.com/larscom/gitlab-ci-dashboard)

> Gitlab CI Dashboard will provide you information about all pipeline statuses in Gitlab.

### ✨ [Demo Dashboard](https://gitlab-ci-dashboard.larscom.nl)

## :fire: Notice

This app is under heavy development, not all features might be fully implemented yet :wink:

## Highlights

- View Gitlab CI pipeline statuses (maybe more functionality will be added later) uses the default branch by default
- Communication to the Gitlab API happens server side (only 1 `read only` token is needed for you or your team)
- Easy navigation to Gitlab from within the dashboard
- Configurable caching (to handle rate limit or reduce load)

## Requirements

- Gitlab server (can be self hosted)
- Supports only `v4` of the Gitlab API
- Docker

## Versioning

- larscom/gitlab-ci-dashboard:x.x.x `specific release version, e.g: 1.1.0`
- larscom/gitlab-ci-dashboard:latest `latest release`
- larscom/gitlab-ci-dashboard:master `latest master build`

## Getting started

1. Generate a `read_api` access token in Gitlab (e.g: https://gitlab.com/-/profile/personal_access_tokens)

![Access Token](https://github.com/larscom/gitlab-ci-dashboard/blob/master/.github/img/access_token.png)

2. Run docker with the required environment variables (GITLAB_BASE_URL, GITLAB_API_TOKEN)

```bash
docker run -p 8080:8080 -e GITLAB_BASE_URL=https://example.gitlab.com -e GITLAB_API_TOKEN=my_token larscom/gitlab-ci-dashboard
```

3. Dashboard should be available at: http://localhost:8080/ showing (by default) all available groups and their
   projects

## Metrics (Prometheus)
Application metrics are exposed on url: http://localhost:8080/actuator/prometheus

## Environment variables

| Variable                          | Type     | Description                                                                                            | Required | Default |
|-----------------------------------|----------|--------------------------------------------------------------------------------------------------------|----------|---------|
| GITLAB_BASE_URL                   | string   | The base url to the Gitlab server (e.g: https://gitlab.com)                                            | yes      |         |
| GITLAB_API_TOKEN                  | string   | A readonly access token generated in Gitlab (see: https://gitlab.com/-/profile/personal_access_tokens) | yes      |         |
| GITLAB_GROUP_ONLY_IDS             | string   | Provide a comma seperated string of group ids which will only be displayed (e.g: 123,789,888)          | no       |         |
| GITLAB_GROUP_SKIP_IDS             | string   | Provide a comma seperated string of group ids which will be ignored (e.g: 123,789,888)                 | no       |         |
| GITLAB_GROUP_ONLY_TOP_LEVEL       | boolean  | Show only top level groups                                                                             | no       | false   |
| GITLAB_GROUP_CACHE_TTL_DURATION   | duration | Expire after write duration for groups (cache)                                                         | no       | 5m      |
| GITLAB_PROJECT_SKIP_IDS           | string   | Provide a comma seperated string of project ids which will be ignored (e.g: 123,789,888)               | no       |         |
| GITLAB_PROJECT_CACHE_TTL_SECONDS  | long     | Expire after write time in seconds for projects (cache)                                                | no       | 300     |
| GITLAB_PROJECT_HIDE_UNKNOWN       | boolean  | Hide projects with 'unknown' pipeline status (mostly means that the pipeline is not configured)        | no       | false   |
| GITLAB_PIPELINE_CACHE_TTL_SECONDS | long     | Expire after write time in seconds for pipelines (cache)                                               | no       | 10      |
| GITLAB_BRANCH_CACHE_TTL_SECONDS   | long     | Expire after write time in seconds for branches (cache)                                                | no       | 60      |

## Why?

At the moment there is no overview of all pipeline statuses within Gitlab, so you might not be aware of a failed
pipeline somewhere in Gitlab.

This dashboard is supposed to give you a `readonly` overview of all pipelines (configurable) within a Gitlab server.
Maybe more functionality is there to come later.
