# RelayOps

**A webhook delivery and reliability platform.**

RelayOps helps teams send events to customer endpoints and understand what happened when delivery succeeds, fails, times out, or needs to be retried.

## Product goals

- Register webhook destinations and subscribe them to event types.
- Ingest events through an HTTP API with idempotency protection.
- Persist events and delivery attempts before attempting network delivery.
- Deliver asynchronously through a worker.
- Retry transient failures with exponential backoff and jitter.
- Keep an auditable delivery timeline with response details.
- Provide an operator dashboard for events, destinations, and delivery health.

## Architecture (first iteration)

```text
Producer
  |
  | POST /api/events + Idempotency-Key
  v
Next.js API -> validate -> persist event + delivery jobs (SQLite)
                                  |
                                  v
                           Worker runner
                                  |
                                  v
                         Destination endpoint
                                  |
                    +-------------+-------------+
                    |                           |
                  2xx                         timeout / 5xx
                    |                           |
                delivered                  schedule retry
                                                |
                                         dead-letter state
```

The first iteration uses a database-backed queue so the queue semantics are visible and easy to run locally. This is intentional: we can later compare it with Redis/BullMQ or a managed queue without hiding the fundamentals.

## Stack

- Next.js 14 App Router, React, JavaScript
- Tailwind CSS
- Prisma + SQLite for local persistence
- Vitest for tests

## Run locally

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Try the API

Create an event:

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: order-1001" \
  -d '{"type":"order.created","data":{"orderId":"1001","total":2499}}'
```

Run queued deliveries:

```bash
curl -X POST http://localhost:3000/api/worker/run \
  -H "Content-Type: application/json" \
  -d '{"limit":10}'
```

> The worker is manually triggered in the first iteration to make behavior deterministic during learning and demos. A production deployment would run it as a separate long-lived worker or scheduled process.

## Project learning docs

- [Project context](./PROJECT_CONTEXT.md)
- [Build status](./BUILD_STATUS.md)
- [Interview notes](./INTERVIEW_NOTES.md)

## Scope and safety

This repository is the sole project target. Changes are intentionally scoped to `Yadushree-k9898/relayops`.
