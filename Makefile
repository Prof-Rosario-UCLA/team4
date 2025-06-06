# Makefile for Single Container Docker operations

.PHONY: help build run stop logs clean

help:
	@echo "Available commands:"
	@echo "  make build      - Build the container"
	@echo "  make run        - Run the container"
	@echo "  make stop       - Stop the container"
	@echo "  make logs       - View container logs"
	@echo "  make clean      - Remove container and image"

# Single container commands
build:
	docker build -t oversea-app .

run:
	docker run -d --name oversea-app -p 3000:3000 -p 8000:8000 --env-file .env oversea-app

stop:
	docker stop oversea-app || true
	docker rm oversea-app || true

logs:
	docker logs -f oversea-app

clean:
	docker stop oversea-app || true
	docker rm oversea-app || true
	docker rmi oversea-app || true