.PHONY: build up down clean

build:
	podman build --ulimit nofile=65536:65536 -t sashihiki-app .
	podman build -t sashihiki-db ./db

up: build
	podman-compose up -d

down:
	podman-compose down

clean:
	podman-compose down
	sudo rm -rf ./data/mysql
