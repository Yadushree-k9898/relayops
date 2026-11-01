# RelayOps — Product Scope

## Product statement
RelayOps is a focused webhook delivery and reliability platform. It accepts events from a producer, persists them, delivers them to subscribed HTTP endpoints in the background, and gives an operator a clear way to inspect, retry, and recover failed deliveries.

**Portfolio objective:** demonstrate that the developer can design, implement, test, debug, and deploy a realistic full-stack system—not merely assemble a dashboard or a collection of CRUD APIs.

## The core user story
1. A developer registers a destination URL and selects the event types it wants.
2. Their application sends an event to RelayOps using an API key and an idempotency key.
3. RelayOps stores the event and creates delivery work before acknowledging it.
4. A background worker sends the event to the destination with a signature.
5. RelayOps records the result and retries transient failures.
6. The operator opens the dashboard to inspect the event, its attempts, the response/error, and retry or replay it when appropriate.

## Product scope — what we will build

### 1. Useful dashboard
- Overview cards for total events, successful deliveries, retrying deliveries, and dead-letter deliveries.
- Events list with status, event type, timestamp, and destination/delivery counts.
- Event detail view with formatted JSON payload and related deliveries.
- Delivery detail view with a chronological attempt timeline.
- Destination list with URL, subscribed event types, and enabled/disabled state.
- Search and simple filters by status, event type, and date.
- Clear empty, loading, and error states.

### 2. Event ingestion API
- Accept an event with a type and JSON payload.
- Authenticate producers with an API key.
- Accept an idempotency key so repeated producer requests do not create duplicate events.
- Validate payload shape and size.
- Persist the event and matching delivery jobs in one database transaction.
- Return an acknowledgement only after persistence succeeds.

### 3. Destination management
- Create, edit, enable, and disable destinations.
- Subscribe destinations to selected event types.
- Validate destination URLs and apply SSRF protections before allowing outbound requests.
- Do not follow redirects to unvalidated destinations.

### 4. Reliable asynchronous delivery
- Run a separate background worker process; do not make the producer wait for destination delivery.
- Claim due jobs safely so concurrent workers do not intentionally process the same job.
- Apply request timeouts.
- Retry network errors, timeouts, 408, 425, 429, and 5xx responses.
- Use capped exponential backoff with jitter and respect Retry-After where applicable.
- Stop after a bounded number of attempts and move exhausted jobs to a dead-letter state.
- Recover jobs left in a processing state after a worker crash using a lease/timeout mechanism.
- Support manual retry/replay from the dashboard.

### 5. Delivery security and debugging
- Sign outbound requests with an HMAC-SHA256 signature and timestamp.
- Include a stable event ID so receivers can deduplicate repeated deliveries.
- Provide a small sample receiver that verifies signatures.
- Record attempt number, destination, HTTP status, response excerpt, error, duration, and timestamp.
- Use structured server/worker logs and expose a simple health endpoint.
- Never store or display raw API secrets after creation; store only a secure hash of producer API keys.

### 6. Database and deployment
- Use PostgreSQL for the deployed application.
- Keep the first queue implementation database-backed; use atomic job claims and leases.
- Deploy the Next.js dashboard and API on Vercel.
- Run the long-lived worker separately on Render.
- Connect both services to the same managed PostgreSQL database.
- Keep credentials in deployment environment variables; never commit real secrets.

### 7. Tests and engineering evidence
- Unit tests for retry classification, delay calculation, jitter, and signature verification.
- Integration tests for event ingestion, idempotency, and delivery state transitions.
- Tests for success, timeout, retryable response, permanent failure, retry exhaustion, and manual replay.
- A concurrency test or documented verification for competing worker claims.
- GitHub Actions CI to run tests and a production build on pushes/pull requests.
- Document the API contract, architecture, important trade-offs, and how to reproduce a failure.

## Authentication decision
Do not build a full multi-tenant account system in the first version.
- Producer-to-RelayOps API calls must use an API key.
- The public portfolio demo should use safe demo data and carefully restricted demo actions.
- Protect any operator action that can create destinations, replay jobs, or expose operational data before making the dashboard publicly writable.
- No signup flows, billing, organization switching, or elaborate RBAC in this scope.

This keeps the security story meaningful without turning the project into an authentication project.

## Keep the technology stack small
- Next.js App Router + React + JavaScript for dashboard and HTTP APIs.
- Tailwind CSS for UI.
- Prisma for database access.
- PostgreSQL for deployed persistence.
- A separate Node.js worker process for delivery.
- Vitest for tests.
- Vercel for the web application and Render for the worker.

Do not add Redis/BullMQ, Kafka, Kubernetes, or microservices just to make the diagram look advanced. A PostgreSQL-backed queue is sufficient for this project's initial scale and gives us concrete trade-offs to explain. We can discuss when a dedicated queue becomes necessary.

## Explicitly out of scope
- Billing and paid subscription plans.
- Full multi-tenant SaaS administration.
- Complex RBAC and invitations.
- Kafka, Kubernetes, and microservice decomposition.
- AI features that do not solve a real webhook reliability problem.
- Claims of exactly-once network delivery or production-scale throughput without evidence.

## Demo walkthrough for an interviewer
1. Open the dashboard and inspect the existing event/delivery health.
2. Send a sample event using the documented API request.
3. Open the event and inspect its payload and generated delivery.
4. Deliver successfully to the sample receiver and inspect the attempt record.
5. Trigger a controlled failure (for example, a receiver configured to return 500).
6. Show the scheduled retry and its backoff time.
7. Retry or replay the event and show the final status.
8. Explain how idempotency, HMAC signatures, worker claiming, and dead-letter handling protect the workflow.

## Definition of done
RelayOps is portfolio-ready when the deployed demo works end-to-end, the core failure scenarios are reproducible, tests and CI pass, secrets and destination URLs are handled safely, and the README explains the architecture and trade-offs. A polished UI alone is not sufficient.

## Repository boundary
Only Yadushree-k9898/relayops is in scope. Do not modify any other repository.
