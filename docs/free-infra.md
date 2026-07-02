# Free infrastructure setup for DataStorified

DataStorified’s backend is designed to run entirely on free services:

- Vercel Hobby
- Neon Free PostgreSQL
- Prisma
- Better Auth
- Google OAuth
- Next.js Route Handlers
- localStorage for anonymous/local-first behavior

No paid services are required.

## Required environment variables

Set these in Vercel for the website project:

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

## Neon free setup

1. Create a free Neon project.
2. Create a PostgreSQL database and copy the pooled or direct connection string.
3. Set `DATABASE_URL` in Vercel to the Neon connection string.
4. Keep the database private; do not add paid storage, queues, or extra services.

Recommended habits for the free tier:

- keep the schema compact;
- avoid long-running queries;
- avoid background jobs;
- keep sync operations idempotent;
- store only the canonical backend state.

## Vercel setup

1. Deploy the website app to Vercel Hobby.
2. Add the required env vars above to the project.
3. Make sure `NEXT_PUBLIC_SITE_URL` matches the production domain.
4. Deploy once after env vars are set so server handlers can read them.

If you use preview deployments, make sure preview-specific URLs do not overwrite production auth settings.

## Google OAuth setup

1. Create an OAuth client in Google Cloud Console.
2. Add the authorized redirect URI used by Better Auth.
3. Copy the client ID and secret into:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. Keep login optional; anonymous users must still work.

## Prisma commands

Use the root scripts:

```bash
pnpm db:generate
pnpm db:push
pnpm db:studio
```

When working locally, run them after changing the Prisma schema.

## Deployment checklist

- `DATABASE_URL` points to Neon free PostgreSQL.
- `BETTER_AUTH_SECRET` is set and stable.
- `BETTER_AUTH_URL` matches the deployed site URL.
- Google OAuth credentials are configured.
- `NEXT_PUBLIC_SITE_URL` matches the public website domain.
- Optional GA4 env var is set only if analytics is enabled.
- `pnpm db:generate` ran successfully.
- `pnpm db:push` applied the schema.
- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes.
- `pnpm build` passes.

## Rollback checklist

If a deployment needs to be rolled back:

- revert the application deployment in Vercel;
- if the schema changed, confirm the previous app version still matches the deployed database;
- if needed, re-run `pnpm db:push` only when the schema and code are intentionally moving forward again;
- keep auth settings unchanged unless the rollback requires a matching auth config;
- verify anonymous/local-first flows still work.

## Known limitations of the free tier

- No Redis-backed queues or jobs.
- No paid AI APIs.
- No paid email or SMS verification.
- No paid file storage.
- No always-on background workers.
- Limited database resources.
- Must keep sync logic simple and idempotent.
- Must rely on localStorage for anonymous users.

