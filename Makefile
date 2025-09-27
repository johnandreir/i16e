# DevOps Insight Engine - Docker Operations

.PHONY: help build up down logs clean dev prod

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Production environment
prod: ## Start production environment
	docker-compose -f docker-compose.prod.yml up -d

prod-build: ## Build and start production environment
	docker-compose -f docker-compose.prod.yml up -d --build

prod-down: ## Stop production environment
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## Show production logs
	docker-compose -f docker-compose.prod.yml logs -f

# Development environment
dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up -d

dev-build: ## Build and start development environment
	docker-compose -f docker-compose.dev.yml up -d --build

dev-down: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

dev-logs: ## Show development logs
	docker-compose -f docker-compose.dev.yml logs -f

# Default development environment
up: dev ## Alias for dev

down: dev-down ## Stop development environment

build: dev-build ## Build development environment

logs: dev-logs ## Show development logs

# Utility commands
clean: ## Clean up containers, images, and volumes
	docker-compose -f docker-compose.prod.yml down -v --remove-orphans
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f

clean-all: ## Clean everything including unused images
	docker-compose -f docker-compose.prod.yml down -v --remove-orphans
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -af

restart: down up ## Restart development environment

restart-prod: prod-down prod ## Restart production environment

# Health checks
health: ## Check health of all services
	@echo "Checking MongoDB API..."
	@curl -f http://localhost:3001/api/health || echo "API not healthy"
	@echo "\nChecking Frontend..."
	@curl -f http://localhost:8082/health || echo "Frontend not healthy"
	@echo "\nChecking N8N..."
	@curl -f http://localhost:5678/healthz || echo "N8N not healthy"