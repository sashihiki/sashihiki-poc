.PHONY: build up down clean dev dev-down dev-clean

# デプロイ用
build:
	podman build --ulimit nofile=65536:65536 -t sashihiki-app .
	podman build -t sashihiki-db ./db

up: build
	podman compose up -d

down:
	podman compose down

clean:
	podman compose down
	sudo rm -rf ./data/mysql

# ローカル開発用（DBのみ起動）
dev:
	podman build -t sashihiki-db ./db
	podman compose up -d db

dev-down:
	podman compose down

dev-clean:
	podman compose down
	sudo rm -rf ./data/mysql
