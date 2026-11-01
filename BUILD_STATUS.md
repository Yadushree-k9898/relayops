# Build Status

## Foundation milestone — 2026-11-01
- [x] Initialize RelayOps and product documentation.
- [x] Next.js 14 App Router using JavaScript.
- [x] Prisma models: endpoints, events, deliveries, attempts.
- [x] Destination registration and event ingestion APIs.
- [x] Idempotency-key duplicate protection.
- [x] Database-backed queue and worker trigger.
- [x] Retry classification, exponential backoff, jitter, dead-letter state.
- [x] Dashboard with operational metrics, recent deliveries, destinations.
- [x] Seed script and retry-policy unit tests.
- [x] Project context and interview notes.

## Next milestones
1. Run migration, seed, dashboard and tests locally.
2. Add delivery detail page with full attempt timeline and manual retry action.
3. Add HMAC signing and a sample receiver that verifies signatures.
4. Add pagination, filtering, and event inspection.
5. Add worker leases/recovery and concurrency tests.
6. Add PostgreSQL + Redis/BullMQ comparison and Docker Compose.
7. Add authentication, rate limiting, SSRF defenses, and deployment workflow.

## Local validation
Not yet run in this environment. Run npm install, copy .env.example to .env, npx prisma migrate dev --name init, npm run db:seed, npm test, and npm run dev.