# Gitlab CI Dashboard

[![Docker Image Version](https://img.shields.io/docker/v/larscom/gitlab-ci-dashboard?sort=semver&label=latest%20release&color=blue)](https://hub.docker.com/r/larscom/gitlab-ci-dashboard)
[![Docker Image Size](https://img.shields.io/docker/image-size/larscom/gitlab-ci-dashboard?sort=semver)](https://hub.docker.com/r/larscom/gitlab-ci-dashboard)
[![License MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![master](https://github.com/larscom/gitlab-ci-dashboard/actions/workflows/master-build.yml/badge.svg?branch=master)](https://github.com/larscom/gitlab-ci-dashboard)
[![Docker Image Version By Date](https://img.shields.io/docker/v/larscom/gitlab-ci-dashboard?color=violet&label=latest%20build&sort=date)](https://hub.docker.com/r/larscom/gitlab-ci-dashboard/tags?page=1&name=master)

> Gitlab CI Dashboard will provide you information about all pipeline statuses in Gitlab.

### ✨ [Demo Dashboard](https://gitlab-ci-dashboard-g2yczvalwa-ez.a.run.app)

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

3. Dashboard should be available at: http://localhost:8080/#/ showing (by default) all available groups and their projects

## Gitlab specific env variables

| Variable                    | Type    | Description                                                                                            | Required | Default |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------ | -------- | ------- |
| GITLAB_BASE_URL             | string  | The base url to the Gitlab server (e.g: https://gitlab.com)                                            | yes      |         |
| GITLAB_API_TOKEN            | string  | A readonly access token generated in Gitlab (see: https://gitlab.com/-/profile/personal_access_tokens) | yes      |         |
| GITLAB_GROUP_ONLY_IDS       | string  | Provide a comma seperated string of group ids which will only be displayed (e.g: 123,789,888)          | no       |         |
| GITLAB_GROUP_SKIP_IDS       | string  | Provide a comma seperated string of group ids which will be ignored (e.g: 123,789,888)                 | no       |         |
| GITLAB_GROUP_ONLY_TOP_LEVEL | boolean | Show only top level groups                                                                             | no       | false   |

## Server specific env variables

| Variable                 | Type    | Description                                             | Default |
| ------------------------ | ------- | ------------------------------------------------------- | ------- |
| SERVER_CACHE_TTL_SECONDS | integer | Time to Live (in seconds) for projects/groups/pipelines | 10      |
| SERVER_DEBUG             | boolean | Gives you more logging to see what is happening         | false   |

## Why?

At the moment there is no overview of all pipeline statuses within Gitlab, so you might not be aware of a failed pipeline somewhere in Gitlab.

This dashboard is `not` a replacement for Gitlab, it is supposed to give you a `readonly` overview of all pipelines (configurable) within a Gitlab server. Maybe more functionality is there to come later.

## Run without docker (development)

Be sure you have the following dependencies installed

- Node 14+
- Go 1.19+

1. Run: `mv ./api/.local.example.env ./api/.local.env` <-- fill in the required env variables
2. Run: `npm ci` <-- install frontend packages
3. Run: `npm run api` <-- starts backend
4. Run: `npm start` <-- starts frontend
5. Open browser and goto: http://localhost:4200
