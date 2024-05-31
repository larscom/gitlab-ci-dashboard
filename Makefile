dev:
	make -j 2 run_api run_fe
.PHONY: dev

run_api:
	cd ./api && cargo watch -q -c -w ./src -x 'run -q'
.PHONY: run_api

run_fe:
	npm start
.PHONY: run_fe