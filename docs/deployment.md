# DataStorified deployment

DataStorified is deployed as three Vercel projects from the same Git repository.

| Vercel project | Root Directory | Production domain |
| --- | --- | --- |
| `datastorified-website` | `apps/website` | `datastorified.com` |
| `datastorified-calculators` | `apps/calculators` | `calculators.datastorified.com` |
| `datastorified-tools` | `apps/tools` | `tools.datastorified.com` |

## 1. Branching and release model

The repository uses a protected two-branch release model:

| Branch | Purpose | Deployment behavior |
| --- | --- | --- |
| `dev` | Shared development and integration | Runs CI; never deploys production |
| `main` | Reviewed production releases | Runs CI and deploys after a merged pull request |

Create feature branches from `dev`, merge reviewed feature pull requests into `dev`, and open a release pull request from `dev` to `main`. Direct pushes to `main` are blocked by GitHub branch protection. The required **Typecheck and build** check must pass before a release PR can merge.

Generated output, dependencies, local environment files, and Vercel link data are excluded by the root `.gitignore`.

## 2. Create the Vercel projects

In Vercel, import the same GitHub repository three times. Give each project the name and Root Directory shown above.

For every project:

1. Keep Framework Preset set to Next.js.
2. Use Node.js 22, matching the current Vercel project configuration.
3. Leave Build Command and Output Directory on their detected defaults.
4. In the Root Directory settings, enable **Include source files outside of the Root Directory in the Build Step**. The apps import shared workspace packages from `packages/`.
5. Make one initial deployment so Vercel finishes creating the project.

This repository includes its pnpm version in `package.json`, and Vercel can detect the workspace from `pnpm-lock.yaml`.

## 3. Configure the GitHub pipeline

Create these GitHub repository variables under **Settings → Secrets and variables → Actions → Variables**:

| Variable | Value |
| --- | --- |
| `VERCEL_DEPLOY_ENABLED` | Set to `true` after all IDs and the token below are configured |
| `VERCEL_ORG_ID` | Vercel account/team ID |
| `VERCEL_WEBSITE_PROJECT_ID` | Project ID for `datastorified-website` |
| `VERCEL_CALCULATORS_PROJECT_ID` | Project ID for `datastorified-calculators` |
| `VERCEL_TOOLS_PROJECT_ID` | Project ID for `datastorified-tools` |

Create one GitHub repository secret:

| Secret | Value |
| --- | --- |
| `VERCEL_TOKEN` | A Vercel access token allowed to deploy all three projects |

Configure the following optional environment variable in each Vercel project to activate Google Analytics. The application remains functional when it is absent.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 browser events |

The team and project IDs are shown in each Vercel project's **Settings → General** page. Create the token from Vercel account settings and store it only as a GitHub secret.

Until `VERCEL_DEPLOY_ENABLED` is exactly `true`, the workflow runs CI and safely skips production deployment.

The workflow in `.github/workflows/ci-deploy.yml` performs the following:

- Pull requests into `dev` or `main`: install, typecheck, and production-build all three apps.
- Pushes to `dev`: run the same quality gate without deployment.
- A merged release pull request into `main`: run the quality gate, then deploy all three projects in parallel.
- Manual workflow runs: run the quality gate without production deployment.
- Each deployment: build with the pinned Vercel CLI, deploy the prebuilt output, and smoke-test its deployment URL.

Because this workflow owns production deployment, each app includes a `vercel.json` that disables Vercel's automatic deployment for `main`. This avoids duplicate production deployments while keeping Vercel's automatic branch and pull-request previews available.

The `main` branch protection rule requires pull requests and the CI quality check. Add required reviewers to the GitHub `production` environment if a second approval layer is needed later.

## 4. Assign domains in Vercel

Add each domain to its matching project under **Settings → Domains**:

- Website: `datastorified.com`
- Calculators: `calculators.datastorified.com`
- Tools: `tools.datastorified.com`

Optionally add `www.datastorified.com` to the website project and configure it to redirect permanently to `datastorified.com`.

Add the domains in Vercel before changing DNS. Vercel will display the exact DNS target and any ownership-verification TXT record required for each domain.

## 5. Configure DNS

The domain currently uses GoDaddy nameservers (`ns63.domaincontrol.com` and `ns64.domaincontrol.com`). Add these records in GoDaddy DNS:

| Type | Name | Target | Notes |
| --- | --- | --- | --- |
| `A` | `@` | `76.76.21.21` | Apex website |
| `A` | `calculators` | `76.76.21.21` | Calculator app |
| `A` | `tools` | `76.76.21.21` | Tools app |
| `CNAME` | `www` | Vercel-provided CNAME | Optional website redirect |

These are the exact records currently requested by Vercel. Remove conflicting A, AAAA, or CNAME records for the same hosts. If DNS is later moved to Cloudflare, keep its proxy disabled during Vercel verification and SSL provisioning.

After DNS resolves, Vercel automatically provisions HTTPS certificates. Confirm all four URLs in Vercel's Domains view and test them in a private browser window.

## 6. Release and rollback

Merging the reviewed `dev` → `main` release pull request starts the production workflow. The production domains move to the successful deployments after all three independent builds complete.

For rollback, open the affected Vercel project, select a known-good deployment, and choose **Promote to Production**. Each application can be rolled back independently.

## Local release checks

Run the same quality gate before pushing:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
```
