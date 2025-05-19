.PHONY: install

install:
	cd client && npm install
	cd server && npm install

up-dev:
	docker compose up -d --build

down:
	docker compose down

redis-clear:
	docker exec -it dev-redis redis-cli FLUSHALL