# syntax=docker/dockerfile:1

# Build frontend
FROM node:16.18.1-alpine AS frontend
WORKDIR /builder
COPY . .
RUN npm ci --legacy-peer-deps --ignore-scripts && \
  npm run build

# Build api, include frontend in JAR
FROM gradle:7.6.0-jdk17 AS gradle
WORKDIR /home/gradle
COPY --chown=gradle:gradle api .
COPY --chown=gradle:gradle --from=frontend /builder/dist/static ./src/main/resources/static
RUN gradle build || return 1

# Package JAR
FROM ibm-semeru-runtimes:open-17.0.5_8-jre
ARG VERSION_ARG
ENV VERSION=$VERSION_ARG

WORKDIR /opt/app
COPY --from=gradle /home/gradle/build/libs/*-SNAPSHOT.jar /opt/app/app.jar

EXPOSE 8080
CMD ["java", "-jar", "/opt/app/app.jar"]
