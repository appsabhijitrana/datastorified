# DataStorified deployment

DataStorified is deployed as three Vercel projects from the same Git repository.

| Vercel project | Root Directory | Production domain |
| --- | --- | --- |
| `datastorified-website` | `apps/website` | `datastorified.com` |
| `datastorified-calculators` | `apps/calculators` | `calculators.datastorified.com` |
| `datastorified-tools` | `apps/tools` | `tools.datastorified.com` |

## 1. Put the workspace in GitHub

The pipeline expects the production branch to be named `main`. Push this workspace to a private or public GitHub repository. Generated output, dependencies, local environment files, and Vercel link data are excluded by the root `.gitignore`.

## 2. Create the Vercel projects

In Vercel, import the same GitHub repository three times. Give each project the name and Root Directory shown above.

For every project:

1. Keep Framework Preset set to Next.js.
2. Use Node.js 20 or newer.
3. Leave Build Command and Output Directory on their detected defaults.
4. In the Root Directory settings, enable **Include source files outside of the Root Directory in the Build Step**. The apps import shared workspace packages from `packages/`.
5. Make one initial deployment so Vercel finishes creating the project.

This repository includes its pnpm version in `package.json`, and Vercel can detect the workspace from `pnpm-lock.yaml`.

## 3. Configure the GitHub pipeline

Create these GitHub repository variables under **Settings → Secrets and variables → Actions → Variables**:

| Variable | Value |
| --- | --- |
| `VERCEL_ORG_ID` | Vercel account/team ID |
| `VERCEL_WEBSITE_PROJECT_ID` | Project ID for `datastorified-website` |
| `VERCEL_CALCULATORS_PROJECT_ID` | Project ID for `datastorified-calculators` |
| `VERCEL_TOOLS_PROJECT_ID` | Project ID for `datastorified-tools` |

Create one GitHub repository secret:

| Secret | Value |
| --- | --- |
| `VERCEL_TOKEN` | A Vercel access token allowed to deploy all three projects |

The team and project IDs are shown in each Vercel project's **Settings → General** page. Create the token from Vercel account settings and store it only as a GitHub secret.

The workflow in `.github/workflows/ci-deploy.yml` performs the following:

- Pull requests: install, typecheck, and production-build all three apps.
- Pushes to `main`: run the same quality gate, then deploy all three projects in parallel.
- Each deployment: build with the pinned Vercel CLI, deploy the prebuilt output, and smoke-test its deployment URL.

Because this workflow owns production deployment, disable Vercel's automatic Git deployments after the initial project setup to avoid duplicate deployments. Keep the GitHub repository connected only if you want Vercel's separate automatic preview deployments; otherwise disconnect it under each project's Git settings.

Optionally add required reviewers or branch protection to the GitHub `production` environment and require the CI check before `main` can be updated.

## 4. Assign domains in Vercel

Add each domain to its matching project under **Settings → Domains**:

- Website: `datastorified.com`
- Calculators: `calculators.datastorified.com`
- Tools: `tools.datastorified.com`

Optionally add `www.datastorified.com` to the website project and configure it to redirect permanently to `datastorified.com`.

Add the domains in Vercel before changing DNS. Vercel will display the exact DNS target and any ownership-verification TXT record required for each domain.

## 5. Configure Cloudflare DNS

If Cloudflare remains the authoritative DNS provider, create the records Vercel reports. A typical configuration is:

| Type | Name | Target | Cloudflare proxy |
| --- | --- | --- | --- |
| `A` | `@` | `76.76.21.21` | DNS only |
| `CNAME` | `calculators` | Vercel-provided CNAME | DNS only |
| `CNAME` | `tools` | Vercel-provided CNAME | DNS only |
| `CNAME` | `www` | Vercel-provided CNAME | DNS only |

Use the exact values shown by Vercel rather than assuming the example targets. Remove conflicting A, AAAA, or CNAME records for the same host. Keep the Cloudflare proxy disabled during verification and SSL provisioning.

After DNS resolves, Vercel automatically provisions HTTPS certificates. Confirm all four URLs in Vercel's Domains view and test them in a private browser window.

## 6. Release and rollback

A merge or push to `main` starts the production workflow. The production domains move to the successful deployments after all three independent builds complete.

For rollback, open the affected Vercel project, select a known-good deployment, and choose **Promote to Production**. Each application can be rolled back independently.

## Local release checks

Run the same quality gate before pushing:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
```

