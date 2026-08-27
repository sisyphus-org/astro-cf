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

- Pull requests run read-only CI automatically. They also show one optional user-facing `Deploy preview` check. No preview build or deployment starts until a required reviewer approves the `branch-preview` environment. After approval, `Internal / Build preview` and `Internal / Publish preview` remain separate for credential isolation but require no further user decisions.
- Pushes to `main` continue to run `.github/workflows/deploy.yml` and deploy the production Worker `astro-cf`.
- After approval, PR code is built without credentials on one runner; a separate trusted runner verifies/bootstraps the secret-free `astro-cf-preview` service and uploads the artifact with `wrangler versions upload --preview-alias`. Production `astro-cf` is never referenced or modified.
- Cloudflare non-production branch builds must remain disabled so they cannot bypass the GitHub approval gate. Cloudflare Access `Previews only` protects the resulting isolated preview alias.

Preview deployment requires the existing organization-level Cloudflare secrets. No secret values belong in the repository.

See [`docs/operations.md`](docs/operations.md) for preview commands, verification, cleanup, logs, and rollback.
