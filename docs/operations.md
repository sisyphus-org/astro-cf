# Operations

## CI

`.github/workflows/ci.yml` runs for pull requests and pushes to non-`main` branches. It installs dependencies, runs tests and type checks, builds Astro, and validates the Worker with a Wrangler dry run. This workflow has read-only repository permissions and does not receive Cloudflare secrets.

## Production deployment

A push to `main` runs `.github/workflows/deploy.yml`: install, test, build, Wrangler dry run, then deploy the production Worker named `astro-cf`. Production has no manual branch dispatch path.

The workflow consumes the organization-level `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets; values must never be copied into this repository.

## Approval-gated PR preview

Cloudflare **Builds for non-production branches must be disabled**. `.github/workflows/pr-preview.yml` is the only intended PR preview trigger.

When a non-draft same-repository pull request targets `main`, GitHub creates a `Preview approval` deployment for the protected `branch-preview` environment. No preview build or Cloudflare API call occurs until a required reviewer selects **Review deployments → Approve and deploy**.

After approval:

1. `build-preview` checks out the exact PR head SHA with persisted Git credentials disabled, runs tests/typecheck/build, and creates a credential-free Worker bundle and static-assets artifact. It has read-only repository permissions and no Cloudflare credentials.
2. `deploy-preview` starts on a separate runner, checks out the exact trusted workflow revision, installs trusted dependencies with lifecycle scripts disabled, validates the downloaded artifact boundary, and uses `wrangler.version-preview.jsonc`.
3. The privileged job verifies that the isolated Worker service `astro-cf-preview` has no secrets. If it does not exist yet, the job creates it once from trusted `main` placeholder code with `workers_dev: false`, no route, and no bindings. It then runs `wrangler versions upload --preview-alias <pr>-<branch-slug>-<hash>` for the isolated service without creating a production deployment. The production Worker `astro-cf` and its bindings are never referenced.
4. The workflow comments the protected preview URL on the PR.

The `branch-preview` environment must have a required reviewer and `Prevent self-review` disabled for the current owner-operated workflow. Do not make preview jobs required for merge; an unapproved preview is intentionally optional.

Cloudflare Access must remain configured as **Previews only** (`all_preview_workers`). The resulting URL has this form and is protected by the shared preview policy:

```text
pr-<number>-<branch-slug>-<hash>-astro-cf-preview.sisyphus-org.workers.dev
```

`astro-cf-preview` has `workers_dev: false`, `preview_urls: true`, and no production secrets, vars, storage bindings, routes, or migrations. The workflow fails closed if Cloudflare reports any secret on that service. Its first approved run may bootstrap the service using `wrangler.preview-bootstrap.jsonc`; the trusted placeholder deployment has no public route and no bindings.

### Cloudflare build setting

In **Workers & Pages → astro-cf → Settings → Build → Branch control**, keep **Builds for non-production branches** disabled. Otherwise Cloudflare Workers Builds will create a preview before the GitHub approval gate and defeat the optional-deployment contract.

## Verification

After an approved preview run:

1. Open the URL posted by `Approve and deploy PR preview` in the pull request comment.
2. With the approved Tailscale exit node, confirm `/` returns `200` and displays the PR revision.
3. Confirm `/api/health` returns `200` with `{ "status": "ok" }`.
4. Without the exit node from an external network, confirm the same preview URL returns `403`.
5. Confirm production `/` and `/api/health` still return `200` and do not contain the PR change.
6. Review GitHub Actions logs for build/upload failures. Cloudflare Preview URLs do not currently support Workers Logs, `wrangler tail`, or Logpush.

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
