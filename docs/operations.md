# Operations

## Deployment

A push to `main` runs `.github/workflows/deploy.yml`: install, test, build, Wrangler dry run, then deploy. The workflow consumes the organization-level `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets; values must never be copied into this repository.

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
