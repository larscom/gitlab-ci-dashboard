FROM node:24.12.0-alpine AS fe
WORKDIR /builder
COPY . .
RUN npm ci --legacy-peer-deps --ignore-scripts && npm run build

FROM rust:latest AS be
WORKDIR /builder
COPY api ./
RUN cargo build --release

FROM gcr.io/distroless/cc-debian12
WORKDIR /app
ARG VERSION_ARG
ENV VERSION=$VERSION_ARG
ENV RUST_LOG="info"
COPY --from=fe /builder/dist/gitlab-ci-dashboard/browser ./spa
COPY --from=be /builder/target/release/gcd_api ./gcd_api
CMD ["/app/gcd_api"]
