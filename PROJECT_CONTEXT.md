# RelayOps — Project Context

## Product
RelayOps is a webhook delivery and reliability platform. A producer publishes an event once; RelayOps persists it, fans it out to subscribed destinations, delivers it asynchronously, and records every attempt so failures can be diagnosed and retried.

## Purpose
Demonstrate practical backend and system-design fundamentals: event-driven architecture, producer/consumer separation, durable jobs, idempotency, retry policies, exponential backoff, jitter, dead-letter handling, database transactions and indexes, timeouts, failure classification, and observability.

## Stack
Next.js 14 App Router + React + JavaScript, Tailwind CSS, Prisma + SQLite, Vitest. SQLite and a database-backed queue keep the first iteration easy to run and inspect. Later we can compare PostgreSQL, Redis/BullMQ, and a separately deployed worker.

## Request architecture
1. POST /api/events validates the event and optional Idempotency-Key.
2. A database transaction stores the event and creates a delivery per enabled matching endpoint.
3. POST /api/worker/run claims due jobs and performs outbound HTTP requests.
4. A 2xx response marks a delivery delivered.
5. Network errors, timeouts, 408, 425, 429 and 5xx are retryable with capped exponential backoff and jitter.
6. Permanent 4xx responses and exhausted retries become dead_letter.
7. Each attempt records status, response excerpt, error, duration, and timestamp.

## Production gaps to address
- The worker is manually triggered for deterministic demos; production should run a separate worker process.
- SQLite is not a distributed queue. Multi-instance workers need robust leases/row locking or Redis/BullMQ.
- Honor Retry-After for 429/503.
- Endpoint URLs are user-controlled. Before public deployment, implement SSRF defenses for loopback, private, link-local and cloud metadata addresses, including DNS rebinding and redirects.
- Replace the raw secret header with timestamped HMAC request signatures.
- Add pagination, authentication, rate limiting, payload limits, retention, and structured logs.

## Repository boundary
Only Yadushree-k9898/relayops is in scope. Never modify another repository.