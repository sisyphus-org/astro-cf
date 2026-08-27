# Astro × Cloudflare landing

Minimal Astro landing page deployed as Cloudflare Worker + Static Assets.

## Local development

```sh
npm ci
npm run dev
```

## Checks

```sh
npm test
npm run typecheck
npm run build
npm run deploy:dry-run
```

## CI and deployment

- Pushes to non-`main` branches and pull requests run `.github/workflows/ci.yml`: tests, typecheck, build, and a Wrangler dry run. CI never receives Cloudflare secrets.
- Pushes to `main` run `.github/workflows/deploy.yml` and deploy the production Worker `astro-cf`.
- `.github/workflows/preview.yml` is manually dispatched for a non-`main` branch. It deploys a branch-specific Worker named `astro-cf-preview-<branch>-<hash>`, so it cannot overwrite production.

Preview deployment requires the existing organization-level Cloudflare secrets. No secret values belong in the repository.

See [`docs/operations.md`](docs/operations.md) for preview commands, verification, cleanup, logs, and rollback.
