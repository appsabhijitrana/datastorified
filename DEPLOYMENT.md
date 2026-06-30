# Production deployment

The platform deploys as three Vercel projects from one repository. `dev` runs integration CI and never deploys production. Only a reviewed merge into `main`, followed by a successful quality job, invokes the reusable Vercel deployment jobs.

Required GitHub/Vercel configuration:

- `VERCEL_DEPLOY_ENABLED`, `VERCEL_ORG_ID`, and three project IDs as repository variables.
- `VERCEL_TOKEN` as a GitHub secret.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` in each project to enable Google Analytics 4.

See [docs/deployment.md](docs/deployment.md) for project roots, DNS, smoke tests, release, and rollback steps.
