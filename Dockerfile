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

# Build custom JRE (to reduce size)
FROM amazoncorretto:17.0.5-alpine as corretto-jdk
RUN apk add --no-cache binutils
RUN $JAVA_HOME/bin/jlink \
         --verbose \
         --add-modules ALL-MODULE-PATH \
         --strip-debug \
         --no-man-pages \
         --no-header-files \
         --compress=2 \
         --output /customjre

# Package JAR
FROM alpine:3.17
ARG VERSION_ARG
ENV VERSION=$VERSION_ARG
ENV JAVA_HOME=/jre
ENV PATH="${JAVA_HOME}/bin:${PATH}"

COPY --from=corretto-jdk /customjre $JAVA_HOME

WORKDIR /app
RUN adduser --no-create-home -u 1000 -D appuser && chown -R appuser /app
USER 1000
COPY --chown=1000:1000 --from=gradle /home/gradle/build/libs/*-SNAPSHOT.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT [ "/jre/bin/java", "-jar", "/app/app.jar" ]
