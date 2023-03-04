# syntax=docker/dockerfile:1

# Build frontend
FROM node:16.19.1-alpine AS frontend
WORKDIR /builder
COPY . .

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@7.28.0 --activate

RUN pnpm install --frozen-lockfile && pnpm run build

# Build api, include frontend in JAR
FROM gradle:7.6.0-jdk17 AS gradle
ARG VERSION_ARG
WORKDIR /home/gradle
COPY --chown=gradle:gradle api .
COPY --chown=gradle:gradle --from=frontend /builder/dist/static ./src/main/resources/static
RUN gradle build -x test -Pversion=$VERSION_ARG || return 1

# Package JAR
FROM ibm-semeru-runtimes:open-17.0.5_8-jre
ARG VERSION_ARG
ENV VERSION=$VERSION_ARG

WORKDIR /opt/app
COPY --from=gradle /home/gradle/build/libs/*-$VERSION.jar /opt/app/app.jar

EXPOSE 8080
CMD ["java", "-Xmx512m", "-jar", "/opt/app/app.jar"]
