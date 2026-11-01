# RelayOps

**Webhook delivery and reliability dashboard** built with Next.js, React, JavaScript, Prisma, and Vitest.

RelayOps accepts an event, stores it with delivery jobs, sends it to subscribed HTTP destinations, records each attempt, and retries transient failures. The dashboard makes delivery state and failure history visible.

## Demo workflow

1. Add a destination such as `https://webhook.site/your-id` (or your own receiver).
2. Subscribe it to `*` or a specific event type.
3. Publish an event using the API quickstart below.
4. Click **Run worker** in the dashboard.
5. Open the event inspector to see the attempt, response, and status.
6. To simulate a retryable failure, use the included receiver URL with `?mode=fail` or `?mode=rate-limit`, run the worker, and inspect the delivery state.
7. Change the destination URL to `?mode=success` and manually retry a dead-letter delivery.

The included receiver supports:
- `/api/demo/receiver` — return 200 and echo the received event.
- `/api/demo/receiver?mode=fail` — return 500.
- `/api/demo/receiver?mode=rate-limit` — return 429 with `Retry-After: 10`.
- `/api/demo/receiver?mode=slow` — wait long enough to exercise the worker timeout.

## Local setup

Requirements: Node.js 20+, npm, and a local SQLite database.

```bash
git clone https://github.com/Yadushree-k9898/relayops.git
cd relayops
npm install
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000. Add this destination from the dashboard:

```text
http://localhost:3000/api/demo/receiver
```

The demo receiver runs on the same Next.js app. If you run the app on another port, update the destination URL.

## Publish an event

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: order-1001" \
  -d '{"type":"order.created","data":{"orderId":"1001","total":1499}}'
```

If `RELAYOPS_API_KEY` is configured, include `-H "Authorization: Bearer YOUR_KEY"`. Reusing an idempotency key returns the original event instead of creating a duplicate.

## Architecture

```text
Producer
  | POST /api/events + API key + Idempotency-Key
  v
Next.js route handler
  | validate + database transaction
  v
Prisma / SQLite (local demo)
  | event + one delivery job per matching destination
  v
Worker runner (manual demo trigger)
  | atomic conditional claim + timeout + HMAC signature
  v
Destination HTTP endpoint
  | HTTP response / network error
  v
Attempt history + retry schedule + dead-letter state
  |
  v
Dashboard / event inspector
```

## Reliability behaviour

- Persist the event and delivery jobs before returning HTTP 202.
- Idempotency key prevents duplicate event creation.
- Delivery is asynchronous relative to the producer request.
- Retry network errors, timeouts, 408, 425, 429, and 5xx.
- Use capped full-jitter exponential backoff and respect `Retry-After`.
- Record attempt number, response status/body excerpt, error, duration, and timestamp.
- Stop after the configured attempt budget and mark the delivery dead-lettered.
- A conditional database update claims due jobs; stale processing jobs are re-queued after a one-minute recovery window.
- Outbound redirects are not followed.
- If a destination secret is configured, outgoing requests include an HMAC-SHA256 signature over timestamp + request body.

RelayOps provides **at-least-once delivery**, not exactly-once network delivery. A destination may process a request even when its response is lost. Receivers should deduplicate using the stable event ID.

## Configuration

See [.env.example](./.env.example).

- `DATABASE_URL`: SQLite URL for the current local demo.
- `RELAYOPS_API_KEY`: optional bearer token required for event ingestion when set.
- `RELAYOPS_ADMIN_TOKEN`: optional bearer token required for the manual worker endpoint when set.

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Database health check |
| GET | `/api/stats` | Dashboard metrics |
| GET | `/api/events` | Recent delivery/event rows |
| POST | `/api/events` | Ingest event and create matching jobs |
| GET | `/api/endpoints` | List destinations |
| POST | `/api/endpoints` | Create destination |
| POST | `/api/worker/run` | Process due jobs (demo trigger) |
| POST | `/api/events/:deliveryId/retry` | Queue a dead-letter delivery again |
| POST | `/api/demo/receiver` | Sample webhook receiver |

## Tests and CI

Run `npm test`. GitHub Actions runs dependency installation, Prisma generation, tests, and a production build on pushes and pull requests to `main`.

## Important limitations — be honest about these

This repository is a focused portfolio demo, not a production SaaS deployment yet.

- The current Prisma datasource is SQLite. A hosted multi-instance deployment needs PostgreSQL and a migration.
- The worker is manually triggered by the dashboard/API; it is not yet a separate always-on worker service.
- The current claim/recovery strategy is a small-demo implementation, not a full leased queue with fencing tokens.
- URL validation blocks obvious localhost/private literal addresses, and redirects are disabled. It does **not** yet resolve DNS and revalidate IPs at connection time, so it is not sufficient to expose arbitrary user-controlled destinations publicly.
- The optional producer/admin tokens are environment-level demo guards, not per-customer hashed API keys or a complete operator-authentication system.
- Automated tests cover core retry-policy helpers; full database/concurrency/security integration tests remain future work.
- No live Vercel/Render deployment is claimed by this repository state.

## Project goals

This project demonstrates API design, relational data modelling, asynchronous processing, idempotency, retry policies, failure handling, HMAC signatures, operational visibility, and practical engineering trade-offs without adding unnecessary microservices or infrastructure.

Only this repository is in scope: `Yadushree-k9898/relayops`.
