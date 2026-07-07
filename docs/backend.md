# DataStorified backend guide

This document explains the production backend layout for DataStorified using only free infrastructure.

## Overview

The backend is intentionally thin:

- Next.js Route Handlers expose the API.
- Prisma talks to Neon PostgreSQL.
- Better Auth handles Google sign-in.
- Anonymous users remain local-first in the browser.
- Logged-in users can sync profile, history, favorites, and decisions.

## Required env vars

```bash
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_SITE_URL=
```

Optional:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

## Route map

- `GET /api/auth/*`
- `GET /api/profile`
- `PATCH /api/profile`
- `GET /api/decisions`
- `POST /api/decisions`
- `GET /api/decisions/[id]`
- `DELETE /api/decisions/[id]`
- `POST /api/sync`
- `GET /api/recommendations`

## Deployment checklist

Before shipping:

- verify env vars are set in Vercel;
- run `pnpm db:generate`;
- run `pnpm db:push`;
- run `pnpm lint`;
- run `pnpm typecheck`;
- run `pnpm test`;
- run `pnpm build`;
- confirm the website still works anonymously;
- confirm Google sign-in is optional;
- confirm `/decision/saved` and `/profile` prompt sign-in without blocking usage.

## Rollback checklist

When rolling back:

- revert the Vercel deployment to the last known-good build;
- avoid changing the database unless the rollback includes a compatible schema rollback plan;
- verify route handlers still return the same auth status codes;
- validate anonymous/local-first behavior after rollback;
- re-check `GET /api/profile` and `GET /api/decisions` response shapes.

## Free-tier limitations

- The backend should not assume queues, Redis, workers, or background processing.
- Long-running jobs should be avoided.
- Sync should stay request/response based.
- All auth and storage should work inside Vercel Hobby and Neon Free.

