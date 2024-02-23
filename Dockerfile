# syntax=docker/dockerfile:1

FROM node:20.9.0-alpine AS fe
WORKDIR /builder

COPY . .

RUN npm ci --legacy-peer-deps --ignore-scripts && npm run build

FROM golang:1.22.0-alpine AS be
WORKDIR /builder

COPY api ./

RUN go mod download
RUN go build -o ./dist/api ./main.go

FROM alpine:latest

WORKDIR /app

ARG VERSION_ARG
ENV VERSION=$VERSION_ARG

COPY --from=fe /builder/dist/gitlab-ci-dashboard/browser ./static
COPY --from=be /builder/dist/api ./api

CMD ["/app/api"]
