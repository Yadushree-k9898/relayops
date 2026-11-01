# Build Status — 1 November 2026

## Implemented in the repository

- [x] Next.js App Router dashboard using JavaScript and Tailwind CSS.
- [x] Prisma models for endpoints, events, deliveries, and attempt history.
- [x] Event ingestion persists the event and matching delivery jobs in one transaction.
- [x] Optional producer bearer-key guard through `RELAYOPS_API_KEY`.
- [x] Idempotency-key duplicate protection.
- [x] 256 KB event payload limit.
- [x] Destination creation, event-type subscriptions, and enable/disable controls.
- [x] Event inspector with formatted payload and chronological attempt history.
- [x] Manual retry for dead-letter deliveries.
- [x] Worker request timeout and retryable/permanent HTTP failure classification.
- [x] Capped full-jitter exponential backoff and `Retry-After` handling.
- [x] Conditional database update for job claiming and recovery of stale processing jobs.
- [x] HMAC-SHA256 timestamped outbound signatures when a destination secret is configured.
- [x] Redirects are not followed; obvious private/local destination addresses are blocked in production.
- [x] Included demo receiver with success, 500, 429, and slow-response modes.
- [x] Health endpoint.
- [x] Unit tests for retry helpers, status classification, subscriptions, and safe JSON parsing.
- [x] GitHub Actions workflow for tests and production build.
- [x] Local setup, API, architecture, demo, and limitations documented in README.

## Verification still required

- [ ] Run `npm ci`, `npm test`, and `npm run build` locally or in GitHub Actions and fix any failures.
- [ ] Verify the complete success, 500 retry, 429 Retry-After, timeout, idempotency, and dead-letter replay flows against a real local database.
- [ ] Verify HMAC signatures end-to-end using the same secret in the destination and `RELAYOPS_DEMO_SECRET`.
- [ ] Add database-backed integration and concurrent-worker tests.
- [ ] Review dashboard mutation protection before any public deployment.

## Deliberately not complete in this two-hour build

- [ ] PostgreSQL migration and production database configuration. The current schema uses SQLite for the local demo.
- [ ] Separate always-on worker service. Delivery is currently triggered manually from the dashboard/API.
- [ ] Full queue lease/fencing-token implementation and robust recovery semantics.
- [ ] Complete SSRF protection including DNS resolution/rebinding defence and connection-time IP pinning. Do not expose arbitrary user-controlled destinations publicly.
- [ ] Per-customer hashed API keys, multi-tenant authentication, rate limiting, and full operator auth.
- [ ] Verified Vercel + Render deployment and live demo URL.

## Architecture trade-offs

The current version intentionally uses a small database-backed queue and a manual worker trigger to keep the end-to-end workflow demonstrable. It is a portfolio MVP, not a production SaaS. It provides at-least-once delivery semantics; receiver-side deduplication is required because exactly-once network delivery cannot be guaranteed.

## Out of scope for v1

- Billing, subscriptions, and full multi-tenant administration.
- Complex RBAC and invitations.
- Kafka, Kubernetes, microservices, or Redis/BullMQ without a measured need.
- Unrelated AI features.

Only `Yadushree-k9898/relayops` is in scope.
