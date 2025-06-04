# Makefile for Docker operations

.PHONY: help build up down dev dev-up dev-down logs clean

help:
	@echo "Available commands:"
	@echo "  make build      - Build production containers"
	@echo "  make up		 - Start production containers"
	@echo "  make down 		 - Stop containers"
	@echo "  make dev		 - Build and start development containers"
	@echo "  make dev-up	 - Start development containers"
	@echo "  make dev-down   - Stop development containers"
	@echo "  make logs       - View container logs"
	@echo "  make clean		 - Remove containers and volumes"

# Production commands
build:
	docker-compose build

up: 
	docker-compose up -d

down: 
	docker-compose down


# Development commands
dev: 
	docker-compose -f docker-compose.dev.yml up --build

dev-up:
	docker-compose -f docker-compose.dev.yml up -d 

dev-down:
	docker-compose -f docker-compose.dev.yml down 


# Utility commands
logs:
	docker-compose logs -f 

clean:
	docker-compose down -v 
	docker-compose -f docker-compose.dev.yml down -v