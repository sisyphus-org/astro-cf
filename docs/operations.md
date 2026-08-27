# Operations

## CI

`.github/workflows/ci.yml` runs for pull requests and pushes to non-`main` branches. It installs dependencies, runs tests and type checks, builds Astro, and validates the Worker with a Wrangler dry run. This workflow has read-only repository permissions and does not receive Cloudflare secrets.

## Production deployment

A push to `main` runs `.github/workflows/deploy.yml`: install, test, build, Wrangler dry run, then deploy the production Worker named `astro-cf`. Production has no manual branch dispatch path.

The workflow consumes the organization-level `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets; values must never be copied into this repository.

## Optional branch preview

`.github/workflows/preview.yml` is a manually dispatched workflow for non-`main` branches. Select the target branch in GitHub Actions and run **Deploy branch preview**. With the GitHub CLI:

```sh
gh workflow run preview.yml --ref <branch>
```

The workflow derives a stable, sanitized Worker name from the full branch name:

```text
astro-cf-preview-<branch-slug>-<branch-hash>
```

It then deploys with `wrangler deploy --name <preview-worker>`. Because the Worker name is never `astro-cf`, a preview cannot replace the production Worker or its URL. The exact preview URL is emitted by Wrangler and added to the GitHub Actions job summary when available.

Preview deploys are intentionally manual: ordinary branch pushes and pull requests run CI only and never receive Cloudflare credentials.

### Preview cleanup

After review, find the Worker name in the workflow summary and delete only that preview Worker:

```sh
npx wrangler delete astro-cf-preview-<branch-slug>-<branch-hash>
```

Confirm the name begins with `astro-cf-preview-` before approving deletion. Never use this cleanup command with `astro-cf`.

## Verification

1. Open the deployment URL printed by `cloudflare/wrangler-action`.
2. Confirm `/` returns `200` and displays the landing page.
3. Confirm `/api/health` returns `200` with `{ "status": "ok" }`.
4. Confirm an unknown route returns the generated `404.html` with status `404`.
5. Review the GitHub Actions run and Cloudflare Workers logs for exceptions.

## Observability

Worker observability is enabled in `wrangler.jsonc`. For live inspection from an authenticated workstation:

```sh
npx wrangler tail astro-cf --format json
npx wrangler tail astro-cf --status error
```

Do not paste log output containing request credentials or personal data into issues.

## Rollback

1. Identify the last known-good version:

   ```sh
   npx wrangler versions list
   ```

2. Inspect it if needed:

   ```sh
   npx wrangler versions view <VERSION_ID>
   ```

3. Roll back interactively to the previous version, or specify the known-good version:

   ```sh
   npx wrangler rollback
   npx wrangler rollback <VERSION_ID>
   ```

4. Re-run the verification checks above and record the incident separately.

A code rollback should also be made through a new pull request so `main` matches the deployed state.
