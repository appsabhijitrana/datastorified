# DataStorified status system

This document explains the maintenance mode, outage banner, public status page, health API, and version update banner used by the website app.

## What the system does

The status layer is intentionally frontend-first and env-driven:

- maintenance mode can temporarily redirect normal pages to a dedicated maintenance page;
- outage banners can be shown at the top of the app for service notices;
- a public status page shows current component health and incident history;
- a health API exposes the same data in JSON form;
- a version update banner appears when the published app version changes.

No database queries are used. Everything comes from static config and environment variables.

## Environment variables

Required for runtime behavior:

- `MAINTENANCE_MODE`
- `MAINTENANCE_MESSAGE`
- `MAINTENANCE_ETA`
- `OUTAGE_BANNER_ENABLED`
- `OUTAGE_BANNER_LEVEL`
- `OUTAGE_BANNER_TITLE`
- `OUTAGE_BANNER_MESSAGE`
- `OUTAGE_BANNER_LINK`
- `OUTAGE_BANNER_VERSION`
- `NEXT_PUBLIC_APP_VERSION`

Suggested values:

- `MAINTENANCE_MODE=true` turns on redirect-based maintenance mode.
- `OUTAGE_BANNER_ENABLED=true` shows the sticky banner.
- `OUTAGE_BANNER_LEVEL` accepts `info`, `success`, `warning`, or `critical`.
- `OUTAGE_BANNER_VERSION` should change whenever you want users to re-see the banner.
- `NEXT_PUBLIC_APP_VERSION` should match the deployed release version.

## Architecture overview

The implementation lives in `apps/website/lib/status/` and `apps/website/components/status/`.

`StatusService` is the single source of truth. It provides:

- `getMaintenance()`
- `getBanner()`
- `getServices()`
- `getIncidents()`
- `getSystemStatus()`
- `getHealth()`

The service reads environment variables and returns typed objects for pages, middleware, and API handlers.

## Maintenance mode

When `MAINTENANCE_MODE=true`, the middleware redirects normal pages to `/maintenance`.

Allowed paths still work:

- `/maintenance`
- `/status`
- `/api/health`
- static assets and Next.js internal assets
- auth callback routes

The maintenance page shows:

- a short message;
- an optional ETA;
- a live countdown when ETA is provided;
- links back to the status page and home page.

## Outage banner

When `OUTAGE_BANNER_ENABLED=true`, the app renders a sticky banner at the top of the site.

The banner:

- supports `info`, `success`, `warning`, and `critical` levels;
- links to the public status page by default;
- can be dismissed locally;
- persists dismissal by banner version so a changed banner can reappear later.

## Version update banner

The version banner appears when the current app version differs from the last version the user dismissed.

This is stored locally, so:

- anonymous users still see it;
- no backend session is required;
- a new deployment version can surface a quick release notice.

## Public status page

The `/status` page shows:

- overall system status;
- current app version;
- last updated time;
- component/service status cards;
- incident history.

The current services are configured in static data and include:

- Website
- API
- Authentication
- Database
- Decision Engine
- Comparisons
- AI Recommendation
- Search

## Health API

`GET /api/health` returns a JSON payload with:

- current system status;
- app version;
- uptime;
- timestamp;
- health for each service.

This endpoint is intended for monitoring and simple availability checks.

## Testing

Recommended coverage:

- `StatusService` env parsing
- health payload shape
- maintenance redirect behavior
- banner dismissal persistence

Run:

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Operational notes

- Keep `NEXT_PUBLIC_APP_VERSION` aligned with the deployed build version.
- Use a unique `OUTAGE_BANNER_VERSION` whenever you want the banner to reappear after a change.
- For longer outages, update the maintenance ETA and status page copy together.
- Because the system is static, changing env vars is the normal way to toggle behavior.

