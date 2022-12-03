# syntax=docker/dockerfile:1

FROM node:16.18.1-alpine AS angular
WORKDIR /builder

COPY . .

RUN npm ci --legacy-peer-deps --ignore-scripts && npm run build

FROM golang:1.19.3-alpine AS golang
WORKDIR /builder

COPY api ./

RUN go mod download
RUN go build -o ./dist/api ./cmd/main.go

FROM alpine:3.17
WORKDIR /app
ARG VERSION_ARG
ENV VERSION=$VERSION_ARG
COPY --from=angular /builder/dist/gitlab-ci-dashboard ./statics
COPY --from=golang /builder/dist/api ./api
EXPOSE 8080
CMD ["/app/api"]
