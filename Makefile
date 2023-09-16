build:
	cd api && go mod download && go build -v ./...

test:
	cd api && go test ./.../ --race

coverage:
	cd api &&	go test -coverprofile=cover.out -covermode=atomic ./.../ && go tool cover -html=cover.out -o cover.html
