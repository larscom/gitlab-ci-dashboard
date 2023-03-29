# syntax=docker/dockerfile:1

FROM node:16.19.1-alpine AS react
WORKDIR /builder

COPY . .

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@7.28.0 --activate
RUN pnpm install --frozen-lockfile && pnpm run build

FROM golang:1.20.2-alpine AS golang
WORKDIR /builder

COPY api ./

RUN go mod download
RUN go build -o ./dist/api ./main.go

FROM alpine:3.17

WORKDIR /app

ARG VERSION_ARG
ENV VERSION=$VERSION_ARG

COPY --from=react /builder/dist/static ./static
COPY --from=golang /builder/dist/api ./api

EXPOSE 8080

CMD ["/app/api"]