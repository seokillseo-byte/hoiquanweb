# HOIQUANWEB — UI Blueprint

**Status:** Phase 0 design specification — draft complete, owner review required  
**Scope:** Public Core Preview only  
**Languages:** Vietnamese and English  
**Primary conversion:** Consultation and quotation requests  
**Brand identity:** Interim blue/white Core Preview system and five provisional tokens owner-approved under DEC-014; official logo, palette/typography guideline and identity approval remain pending (TBD-007)

---

## 1. Design objective

Create a clear, trustworthy, modern technology-services website that helps a visitor:
1. Understand what HOIQUANWEB offers.
2. Compare the seven approved service groups.
3. Review verified project/content evidence where available.
4. Request a consultation or quotation.

The UI must not use invented trust signals, fake dashboard metrics, fabricated customer logos, testimonials, awards, addresses or pricing.

## 2. Design-system baseline

### 2.1 Interim Core Preview color tokens and existing implementation tokens

The current public-site stylesheet defines:

| Token | Current value | Status / use |
|---|---|---|
| `--blue` | `#155EEF` | Owner-approved provisional Core Preview color; primary action |
| `--navy` | `#0B1F3A` | Owner-approved provisional Core Preview color; headings/deep surfaces |
| `--cyan` | `#38BDF8` | Owner-approved provisional Core Preview color; accent |
| `--surface` | `#F5F8FC` | Owner-approved provisional Core Preview color; soft surface |
| `--white` | `#FFFFFF` | Owner-approved provisional Core Preview color; main surface |
| `--ink` | `#14243B` | Existing implementation text token; not one of the five approved colors |
| `--muted` | `#61718A` | Existing implementation supporting-text token; not one of the five approved colors |
| `--line` | `#E2EAF3` | Existing implementation border token; not one of the five approved colors |
| `--gradient` | Blue-to-cyan gradient | Existing implementation effect; not separately approved as a brand asset |
| `--shadow` | Existing soft shadow | Existing implementation effect; not a brand token |

Current typography stack begins with Inter and falls back to system sans-serif. Existing layout tokens include a 1280px content container and rounded cards/buttons. Retain the current typography stack provisionally for Core Preview; this does not constitute official typography approval.

**Governance:** Exactly five color values (`--blue`, `--navy`, `--cyan`, `--surface`, `--white`) are owner-approved for interim Core Preview use only under DEC-014. Other listed CSS values are existing implementation tokens/effects, not part of the five-color approval and not an official brand palette. Official logo, final typography and brand guideline remain TBD-007.

### 2.2 Visual principles
- Clean, modern, professional technology-services presentation.
- Clear hierarchy: page title → supporting explanation → primary action → useful detail.
- Generous whitespace; avoid dense text walls and decorative effects that reduce readability.
- Consistent spacing, card radius, border and button behavior.
- Use real product/project imagery only when approved. Otherwise use restrained abstract visuals or neutral placeholders that do not imply a real customer result.
- Avoid generic stock imagery that falsely suggests staff, office, customers or completed projects.

## 3. Global site shell

### Header
- Brand mark/name on the left; use current repository mark only as a provisional asset until official logo is approved.
- Primary navigation: Home, About, Services, Projects/Knowledge (conditional visibility), Contact.
- Language switch (VI/EN) visible on desktop and mobile.
- One primary CTA: “Yêu cầu tư vấn” / “Request a consultation”.
- Sticky header is allowed if it does not obscure anchor targets or content.
- Mobile navigation uses a button with accessible name and `aria-expanded`; closes after route selection and remains keyboard-operable.

### Footer
- Brand identity and a short factual description.
- Links to approved service groups and public routes.
- Contact information only after owner confirmation.
- Privacy/legal links only when policy content is approved.
- No invented address, phone, registration number, social profile or office hours.

### Global states
- Current page/active navigation is clear.
- Language route is clear.
- Focus-visible state is visible.
- No public shell should expose admin/customer-only navigation.
- Loading, empty, error and not-found states use the same typography, spacing and color system.

## 4. Page templates and section structure

| Template | Applied pages | Required UI sections | Primary action |
|---|---|---|---|
| T-01 Home | `/`, `/en/` | Hero, approved service overview, process/approach (if confirmed), verified proof only, CTA, footer | Request consultation |
| T-02 About | `/gioi-thieu/`, `/en/about/` | Page hero, confirmed business description, working approach, factual company details | Contact |
| T-03 Service overview | `/dich-vu/`, `/en/services/` | Intro hero, seven service cards, process/FAQ if approved, CTA | Explore a service / inquire |
| T-04 Service detail | Seven VI/EN service pairs | Page hero, service scope, deliverables, process, relevant FAQ, related services, CTA | Request a quote |
| T-05 Project listing/detail | Project routes in URL Map | Listing/filter only if useful; verified project summary, scope and role; no fabricated outcome | Discuss similar work |
| T-06 Blog listing/detail | Blog routes in URL Map | Search/category only when content volume supports it; article title, author/date when verified, body, related service CTA | Read / inquire |
| T-07 Contact | `/lien-he/`, `/en/contact/` | Clear invitation, inquiry form, privacy/consent notice, verified alternative contact channel | Submit inquiry |
| T-08 FAQ | `/faq/`, `/en/faq/` | Grouped questions, keyboard-accessible disclosure, links to relevant service/contact pages | Contact |
| T-09 Privacy/legal | Privacy routes | Readable policy structure, last-updated date only when maintained, confirmed data controller/contact | Read / contact |
| T-10 404 | Unknown route | Clear not-found message, link to home/services/contact, preserve language where possible | Return to site |

### Home page hierarchy
1. Hero: concise value proposition only after USP is confirmed; until then use a factual service-oriented introduction.
2. Primary CTA and secondary navigation to services.
3. Seven approved service cards.
4. Process/engagement steps only when the real operating process is confirmed.
5. Project proof only when approved content exists.
6. Knowledge/blog preview only when approved articles exist.
7. Final consultation CTA.
8. Footer.

### Service detail hierarchy
1. Breadcrumb and page title.
2. Service-specific summary.
3. Scope and deliverables.
4. Process/working method only where confirmed.
5. FAQ specific to the service.
6. Related services.
7. Consultation/quotation CTA.

### Contact form layout
- Desktop: form and explanatory panel can use a two-column layout.
- Mobile: single-column form with full-width controls.
- Required fields visibly marked and programmatically associated with labels.
- Optional budget field must not imply fixed published pricing.
- Consent text must link to the approved privacy policy.
- Status region announces validation/submission/success/error to assistive technology.

## 5. Component inventory

| Component ID | Component | States / behavior |
|---|---|---|
| UI-001 | Site header/navigation | Default, active route, mobile closed/open, keyboard focus |
| UI-002 | Language switch | VI, EN, unavailable counterpart handling |
| UI-003 | Primary/secondary button | Default, hover, focus, active, disabled, loading |
| UI-004 | Hero block | Standard and compact page hero |
| UI-005 | Section heading | Eyebrow, title, supporting copy |
| UI-006 | Service card | Default, hover/focus, link destination |
| UI-007 | Project/content card | Approved content, optional image, empty state |
| UI-008 | Breadcrumb | Correct hierarchy and current page |
| UI-009 | FAQ disclosure | Collapsed/expanded, keyboard-operable |
| UI-010 | Form field | Default, required, invalid, disabled |
| UI-011 | Inquiry form status | Idle, submitting, accepted, failed, local fallback |
| UI-012 | Empty/error state | No content, API unavailable, retry where appropriate |
| UI-013 | Footer | Public links and approved contact details |
| UI-014 | 404 state | Not found, home/services recovery links |

## 6. Responsive behavior

Current stylesheet uses 980px and 720px breakpoints. Treat them as existing implementation breakpoints, not immutable design requirements.

Required viewport QA:
- 320px and 375px: narrow mobile.
- 768px: tablet portrait.
- 1024px: small desktop/tablet landscape.
- 1280px and wider: desktop.

Rules:
- Navigation collapses before items collide or overflow.
- Hero columns stack cleanly on mobile; decorative visual elements may be hidden if they compete with content.
- Service/project grids reduce columns progressively and become one column on narrow mobile.
- Buttons and form controls remain touch-friendly and do not require hover.
- Text does not clip; no horizontal scrolling caused by layout.
- Sticky header must not hide headings or focus targets.

## 7. Accessibility requirements

Target: WCAG 2.1 AA, subject to manual and automated verification.

- Semantic landmarks: header, nav, main, footer.
- One clear page-level H1; heading levels follow a logical hierarchy.
- Skip link is visible on keyboard focus.
- All interactive controls work with keyboard and have visible focus.
- Form controls have persistent labels, clear errors and status announcements.
- Color is not the only means of communicating status.
- Text/background contrast is checked for all normal and large text.
- Images have meaningful alt text; decorative images use empty alt.
- Mobile menu and FAQ disclosures expose state to assistive technology.
- Respect `prefers-reduced-motion`; avoid unnecessary motion.
- Focus order follows visual/reading order.

## 8. UI content and trust rules

- Do not invent the company history, team size, address, certifications or years in business.
- Do not publish testimonials, client logos, star ratings or case-study results without evidence and permission.
- Do not display a price, discount or guarantee until owner-approved.
- Do not show fake counters, live analytics, customer activity or operational status.
- Avoid placeholder lorem ipsum on public pages.
- When required facts are not ready, use a reviewed neutral presentation or keep the relevant optional section hidden.
- Vietnamese and English copy must be meaning-equivalent, not machine-translated filler.

## 9. UI acceptance checklist

- [ ] All page templates follow the documented hierarchy.
- [ ] The seven service groups are visible and distinct.
- [ ] Header, language switch, footer and CTA work across all public routes.
- [ ] No admin/customer portal UI appears in the public site shell.
- [ ] Mobile navigation works with keyboard, touch and screen reader state.
- [ ] Forms cover idle, invalid, submitting, accepted and failed states.
- [ ] No success state appears without server acceptance.
- [ ] Empty/conditional project and blog sections do not look broken or fabricated.
- [ ] Current CSS tokens are identified as provisional until brand approval.
- [ ] 320, 375, 768, 1024 and 1280+ viewports pass layout review.
- [ ] WCAG 2.1 AA checks are completed and evidence recorded.
- [ ] All content and visual assets have owner approval before production.

## 10. Open decisions

- TBD-007: official logo, palette, typography and brand identity.
- TBD-001 / TBD-004: target customer segment, company size and pain points.
- TBD-002 / TBD-003: approved company description and value proposition.
- TBD-005: publishable portfolio and visual proof.
- TBD-006: public pricing vs. quotation-only policy.
- TBD-009: warranty, support and SLA language.
- TBD-010: priority English-speaking markets and localization style.

These decisions do not authorize the designer or developer to invent missing business facts.

## R-017 implementation update — 2026-11-13

- Public navigation contains only active public information/service routes. The customer portal entry appears only when an HTTPS API base and the explicit portal-public flag are configured.
- The homepage presents the seven service groups with factual language. Unapproved slogan, project showcase and unconfirmed delivery-process claims are omitted.
- Project listing/detail routes are reserved and not generated, linked or indexed until project status, evidence and publication rights are approved.
- The standalone privacy information notice is noindex, is not linked from public navigation and is not represented as the approved legal policy.
- The inquiry form defaults to a local brief download and clearly states that no visitor data is sent to a server. Online submission requires an HTTPS API base, explicit privacy-policy approval, a valid HTTPS policy URL and visitor consent.
- Mobile navigation exposes localized open/close labels, closes on Escape/outside click, and returns focus to the menu button after Escape. Visible keyboard focus is provided for interactive controls.
- Decorative hero artwork is hidden from assistive technology; service labels and page content remain semantic.

## R-018 Admin workspace implementation update — 2026-11-13

- The existing admin modules are retained and placed in a two-column workspace with a sticky navigation rail on authenticated desktop sessions.
- Navigation links target the existing dashboard, lead, quote, CRM, CMS, media, template and delivery/support panels; no module/API contract is replaced.
- The login panel is shown before authentication. The workspace and navigation appear only after Better Auth sign-in and a server-side `/api/v1/me` role check confirms admin/staff.
- A sign-out action calls the Better Auth sign-out endpoint, clears client-side role state and returns the interface to the login panel.
- The workspace uses responsive horizontal navigation on narrow screens, visible focus states, improved table/card hierarchy and accessible labels.
- No account is created or role assigned by this UI change. Production authentication remains dependent on the configured Worker/D1 environment and server-side provisioning.
