# Cloudflare staging setup — Hội Quán Web

This runbook is for PR #9 Better Auth end-to-end acceptance. It deliberately does not deploy anything. Keep staging isolated from production.

## Isolation requirements
- Create a separate Cloudflare Pages project for preview and a separate Worker/D1 database for staging.
- Do not use the production D1 ID, production secrets, production email recipients, or production domain for this environment.
- Keep PR #9 Draft/unmerged until the acceptance checks below pass.
- Never commit credentials, .dev.vars, the generated backend/wrangler.staging.toml, or real database IDs.

## 1. Create a staging D1 database
From the repository root, use the Cloudflare account intended for staging:

```sh
npx wrangler d1 create hoiquanweb-staging
```

Copy the returned database ID into a local copy of backend/wrangler.staging.example.toml named backend/wrangler.staging.toml. Use a separate, verified HTTPS frontend origin for both AUTH_BASE_URL and ALLOWED_ORIGINS. Do not use the GitHub Pages production origin or a guessed hostname.

The generated local config is ignored by Git. Verify before proceeding that database_name is hoiquanweb-staging and the ID is the newly created staging ID, not production.

## 2. Apply migrations only to staging
From the repository root:

```sh
npx wrangler d1 migrations apply hoiquanweb-staging --remote --config backend/wrangler.staging.toml
```

Read the Wrangler output carefully before confirming any migration. If the database name/ID is not the new staging database, stop.

## 3. Configure staging-only secrets
Set secrets using the staging config, never the production config. Add only secrets required by the Worker code and staging email workflow:

```sh
npx wrangler secret put BETTER_AUTH_SECRET --config backend/wrangler.staging.toml
```

Use a newly generated, high-entropy secret for staging. Check the current Worker implementation for any additional required secret names before deployment. Do not reuse production secrets. Do not paste secrets into GitHub issues, PR comments, chat, or source files.

## 4. Configure a separate frontend preview
Create a distinct Cloudflare Pages project in the dashboard and connect it to the intended PR/branch preview build. Do not change the existing production Pages project or production deployment branch. Record the actual preview hostname after Cloudflare provisions it, then update the local staging config with that exact origin.

If using GitHub Actions for deployment later, use a dedicated staging-only Cloudflare API token with minimum permissions, stored as a repository/environment secret. Do not add a deployment workflow until the staging Pages project, Worker name, D1 ID, origin, and secret names are known and reviewed.

## 5. Deploy only after reviewing the target
Once the isolated staging frontend and D1 have been verified, a maintainer can deploy the Worker explicitly with:

```sh
npx wrangler deploy --config backend/wrangler.staging.toml
```

This command is documented but not run by this setup change. Check output for the staging Worker name and inspect the D1 binding before accepting deployment. Do not run the production command/config as part of staging validation.

## 6. End-to-end acceptance checklist
- [ ] Preview frontend and Worker use a trusted same-site origin; no GitHub Pages to workers.dev third-party-cookie dependency.
- [ ] AUTH_BASE_URL and ALLOWED_ORIGINS exactly match the actual staging origin.
- [ ] Sign-up/sign-in, session refresh, and logout work in a real browser.
- [ ] Browser requests include credentials and CORS returns the exact allowed origin plus credentials support.
- [ ] Unauthenticated requests receive 401; authenticated customer without a role receives 403 for admin endpoints.
- [ ] Admin/staff roles are assigned out-of-band only after identity verification; customers cannot self-elevate.
- [ ] Legacy ADMIN_TOKEN is rejected for lead management.
- [ ] Customer and quote data are isolated between two test identities.
- [ ] Email verification/password recovery behavior and delivery are tested or documented as unavailable.
- [ ] Logs contain no passwords, session cookies, auth tokens, or unnecessary personal data.
- [ ] Evidence (run URLs, test results, actual origins, migration result) is attached to PR #9 before requesting review.

## Current blocker
This repository connection does not provide Cloudflare account access, a verified staging hostname, a staging D1 ID, or Cloudflare secrets. Therefore the safe work that can be committed is the isolated configuration template and this runbook. A public live preview and real Better Auth browser acceptance remain blocked until an authorized maintainer creates the isolated Cloudflare resources. No production deployment has been performed.
