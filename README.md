# LiveCommerce Core

> **High-Concurrency Livestream E-commerce Backend Engine**
> Built for extreme traffic spikes, zero oversell, and AI-powered live chat.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_+_pgvector-blue)](https://github.com/pgvector/pgvector)
[![Redis](https://img.shields.io/badge/Redis-7_Alpine-red)](https://redis.io/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13_Management-orange)](https://www.rabbitmq.com/)

---

## What is this?

LiveCommerce Core is the backend engine for a **Livestream E-commerce platform** — similar to TikTok Shop or Shopee Live. It solves the hardest engineering problems in social commerce:

| Problem | Solution |
|---|---|
| 10,000 people buying the same item at once | Redis Lua Script (atomic, microsecond-fast) |
| Bot spam flooding checkout | Sliding Window Rate Limiter |
| Client double-click / network retry creating 2 orders | Idempotency Keys (Redis SET NX) |
| DB insert fails after stock deducted | Compensation Transaction + Dead Letter Queue |
| Streamer's AI assistant answering wrong shop's questions | Multi-tenant Data Isolation (shop_id filter on all vector queries) |
| Finding out where an order failed | Distributed Tracing via X-Trace-Id |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     LIVECOMMERCE CORE                        │
│                                                              │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  API Server    │  │  Order Worker   │  │  AI Agent    │ │
│  │  Express.js    │  │  RabbitMQ       │  │  LangChain   │ │
│  │  + SSE         │  │  Consumer       │  │  + pgvector  │ │
│  └───────┬────────┘  └────────┬────────┘  └──────┬───────┘ │
│          │                    │                   │          │
│  ────────┴────────────────────┴───────────────────┴───────  │
│  PostgreSQL (pgvector) │ Redis │ RabbitMQ + DLQ             │
└──────────────────────────────────────────────────────────────┘
```

### Flash Sale Flow
```
Client → [Auth] → [RateLimit] → [Idempotency] → [Lua Atomic Checkout]
      → RabbitMQ → Worker → PostgreSQL INSERT
      → (on fail) Compensation ROLLBACK → Dead Letter Queue
```

### AI Chat Flow
```
User Chat → [RateLimit] → [Guardrail] → LangChain ReAct Agent
          → [CheckStockTool (Redis)] | [GetProductInfoTool (pgvector)]
          → gpt-4o-mini → Streaming Response
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22 LTS |
| Language | TypeScript | 5.x |
| Web Framework | Express.js | 4.x |
| Primary Database | PostgreSQL | 16 |
| Vector Database | pgvector | 0.7+ |
| Cache & Locks | Redis | 7 Alpine |
| Message Broker | RabbitMQ | 3.13 Management |
| AI Orchestration | LangChain.js | 0.3+ |
| AI LLM | OpenAI gpt-4o-mini | API v1 |
| AI Embedding | text-embedding-3-small | API v1 |
| AI Observability | LangSmith | 0.2+ |
| Containerization | Docker Compose | v2 |

---

## Project Structure

```
LiveCommerce/
├── backend/               # BACKEND MONOREPO WORKSPACE
│   ├── apps/
│   │   ├── api-server/    # HTTP API entrypoint
│   │   └── order-worker/  # RabbitMQ consumer (background)
│   ├── src/
│   │   ├── config/        # Centralized env config
│   │   ├── http/          # HTTP layer (controllers, routes, middlewares)
│   │   ├── services/      # Business logic (use cases)
│   │   ├── stores/        # Data access layer (postgres, redis, rabbitmq)
│   │   ├── domain/        # Types & Repository contracts
│   │   ├── ai/            # AI Harness (agent, tools, RAG, guardrails)
│   │   ├── sse/           # SSE connection lifecycle manager
│   │   └── infrastructure/# Technical adapters (DB, Redis, Queue, LLM)
│   ├── shared/            # Cross-cutting utilities (logger, errors, limiter)
│   ├── tests/             # Backend unit tests
│   ├── package.json       # Backend workspace scripts and deps
│   └── tsconfig.json      # Backend TS compilation rules
├── frontend/              # FRONTEND WORKSPACES
│   ├── buyer-app/         # Next.js customer interface
│   ├── streamer-dashboard/# Vite livestream dashboard
│   └── admin-panel/       # Vite admin panel
├── docker/                # Infrastructure configurations
│   ├── postgres/init.sql  # Schema + pgvector HNSW index
│   └── rabbitmq/          # DLQ + exchange setup
├── tests/                 # Monorepo tests (E2E, Load)
│   ├── e2e/               # Playwright tests
│   └── load/              # K6 load testing scripts
├── package.json           # Root workspace configurations
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 22 LTS](https://nodejs.org/)
- [K6](https://k6.io/) (optional, for load testing)

### 1. Clone & Install

```bash
git clone <repo-url>
cd LiveCommerce
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY and other secrets
```

### 3. Start Infrastructure

```bash
npm run infra:up
# OR
docker compose up -d
```

Verify all services are healthy:
```bash
docker compose ps
# Expected: postgres (healthy), redis (healthy), rabbitmq (healthy)
```

### 4. Run Development Server

```bash
# Terminal 1 — API Server
npm run backend:dev

# Terminal 2 — Order Worker
npm run backend:worker
```

### 5. Health Check

```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"2026-..."}
```

---

## Key Endpoints (Planned — Phase 2)

| Method | Endpoint | Pillar | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | Login, get JWT |
| `POST` | `/api/checkout` | 2 | Flash Sale checkout |
| `POST` | `/api/ai/chat` | 3 | AI chat (SSE stream) |
| `POST` | `/api/knowledge/ingest` | 3 | Upload shop FAQ/docs |
| `GET`  | `/api/sse/dashboard` | 4 | Real-time streamer dashboard |

---

## Load Testing

```bash
# Install K6
winget install k6 --id Grafana.k6

# Run Flash Sale load test (500 VUs, 30s)
k6 run tests/load/flash-sale.k6.js \
  -e BASE_URL=http://localhost:3000 \
  -e TOKEN=<your_jwt> \
  -e PRODUCT_ID=<product_uuid>
```

Expected results: exactly `[stock_quantity]` orders confirmed, zero oversell.

---

## Monitoring

- **RabbitMQ Dashboard:** http://localhost:15672 (user: livecommerce / secret)
- **LangSmith Tracing:** https://smith.langchain.com (set `LANGCHAIN_TRACING_V2=true`)
- **Application Logs:** Every log line includes `[TraceId:xxx]` for distributed tracing

---

## Development Commands

```bash
npm run backend:dev           # Start API server (hot reload)
npm run backend:worker        # Start Order Worker (hot reload)
npm run backend:type-check    # Run TypeScript type check (no emit)
npm run backend:build         # Compile backend to backend/dist/
npm run backend:test          # Run backend unit tests
npm run backend:test:coverage # Run backend tests with coverage check
npm run test:e2e              # Run Playwright E2E tests
npm run format                # Run Prettier format check and fix
npm run infra:up              # Start Docker services
npm run infra:down            # Stop Docker services
npm run infra:logs            # Follow Docker logs
npm run infra:reset           # Wipe volumes + restart (WARNING: deletes data)
```
