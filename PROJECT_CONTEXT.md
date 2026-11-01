# RelayOps — Project Context

## Product
RelayOps is a focused webhook delivery and reliability platform. A producer publishes an event to RelayOps; RelayOps persists it, creates delivery jobs for subscribed destinations, delivers asynchronously, records every attempt, and gives an operator tools to inspect and replay failures.

The portfolio goal is to demonstrate practical full-stack and backend engineering: API design, data modelling, asynchronous processing, reliability, security, testing, debugging, and deployment.

## Core request flow
1. A producer sends an event to POST /api/events using an API key and optional Idempotency-Key.
2. The API validates the request and persists the event plus matching delivery jobs in one database transaction.
3. The API acknowledges the request only after the transaction commits.
4. A separate background worker claims due jobs and sends signed HTTP requests to subscribed destinations.
5. A 2xx response marks a delivery successful.
6. Network errors, timeouts, 408, 425, 429, and 5xx responses are retried with capped exponential backoff and jitter; honor Retry-After where applicable.
7. Permanent failures or exhausted retries move to a dead-letter state.
8. Each attempt records status, response excerpt, error, duration, and timestamp. The dashboard exposes event details, delivery history, and manual replay.

## Stack
- Next.js App Router + React + JavaScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL for deployed persistence
- Separate Node.js background worker
- Vitest for unit and integration tests
- Vercel for the dashboard/API and Render for the worker

The current foundation was created with SQLite and a manually triggered worker. Those are implementation-stage choices, not the final deployed architecture. See PRODUCT_SCOPE.md for the agreed product boundaries and definition of done.

## Product boundaries
- Build a single-workspace portfolio product first.
- Producer API-key authentication is in scope.
- Protect public dashboard mutations; do not expose unrestricted destination creation or replay actions.
- Do not build full signup, billing, multi-tenant administration, complex RBAC, Kafka, Kubernetes, or microservices in the first version.
- Use a PostgreSQL-backed queue with safe claims and leases before considering Redis/BullMQ.
- Apply SSRF protections to user-configured destination URLs before public arbitrary-URL delivery.
- Sign outbound webhooks using HMAC-SHA256 and timestamps.
- Design for at-least-once delivery; never claim exactly-once network delivery.

## Production-minded risks
- SQLite is not suitable for a multi-instance deployed worker; migrate to PostgreSQL.
- A manually triggered API endpoint is not a substitute for a long-running worker.
- Concurrent workers need atomic claims and lease expiry/recovery.
- Public destination URLs create SSRF risk. Validate schemes, DNS/IP ranges, redirects, and revalidate at connection time as appropriate.
- Add payload limits, rate limits, structured logs, and safe secret handling.
- A successful HTTP response means the receiver acknowledged the request; it does not prove every downstream business side effect completed.

## Repository boundary
Only Yadushree-k9898/relayops is in scope. Never modify another repository.
