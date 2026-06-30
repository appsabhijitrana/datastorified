# Production deployment

The platform deploys as three Vercel projects from one repository. `dev` runs integration CI and never deploys production. Only a reviewed merge into `main`, followed by a successful quality job, invokes the reusable Vercel deployment jobs.

Required GitHub/Vercel configuration:

- `VERCEL_DEPLOY_ENABLED`, `VERCEL_ORG_ID`, and three project IDs as repository variables.
- `VERCEL_TOKEN` as a GitHub secret.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_SENTRY_DSN`, and `SENTRY_DSN` as per-project environment variables when those providers are enabled.
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` to upload production source maps.

See [docs/deployment.md](docs/deployment.md) for project roots, DNS, smoke tests, release, and rollback steps.
