# ==============================================================================
# AI Negotiation Service - Makefile
# ==============================================================================
# Common commands for development, testing, and deployment
# Usage: make <target>
# ==============================================================================

.PHONY: help install dev test lint format typecheck clean docker-build docker-up docker-down serve

# Default target
help:
	@echo "Available commands:"
	@echo "  make install      - Install production dependencies"
	@echo "  make dev          - Install development dependencies"
	@echo "  make serve        - Start development server"
	@echo "  make test         - Run all tests"
	@echo "  make test-cov     - Run tests with coverage report"
	@echo "  make lint         - Run linter (ruff)"
	@echo "  make format       - Format code (ruff)"
	@echo "  make typecheck    - Run type checker (mypy)"
	@echo "  make clean        - Remove cache files"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"

# ============ Installation ============

install:
	pip install -e .

dev:
	pip install -e ".[dev]"

# ============ Development ============

serve:
	uvicorn main:app --reload --host 0.0.0.0 --port 8001

# After refactoring, use:
# serve-new:
# 	uvicorn src.interfaces.fast_api.main:app --reload --host 0.0.0.0 --port 8001

demo:
	streamlit run demo_ui.py

# ============ Testing ============

test:
	pytest tests/ -v --tb=short

test-cov:
	pytest tests/ -v --cov=. --cov-report=html --cov-report=term-missing

test-unit:
	pytest tests/unit/ -v --tb=short

test-integration:
	pytest tests/integration/ -v --tb=short

# ============ Code Quality ============

lint:
	ruff check .

format:
	ruff check --fix .
	ruff format .

typecheck:
	mypy src/ --ignore-missing-imports

quality: lint typecheck
	@echo "All quality checks passed!"

# ============ Docker ============

docker-build:
	docker build -t ai-negotiation-service .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f ai

docker-shell:
	docker-compose exec ai /bin/bash

# ============ Cleanup ============

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
