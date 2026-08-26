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

## Deployment

Pushes to `main` deploy through GitHub Actions using organization-level Cloudflare secrets. No secret values belong in the repository.

See [`docs/operations.md`](docs/operations.md) for verification, logs, and rollback.
