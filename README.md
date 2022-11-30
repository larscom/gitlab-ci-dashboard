# Gitlab CI Dashboard

[![Docker Image Version](https://img.shields.io/docker/v/larscom/gitlab-ci-dashboard?sort=semver&label=latest%20release&color=blue)](https://hub.docker.com/r/larscom/gitlab-ci-dashboard)
[![Docker Image Size](https://img.shields.io/docker/image-size/larscom/gitlab-ci-dashboard?sort=semver)](https://hub.docker.com/r/larscom/gitlab-ci-dashboard)
[![License MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![master](https://github.com/larscom/gitlab-ci-dashboard/actions/workflows/master-build.yml/badge.svg?branch=master)](https://github.com/larscom/gitlab-ci-dashboard/actions/workflows/master-build.yml)
[![Docker Image Version By Date](https://img.shields.io/docker/v/larscom/gitlab-ci-dashboard?color=violet&label=latest%20build&sort=date)](https://hub.docker.com/r/larscom/gitlab-ci-dashboard/tags?page=1&name=master)

> Gitlab CI Dashboard will provide information about all pipeline statuses in Gitlab in one overview.

## Highlights

- View Gitlab CI pipeline statuses
- Communication to the Gitlab API happens server side (so only one API token needed)
- Read only (write actions needs to be done in Gitlab)
- Easy navigation to Gitlab from within the dashboard
- Small in size, low memory usage
- Shows all groups within Gitlab by default (configurable)

## Requirements

- Gitlab server (self hosted or https://gitlab.com)
- Supports `v4` only of the Gitlab API
- Docker

## Getting started

1. Generate a `read_api` access token in Gitlab (e.g: https://gitlab.com/-/profile/personal_access_tokens)

![Access Token](https://github.com/larscom/gitlab-ci-dashboard/blob/master/.github/img/access_token.png)

2. Run docker command with the required environment variables (GITLAB_BASE_URL, GITLAB_API_TOKEN)

```bash
docker run -p 8080:8080 -e GITLAB_BASE_URL=https://gitlab.com -e GITLAB_API_TOKEN=my_token larscom/gitlab-ci-dashboard:latest
```

3. Dashboard should be available at: http://localhost:8080/#/ showing (by default) all available groups and their projects

## Environment variables

| Variable                    | Type    | Description                                                                                            | Required |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------ | -------- |
| GITLAB_BASE_URL             | string  | The base url to the Gitlab server (e.g: https://gitlab.com)                                            | yes      |
| GITLAB_API_TOKEN            | string  | A readonly access token generated in Gitlab (see: https://gitlab.com/-/profile/personal_access_tokens) | yes      |
| GITLAB_GROUP_ONLY_IDS       | string  | Provide a comma seperated string of group ids which will only be visibile (e.g: 123,789,888)           | no       |
| GITLAB_GROUP_SKIP_IDS       | string  | Provide a comma seperated string of group ids which will be ignored (e.g: 123,789,888)                 | no       |
| GITLAB_GROUP_ONLY_TOP_LEVEL | boolean | Show only top level groups (no child groups)                                                           | no       |

## Why?

At the moment there is no overview of all pipeline statuses within Gitlab, so you might not be aware of a failed pipeline somewhere in Gitlab.

This dashboard is not a replacement for Gitlab, it is supposed to give you a `readonly` overview of all pipelines (configurable) within a Gitlab server.

## :fire: Notice

This app is under heavy development, not all features might be fully implemented yet :wink:
