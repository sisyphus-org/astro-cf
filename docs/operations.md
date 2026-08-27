# Operations

## CI

`.github/workflows/ci.yml` runs for pull requests and pushes to non-`main` branches. It installs dependencies, runs tests and type checks, builds Astro, and validates the Worker with a Wrangler dry run. This workflow has read-only repository permissions and does not receive Cloudflare secrets.

## Production deployment

A push to `main` runs `.github/workflows/deploy.yml`: install, test, build, Wrangler dry run, then deploy the production Worker named `astro-cf`. Production has no manual branch dispatch path.

The workflow consumes the organization-level `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets; values must never be copied into this repository.

## Optional branch preview

`.github/workflows/preview.yml` is a privileged workflow stored and executed from the default branch. Leave the workflow run ref set to `main`, provide the branch/tag/commit in the required `target_ref` input, and run **Deploy branch preview**. With the GitHub CLI:

```sh
gh workflow run preview.yml --ref main -f target_ref=<branch-or-commit>
```

The first job checks out `target_ref`, runs CI, builds Astro, and creates a credential-free Worker bundle. It never receives Cloudflare credentials. The second job checks out the trusted `main` revision containing the workflow and `wrangler.preview.jsonc`, downloads only the built bundle and static assets, and then receives the Cloudflare credentials.

The trusted preview configuration enables Workers.dev but defines no custom routes, production bindings, or migrations. All third-party actions in privileged workflows are pinned to reviewed full commit SHAs.

The workflow derives a stable, sanitized Worker name from `target_ref`:

```text
astro-cf-preview-<ref-slug>-<ref-hash>
```

The exact preview URL is emitted by Wrangler and added to the GitHub Actions job summary when available. The production Worker remains `astro-cf`; ordinary branch pushes and pull requests run CI only and never receive Cloudflare credentials.

### Required GitHub environment protection

The privileged job uses the `branch-preview` GitHub environment. Configure that environment with narrowly scoped deployment-branch rules and, when available, required reviewers. Manual dispatch is an approval gate, not a substitute for repository access control. A preview-only Cloudflare token should replace the shared token if Cloudflare account isolation becomes available.

### Preview cleanup

After review, copy the exact Worker name from the workflow summary. The guarded script refuses names outside the `astro-cf-preview-*` namespace and requires explicit confirmation:

```sh
./scripts/delete-preview.sh astro-cf-preview-<ref-slug>-<ref-hash> --confirm
```

Never delete `astro-cf`; it is the production Worker.

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
