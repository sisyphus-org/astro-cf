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
- `.github/workflows/preview.yml` is manually dispatched **from `main`** with a `target_ref` input. It builds that ref without Cloudflare credentials, then a separate privileged job deploys only the resulting bundle through trusted `main` workflow/configuration.
- Preview deployment uses `wrangler.preview.jsonc`, which has Workers.dev enabled and deliberately contains no custom routes, production bindings, or migrations. Its Worker name is always `astro-cf-preview-<ref>-<hash>`.

Preview deployment requires the existing organization-level Cloudflare secrets. No secret values belong in the repository.

See [`docs/operations.md`](docs/operations.md) for preview commands, verification, cleanup, logs, and rollback.
