# DataStorified sync

Sync keeps local-first decisions usable while allowing logged-in users to persist data to the cloud.

## What sync covers

- decisions
- favorites
- history
- profile

## Required env vars

Sync relies on the same backend configuration used by the app:

```bash
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_SITE_URL=
```

## Sync rules

- anonymous users stay local-only;
- sync requires auth;
- never delete cloud data automatically;
- merge by fingerprint and local ID;
- keep the latest `updatedAt` on duplicates;
- return a summary to the UI;
- preserve the original local copy until the user confirms the merge outcome.

## UI behavior

- show the sync banner after login;
- show `Sync now`;
- show a summary such as:
  - decisions synced
  - favorites synced
  - profile updated

## Operational checklist

- confirm logged-in users can sync;
- confirm anonymous users do not see a destructive sync path;
- confirm duplicate records merge deterministically;
- confirm conflict handling is stable on repeated retries;
- confirm the sync endpoint returns a compact summary.

## Free-tier limitations

- sync must be request/response only;
- no background queue;
- no Redis;
- no paid storage;
- avoid huge payloads and keep sync batches small.

