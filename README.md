# RelayOps

**A focused webhook delivery and reliability platform.**

RelayOps accepts events from an application, persists them, delivers them asynchronously to subscribed HTTP endpoints, and helps an operator understand and recover failed deliveries.

This is a portfolio project focused on practical full-stack/backend engineering: API design, data modelling, idempotency, background processing, retries, delivery observability, security, automated testing, and deployment.

## Product demo
The finished demo will show one end-to-end workflow:
1. Register a destination and subscribe it to event types.
2. Send an event to RelayOps using an API key and idempotency key.
3. Inspect the stored event and its delivery job.
4. Let a background worker deliver it to a sample receiver.
5. Simulate a timeout or 500 response and inspect the failed attempt.
6. Observe the retry schedule and backoff.
7. Replay the delivery and inspect the final attempt history.

## Architecture

~~~text
Producer application
   |
   | POST /api/events + API key + Idempotency-Key
   v
Next.js API (Vercel)
   |
   | validate + transaction
   v
PostgreSQL (events + delivery jobs + attempts)
   |
   | due jobs / safe claims / leases
   v
Node.js background worker (Render)
   |
   | signed HTTP request + event ID
   v
Customer destination / sample receiver

Dashboard (Vercel) reads events, destinations, attempts and delivery state.
~~~

## Planned stack
- Next.js App Router + React + JavaScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Separate Node.js background worker
- Vitest
- Vercel (dashboard/API) + Render (worker)

The current foundation began with SQLite and a manually triggered demo worker. The deployed architecture will move to PostgreSQL and a separate worker. See BUILD_STATUS.md for what is implemented versus planned.

## Reliability concepts demonstrated
- Persist before acknowledging an event.
- Idempotency keys for duplicate producer requests.
- At-least-once delivery and receiver-side deduplication.
- Asynchronous producer/consumer separation.
- Timeouts and retryable versus permanent failure classification.
- Capped exponential backoff with jitter and Retry-After.
- Dead-letter state and manual replay.
- Safe worker claims, leases, and crash recovery.
- HMAC request signatures.
- Attempt history, structured logs, and operational visibility.

RelayOps does not promise exactly-once network delivery. A receiver may process a request even if the response is lost; integrations must tolerate duplicate delivery.

## Security boundaries
The project will authenticate producers with API keys, sign outgoing requests, protect dashboard mutations, and validate destination URLs against SSRF. Public arbitrary-URL delivery must not be enabled until those protections are implemented and tested.

## Project documentation
- [Product scope and definition of done](./PRODUCT_SCOPE.md)
- [Project context and architecture](./PROJECT_CONTEXT.md)
- [Build status and milestones](./BUILD_STATUS.md)
- [Interview notes](./INTERVIEW_NOTES.md)

## Current status
The initial foundation is in the repository. The complete deployed workflow, integration/security tests, and CI are still milestones—not completed claims. The project is portfolio-ready only when the live demo works end-to-end and the failure scenarios are reproducible.

## Repository boundary
Only Yadushree-k9898/relayops is in scope. No other repository should be modified.
