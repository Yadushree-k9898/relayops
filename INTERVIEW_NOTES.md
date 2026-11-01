# RelayOps — Interview Notes

## 30-second explanation
"I built RelayOps, a webhook delivery platform. A producer sends an event to an API, and the API persists it with an idempotency key before creating delivery jobs for matching destinations. A worker processes those jobs asynchronously, records every attempt, and retries transient failures with capped exponential backoff and jitter. After the retry budget is exhausted, the job moves to a dead-letter state where an operator can inspect and replay it."

## Request flow
POST /api/events -> validate -> unique Idempotency-Key -> transaction inserts Event and matching Delivery rows -> 202 Accepted.
POST /api/worker/run -> find due jobs -> conditional update claims a job -> POST payload to destination with timeout -> persist Attempt -> update Delivery state.

## Interview questions

### Why persist before delivering?
If the process crashes after accepting a request, the event remains durable. Acknowledge only after the event and delivery jobs commit.

### Why asynchronous delivery?
The producer does not wait for slow customer endpoints. Ingestion latency is decoupled from destination latency and retries are independently scheduled.

### What does idempotency solve?
A producer may retry because it never received the API response. A unique key returns the existing event instead of creating a duplicate. In a multi-tenant system, scope keys per account.

### Why not exactly-once delivery?
The receiver may process a request and the network may fail before RelayOps receives its response. The sender cannot know whether the side effect happened. Design for at-least-once delivery and receiver-side deduplication using the stable event ID.

### Why exponential backoff?
Immediate retries amplify load on an unhealthy endpoint. Exponential delay spaces attempts out; a cap bounds the wait.

### Why jitter?
Without jitter, jobs that fail together retry together, creating a thundering herd. Random delay spreads retry traffic over time.

### Which failures retry?
Network errors, timeouts, 408, 425, 429 and 5xx are transient here. Most other 4xx responses indicate a request/configuration issue and go to dead letter.

### Why a database-backed queue?
It makes persistence and state transitions inspectable with fewer moving parts. It is useful for a small single-instance demo; high throughput calls for a dedicated queue and worker.

### How do you prevent two workers processing the same job?
A conditional status update attempts to claim the due job; only one should win. Production needs robust leases, visibility timeouts, and crash recovery.

### What is a dead-letter queue?
A holding state for jobs that exhaust their retry budget or fail permanently. It stops infinite retries and allows operator inspection and replay.

## Trade-offs to explain honestly
SQLite is local-first, the worker trigger is a demo control, endpoint URL SSRF protections are not yet production-ready, the secret header should become HMAC, and exactly-once network delivery is not guaranteed.