# DataStorified maintenance and outage system

This system is intentionally simple, calm, and environment-variable driven.

It does not expose internal platform details publicly.

## Environment variables

Use these public env vars to control what users see:

- `NEXT_PUBLIC_MAINTENANCE_ENABLED`
- `NEXT_PUBLIC_MAINTENANCE_MODE`
- `NEXT_PUBLIC_MAINTENANCE_MESSAGE`
- `NEXT_PUBLIC_MAINTENANCE_START`
- `NEXT_PUBLIC_MAINTENANCE_END`
- `NEXT_PUBLIC_OUTAGE_ENABLED`
- `NEXT_PUBLIC_OUTAGE_MESSAGE`
- `NEXT_PUBLIC_SCHEDULED_MAINTENANCE_ENABLED`
- `NEXT_PUBLIC_SCHEDULED_MAINTENANCE_MESSAGE`

Recommended values:

- `NEXT_PUBLIC_MAINTENANCE_MODE=banner` for a small top banner
- `NEXT_PUBLIC_MAINTENANCE_MODE=page` for a full minimal maintenance page

## Behavior

- Scheduled maintenance shows a small, non-blocking banner.
- Outage shows a small warning banner.
- Maintenance in banner mode shows a small, non-blocking banner.
- Maintenance in page mode redirects public pages to a minimal maintenance page.
- `/admin` stays accessible.
- Public copy stays calm and user-friendly.

## Public pages

The status and maintenance surfaces only say what a visitor needs to know.

They do not show:

- API names
- database names
- auth provider names
- deployment provider names
- analytics names
- internal service architecture

## Components

- `PlatformNoticeProvider`
- `ScheduledMaintenanceBanner`
- `OutageBanner`
- `MaintenanceBanner`
- `MaintenancePage`

## Tests to keep

- banner appears when env enabled
- outage banner appears when env enabled
- maintenance page blocks public pages when mode page
- admin route is not blocked
- technical details are never rendered

## Operational note

Use env vars only. No admin console is required for this first version.

