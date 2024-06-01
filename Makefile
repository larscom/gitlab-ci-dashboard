dev:
	make -j 2 run_fe run_api
.PHONY: dev

run_api:
	cd ./api && cargo watch -q -c -w ./src -x 'run -q'
.PHONY: run_api

run_fe:
	npm start
.PHONY: run_fe

test:
	cd ./api && cargo test --verbose
.PHONY: test