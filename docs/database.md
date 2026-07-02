# DataStorified database

DataStorified uses Prisma with Neon PostgreSQL on the free tier.

## Required env vars

```bash
DATABASE_URL=
```

## Local Prisma commands

```bash
pnpm db:generate
pnpm db:push
pnpm db:studio
```

## Schema principles

- keep the schema generic, not finance-specific;
- store canonical user/profile/decision state;
- keep decision snapshots immutable where practical;
- keep sync metadata small;
- keep local-first browser state separate from server records.

## Suggested tables

The current foundation includes:

- `User`
- `Session`
- `Account`
- `Verification`
- `Profile`
- `Decision`
- `DecisionAnswer`
- `Favorite`
- `HistoryItem`
- `SyncLog`

## Deployment notes

- use Neon Free PostgreSQL;
- keep migrations small;
- avoid expensive joins and large blobs;
- use indexed IDs, fingerprints, and updated timestamps for sync;
- confirm the app still runs if the database is temporarily unavailable for anonymous users.

## Rollback checklist

- if code rolls back, confirm the schema still matches the deployed app;
- if the schema changes, regenerate Prisma client before deployment;
- verify profile and decision routes still deserialize correctly;
- confirm auth-linked tables still map to the logged-in user.

## Free-tier limitations

- limited storage and compute;
- no background job processing;
- avoid large audit/event retention;
- no Redis cache;
- no paid file storage.

