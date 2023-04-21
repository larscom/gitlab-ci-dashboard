# syntax=docker/dockerfile:1

FROM node:18.16.0-alpine AS react
WORKDIR /builder

COPY . .

RUN npm ci --legacy-peer-deps --ignore-scripts && npm run build

FROM golang:1.20.2-alpine AS golang
WORKDIR /builder

COPY api ./

RUN go mod download
RUN go build -o ./dist/api ./main.go

FROM alpine:3.17.3

WORKDIR /app

ARG VERSION_ARG
ENV VERSION=$VERSION_ARG

COPY --from=react /builder/dist/static ./static
COPY --from=golang /builder/dist/api ./api

EXPOSE 8080

CMD ["/app/api"]