# Build Status

## Foundation — completed in repository
- [x] Initialize RelayOps and project documentation.
- [x] Next.js App Router using JavaScript.
- [x] Prisma models for endpoints, events, deliveries, and attempts.
- [x] Destination registration and event ingestion APIs.
- [x] Idempotency-key duplicate protection.
- [x] Database-backed delivery records and a manually triggered demo worker.
- [x] Retry classification, exponential backoff, jitter, and dead-letter state.
- [x] Initial dashboard with metrics, recent deliveries, and destinations.
- [x] Seed script and retry-policy unit tests.
- [x] Project context and initial interview notes.

> The foundation has been pushed to GitHub, but it has not yet been verified by a successful deployment or a completed build/test run in a live environment. Do not describe it as production-ready.

## Agreed portfolio scope
See PRODUCT_SCOPE.md for the full feature list, demo walkthrough, boundaries, and definition of done.

### Milestone 1 — Make the core workflow demonstrable
- [ ] Event explorer and event detail page with formatted payload.
- [ ] Delivery detail page with full attempt timeline and response/error information.
- [ ] Destination create/edit/enable/disable and event-type subscriptions.
- [ ] Manual retry/replay from the dashboard.
- [ ] Sample receiver with controllable success and failure responses.

### Milestone 2 — Make delivery reliable
- [ ] Move persistence from SQLite to PostgreSQL.
- [ ] Separate long-running Node.js worker from Next.js request handlers.
- [ ] Implement safe atomic job claims, leases, and crash recovery.
- [ ] Add bounded retries, exponential backoff, jitter, and Retry-After support.
- [ ] Add integration/concurrency tests for delivery state transitions.

### Milestone 3 — Secure the integration
- [ ] Authenticate event producers with API keys; hash stored keys.
- [ ] Sign outbound requests with HMAC-SHA256 and timestamps.
- [ ] Add receiver-side signature verification and event-ID deduplication example.
- [ ] Validate destination URLs and defend against SSRF, including redirects and private/link-local targets.
- [ ] Add payload limits, rate limiting, and protected dashboard mutations.

### Milestone 4 — Deploy and prove it
- [ ] Deploy dashboard/API to Vercel.
- [ ] Deploy worker as a separate Render service.
- [ ] Connect both to the same managed PostgreSQL database.
- [ ] Add GitHub Actions for tests and production build.
- [ ] Add health checks, structured logs, and useful error messages.
- [ ] Document API usage, architecture, failure demo, and key trade-offs.
- [ ] Capture a working live demo and reproducible test evidence.

## Explicitly not planned for v1
- Billing, paid plans, and subscription management.
- Full multi-tenant signup/organization management.
- Complex RBAC and invitations.
- Kafka, Kubernetes, microservices, or Redis/BullMQ without a measured need.
- Unrelated AI features.

## Verification status
The initial foundation was committed to GitHub. Build, migrations, tests, and deployment must be run and verified before marking them successful.
