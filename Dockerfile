# syntax=docker/dockerfile:1

FROM node:18.18.0-alpine AS fe
WORKDIR /builder

COPY . .

RUN npm ci --legacy-peer-deps --ignore-scripts && npm run build

FROM golang:1.21.1-alpine AS be
WORKDIR /builder

COPY api ./

RUN go mod download
RUN go build -o ./dist/api ./main.go

FROM alpine:3.18.3

WORKDIR /app

ARG VERSION_ARG
ENV VERSION=$VERSION_ARG

COPY --from=fe /builder/dist/gitlab-ci-dashboard ./static
COPY --from=be /builder/dist/api ./api

EXPOSE 8080

CMD ["/app/api"]
