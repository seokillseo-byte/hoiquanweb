# HOIQUANWEB — Security Blueprint

**Deliverable ID:** BP-SEC-01  
**Module:** 13 — Security Blueprint  
**Status:** Draft — for Security/Operations, Technical Lead and Project Owner review  
**Scope:** Core Preview P0 and its inquiry/privacy dependencies  
**Date:** 2026-11-13

> This is a security planning and acceptance document, not a penetration-test report, security certification or production-readiness approval. It does not authorize new implementation, infrastructure changes, live data collection or deployment.

## 1. Purpose and objectives

Define the minimum security and privacy requirements that must be designed, tested and evidenced before Core Preview can collect inquiries or be considered release-ready.

Objectives:
1. Protect public visitors and any personal information submitted through the inquiry channel.
2. Keep administrative and customer-only capabilities outside the public P0 boundary unless separately approved.
3. Enforce authorization and data isolation on the server, not in frontend UI.
4. Define testable controls for input handling, sessions, secrets, logging, retention, backups and incident response.
5. Distinguish repository test evidence from runtime security acceptance.

## 2. Scope and trust boundaries

### In scope
- Public VI/EN website and its static assets.
- Public navigation, route handling and SEO metadata.
- Consultation/quotation form, only after F-009 approval.
- Inquiry API, email notification and associated personal data, once configured.
- Preview/staging environment and its credentials/data boundaries.

### Excluded from Core Preview unless separately authorized
- Advanced CMS administration and page builder.
- Customer Portal, CRM expansion, private project files.
- Payments, invoices, booking, hosting/domain provisioning.
- AI chatbot, AI content automation and other integrations.

Existing repository code for excluded capabilities is not authorization to expose or operate them in P0.

## 3. Security assets and data classification

| Asset/data | Classification | Required handling |
|---|---|---|
| Public page content and assets | Public | Publish only approved factual content; protect build/deploy integrity |
| Inquiry name, email, service request and message | Personal/confidential | Minimize collection; transmit securely; restrict access; apply approved retention/deletion |
| Inquiry email notifications | Personal/confidential | Deliver only to approved destination; do not expose content in public logs |
| API keys, provider tokens, session secrets | Secret | Server-side secret store only; never commit or expose to frontend |
| Admin/session credentials | Restricted | Server-enforced authentication and authorization; secure session lifecycle |
| Customer/private files (future scope) | Restricted | Private by default; authorized server-side access; outside P0 absent separate approval |
| Logs and diagnostics | Internal; may contain personal data | Redact secrets and unnecessary personal information; define retention/ownership |

## 4. Threat and control register

### SEC-01 — Authentication and session protection

- **Objective:** Prevent unauthorized access to protected application functions.
- **Priority:** P0 for any protected endpoint; admin/customer console remains outside public P0.
- **Owner/stakeholder:** Technical Lead; Security/Operations; QA.
- **Requirements:** Use a reviewed authentication/session mechanism; server-side role assignment; secure cookie attributes where cookie sessions are used; session expiry/revocation and recovery rules; CSRF protection where applicable.
- **Acceptance criteria:** Unauthenticated requests are denied; invalid/expired sessions are rejected; cookies use Secure, HttpOnly and appropriate SameSite settings on HTTPS; CSRF defenses are tested where relevant; recovery does not disclose account existence.
- **Dependencies:** Approved runtime and auth configuration.
- **Risks:** Session theft, privilege escalation, insecure recovery.
- **Evidence:** Configuration review, integration tests and staging HTTP/security-header captures.
- **Status:** Partial — Better Auth and selected integration tests exist in repository; runtime acceptance pending.

### SEC-02 — Authorization and tenant/customer isolation

- **Objective:** Ensure every protected action is authorized for the actor and target record.
- **Priority:** P0 for any protected API; portal/CRM features remain outside Core Preview.
- **Owner/stakeholder:** Development, Security/Operations, QA.
- **Requirements:** Deny by default; authorize every API operation and record lookup/mutation; roles are assigned by the server; never trust client-supplied role, owner ID or price.
- **Acceptance criteria:** Role matrix covers every protected endpoint; forbidden role/action combinations return denial; cross-customer access tests prove isolation; direct object-reference manipulation cannot expose another user's records.
- **Dependencies:** Approved role model, API inventory and data model.
- **Risks:** Broken access control and data disclosure.
- **Evidence:** Endpoint/role matrix, automated integration tests and negative test logs.
- **Status:** Partial — selected role/customer isolation tests are reported; complete endpoint inventory and staging evidence remain open.

### SEC-03 — Input validation, injection and abuse resistance

- **Objective:** Reject malformed, oversized or abusive requests safely.
- **Priority:** P0 for public inquiry/API endpoints.
- **Owner/stakeholder:** Development, Security/Operations, QA.
- **Requirements:** Validate server-side schemas; constrain lengths and payload sizes; encode output by context; parameterize database access; apply rate limits and abuse controls; use safe error messages.
- **Acceptance criteria:** Invalid fields and oversized payloads are rejected; stored/reflected XSS and injection test cases do not execute; rate limits behave as documented; errors do not reveal secrets or stack traces.
- **Dependencies:** API contract, runtime and rate-limit configuration.
- **Risks:** XSS, injection, denial of service, spam.
- **Evidence:** Negative API tests, security test report, configured limit evidence and redacted logs.
- **Status:** Partial / runtime evidence pending.

### SEC-04 — Secrets, configuration and dependency hygiene

- **Objective:** Prevent credentials and vulnerable dependencies from compromising the application.
- **Priority:** P0.
- **Owner/stakeholder:** Development, Security/Operations.
- **Requirements:** Store secrets only in approved server-side secret storage; separate Preview/staging/production credentials; never expose secret values in frontend bundles, source control or logs; review dependency vulnerabilities.
- **Acceptance criteria:** Secret scanning has no unresolved exposed credential; frontend bundle and repository review show no secret values; dependency findings are triaged and critical/high items are fixed or explicitly accepted by the Owner.
- **Dependencies:** Environment matrix and provider selection.
- **Risks:** Credential compromise and supply-chain exposure.
- **Evidence:** Secret scan report, dependency audit, redacted configuration review.
- **Status:** Not fully evidenced for the current release environment.

### SEC-05 — Privacy, consent and inquiry lifecycle

- **Objective:** Collect only approved inquiry data and enforce the Owner-approved retention policy.
- **Priority:** P0 blocker before live inquiry collection.
- **Owner/stakeholder:** Project Owner, Security/Operations, Development, QA.
- **Owner-approved policy:** Retain inquiry data for 24 months from last interaction. Reset only when the Project Owner sends a quotation or the customer replies. At expiry, completely delete the customer's personal information and inquiry/request content. Existing backups remain until their normal lifecycle ends; after restore, expired inquiry records must be removed before normal operation resumes.
- **Requirements:** Publish approved privacy notice and consent wording; explain data purpose and retention; restrict inquiry access to the authorized handler; define the backup lifecycle duration and any separate legal/operational exceptions; implement expiry calculation and restore-time purge.
- **Acceptance criteria:** Form does not collect live data until notice/consent and API/email delivery are accepted; policy text matches approved decisions; reset events are exact; expiry deletes the approved data scope; restored data is purged before service resumes.
- **Dependencies:** F-009; mailbox and sender configuration; backup lifecycle decision; applicable legal review.
- **Risks:** Unlawful/unclear collection, excessive retention, incomplete deletion.
- **Evidence:** Approved notice/consent, API/mail E2E report, retention tests and restore drill.
- **Status:** BLOCKED — policy decisions partly approved; notice/consent, runtime enforcement, backup duration and E2E evidence remain open.

### SEC-06 — Email and notification security

- **Objective:** Deliver inquiry notifications to the approved destination without exposing secrets or misrepresenting receipt.
- **Priority:** P0 before live inquiry collection.
- **Owner/stakeholder:** Project Owner, Development, Security/Operations, QA.
- **Requirements:** Verify mailbox access/deliverability; configure a sender/provider; keep provider credentials server-side; validate and normalize input; prevent header injection; avoid including unnecessary sensitive data in logs.
- **Acceptance criteria:** Verified sender and destination; successful delivery test; failed delivery/retry is observable; form success is based on durable API acceptance, not merely a client event.
- **Dependencies:** F-009, provider selection and approved environment.
- **Risks:** Lost inquiries, spoofing, data leakage.
- **Evidence:** Redacted delivery logs, provider test, failure/retry test and API response record.
- **Status:** BLOCKED — destination supplied; mailbox and sender not verified.

### SEC-07 — Transport, browser and security headers

- **Objective:** Protect browser-to-site/API communication and reduce common browser attack surfaces.
- **Priority:** P0.
- **Owner/stakeholder:** Technical Lead, Security/Operations, QA.
- **Requirements:** HTTPS for public and API endpoints; appropriate HSTS after HTTPS/domain readiness; restrictive Content-Security-Policy where compatible; frame protection, MIME sniffing protection, referrer policy and permissions policy as appropriate; strict CORS allowlist for API origins. CORS is not authentication.
- **Acceptance criteria:** HTTPS and redirect behavior verified; security headers captured on actual Preview/staging; CORS allows only approved origins and rejects unapproved origins; no mixed content.
- **Dependencies:** Hosting/domain/API topology.
- **Risks:** Interception, clickjacking, script injection, cross-origin abuse.
- **Evidence:** Header scan and browser/network captures.
- **Status:** TBD until actual host and API origins are known.

### SEC-08 — Logging, monitoring and incident response

- **Objective:** Detect security-relevant failures without collecting unnecessary personal data.
- **Priority:** P0 for live inquiry runtime; broader monitoring can be staged.
- **Owner/stakeholder:** Security/Operations and Project Owner.
- **Requirements:** Define security events, log access, redaction, retention, alert ownership, incident severity, escalation and recovery procedure.
- **Acceptance criteria:** No secret values in logs; access to logs is restricted; operational owner and response path are documented; test alert or incident drill is recorded before production acceptance.
- **Dependencies:** Runtime/provider and staffing assignment.
- **Risks:** Undetected compromise and uncontrolled personal-data exposure.
- **Evidence:** Redacted sample logs, monitoring configuration, ownership and incident runbook.
- **Status:** Open — provider, retention and named ownership not approved.

### SEC-09 — Backup, restore and deletion assurance

- **Objective:** Preserve recoverability while enforcing the approved inquiry-data expiry policy.
- **Priority:** P0 before live inquiry collection.
- **Owner/stakeholder:** Security/Operations, Development, Project Owner.
- **Requirements:** Document backup scope, frequency, normal lifecycle duration, access controls, encryption, restore authority and rollback. After restore, purge inquiry records whose approved retention period has expired before normal service resumes.
- **Acceptance criteria:** Backup lifecycle duration is documented; restore drill succeeds in a test environment; expired inquiry data is removed before restored service resumes; evidence and operator are recorded.
- **Dependencies:** Data store/provider decision; SEC-05; staffing.
- **Risks:** Irrecoverable data loss or restoration of expired personal data.
- **Evidence:** Backup policy, test restore log and post-restore purge verification.
- **Status:** Open — handling rule approved, lifecycle duration and implementation/test evidence pending.

## 5. Minimum P0 security test plan

| Test ID | Test | Expected result | Current status |
|---|---|---|---|
| SEC-T01 | Unauthenticated access to protected endpoint | Denied | Partial evidence in repository; staging pending |
| SEC-T02 | Role matrix negative tests | Unauthorized actions denied server-side | Partial |
| SEC-T03 | Cross-customer record access | No access to another customer's data | Selected tests reported; full scope pending |
| SEC-T04 | Invalid/oversized request and injection payloads | Safe rejection; no execution or sensitive error | Pending complete report |
| SEC-T05 | Rate limit and repeated inquiry abuse | Limits enforced; no false success | Pending runtime configuration |
| SEC-T06 | Secret/dependency scan | No exposed secrets; findings triaged | Evidence pending |
| SEC-T07 | Cookie/session/CSRF/CORS checks | Secure attributes and origin policy verified | Runtime/provider dependent |
| SEC-T08 | Inquiry privacy/consent and retention | Approved notice; exact reset/expiry behavior | Blocked by F-009 |
| SEC-T09 | Email delivery and failure handling | Verified sender/destination; observable retry/failure | Blocked |
| SEC-T10 | Backup restore and expiry purge | Restored expired inquiries removed before service resumes | Blocked |
| SEC-T11 | Security headers and HTTPS | Headers and transport verified on actual Preview/staging | Host dependent |
| SEC-T12 | Logging review | No secrets/unnecessary personal data; access restricted | Pending |
| SEC-T13 | Incident response readiness | Named owner, severity/escalation and recovery steps documented | Pending staffing/provider |

Record each test as PASS / FAIL / BLOCKED / NOT APPLICABLE with commit, environment, evidence reference and reviewer. Do not claim PASS without retained evidence.

## 6. Dependencies and risk links

- F-009 and decisions D-05 through D-10.
- TBD-008 production hosting/runtime and resource ownership.
- GAP-TECH-01, GAP-ARCH-01 and GAP-QA-01.
- R-009, R-010, R-012, R-013, R-015 and R-017.
- HDO-019 readiness conditions and the Owner's release authority.

## 7. Acceptance and authority

**Status: PARTIAL / NOT ACCEPTED.** The repository contains selected authentication and authorization controls/tests, but the complete P0 security profile, runtime configuration, privacy and inquiry lifecycle evidence, backup/restore test, monitoring ownership and staging verification are not complete.

This Blueprint does not close any risk, authorize Gate 2, authorize new implementation, permit live inquiry collection, or approve merge/deployment/production changes.
