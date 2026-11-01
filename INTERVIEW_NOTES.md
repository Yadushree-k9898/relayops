# RelayOps — Interview Notes

## 30-second project explanation

Target explanation, once the planned workflow is implemented and verified:

"I built RelayOps, a webhook delivery and reliability platform. An application sends an event to an authenticated API. RelayOps persists the event and its delivery jobs before acknowledging the request. A separate worker delivers events to subscribed endpoints, signs requests, records every attempt, and retries transient failures with capped exponential backoff and jitter. Operators can inspect delivery history, replay failed events, and identify why a destination is failing."

Do not claim a feature is complete until it is implemented, tested, and visible in the deployed demo.

## Architecture to explain

Producer application
-> Next.js ingestion API
-> validate API key, payload, and idempotency key
-> database transaction stores event + matching delivery jobs
-> return acknowledgement after commit
-> separate worker claims due jobs using a safe claim/lease mechanism
-> signed HTTP request to destination
-> record attempt and update delivery state
-> dashboard shows event, destination, delivery timeline, and failures

## Core interview questions

### Why persist before delivering?
If the process crashes after accepting a request, the event and its delivery jobs remain durable. Acknowledge only after the transaction commits. The producer should not be told the event was accepted if it was not safely stored.

### Why asynchronous delivery?
The producer should not wait for slow or unavailable customer endpoints. Ingestion latency is separated from destination latency, and delivery can be retried independently.

### What does an idempotency key solve?
A producer may retry because it never received the API response. A unique key prevents the retry from creating a second event. Scope the key to the producer/account when multiple customers exist.

### Why not exactly-once delivery?
The receiver may complete its work, but the response can be lost before RelayOps receives it. RelayOps cannot know whether the side effect happened. The practical model is at-least-once delivery, with a stable event ID so receivers can deduplicate.

### Why exponential backoff?
Immediate retries can amplify load on an unhealthy destination. Exponential delay spaces attempts out, and a maximum delay bounds the wait.

### Why jitter?
Without jitter, many jobs that fail together can retry together and create a thundering herd. Randomized delay spreads the retry traffic.

### Which failures should retry?
Network errors, timeouts, 408, 425, 429, and 5xx are generally transient. Most other 4xx responses indicate a request or configuration problem. Honor Retry-After when the destination supplies it.

### What is a dead-letter queue?
A place/state for deliveries that permanently fail or exhaust their retry budget. It prevents infinite retries and lets an operator inspect and deliberately replay a failed delivery.

### Why use a database-backed queue first?
It keeps the first version understandable and makes event/job state inspectable in PostgreSQL. It is reasonable for a small project. A dedicated queue such as Redis/BullMQ or a managed queue becomes useful when throughput, scheduling volume, or queue operations justify another component.

### How do you prevent two workers processing the same job?
Workers must claim jobs atomically. A lease/visibility timeout allows recovery if a worker crashes after claiming a job. A simple read-then-update is not sufficient under concurrency.

### Why separate Vercel and Render?
The dashboard and short-lived HTTP APIs fit a web deployment. A continuously running worker has a different lifecycle and should run as a separate background service. Both connect to the same PostgreSQL database.

### Why API keys instead of full user authentication first?
The key protects machine-to-machine event ingestion, which is the main integration boundary. Full signup, organizations, invitations, RBAC, and billing are deliberately outside the first version so the project can focus on delivery correctness. Any public dashboard mutation still needs protection.

### Why HMAC signatures?
A shared secret lets the receiver verify that the webhook body was signed by RelayOps and was not changed in transit. A timestamp helps limit replay windows. The receiver must compare signatures safely and still deduplicate by event ID.

## Important trade-offs and honest limitations

- The initial repository foundation uses SQLite and a manually triggered worker. The target deployed design uses PostgreSQL and a separate worker; do not describe that migration as complete until it is.
- A PostgreSQL-backed queue is intentionally chosen before introducing Redis/BullMQ.
- The system provides at-least-once delivery, not exactly-once network delivery.
- Destination URLs are an SSRF boundary. Public arbitrary-URL delivery must be protected against private/link-local targets, unsafe redirects, and DNS rebinding before enabling it.
- A 2xx response means the receiver acknowledged the HTTP request; it does not prove every downstream business side effect completed.
- Production readiness requires tests, safe secrets, protected operator actions, structured logs, rate/payload limits, and verified deployment.

## How to demo it

1. Show the dashboard and event/delivery health.
2. Send a documented sample event with an API key and idempotency key.
3. Open the event and inspect its payload and destination delivery.
4. Show a successful delivery to the sample receiver.
5. Configure a controlled failure and show the attempt status, response/error, and next retry time.
6. Show manual replay and the new attempt in the timeline.
7. Explain idempotency, HMAC, worker claims/leases, backoff, and dead-letter handling.
