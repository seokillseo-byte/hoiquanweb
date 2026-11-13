# HOIQUANWEB — Master Blueprint

**Project:** HOIQUANWEB  
**Domain:** hoiquanweb.io.vn  
**Document status:** Working baseline — chưa phải bản Blueprint Final được nghiệm thu  
**Planning phase:** Phase 0 — Requirements & Blueprint  
**Language:** Tiếng Việt / English  
**Primary conversion:** Yêu cầu tư vấn và báo giá  
**Last reviewed:** 2026-11-13

---

## 1. Mục đích và nguyên tắc kiểm soát

**Final Validation (2026-11-13):** [PHASE_0_FINAL_VALIDATION.md](PHASE_0_FINAL_VALIDATION.md) — BLOCKED / NOT ACCEPTED. Phase 0 remains open; PR #43 CI is 2/2 success on latest PR HEAD `29a189a787281c925fb034be16f42e118ac8ca8a`: [Validate website and API — run 43409687056](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43409687056) and [Build isolated PR Preview — run 43409687119](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43409687119). The corresponding isolated artifact [14028368167](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43409687119/artifacts/14028368167) was downloaded and independently rechecked; see [QA_REVIEW_XC03_XC10.md](QA_REVIEW_XC03_XC10.md) section 9.6. Static SEO/route checks pass, while R-016/R-017/F-009 and content-owner approvals remain open. This is not Owner acceptance, runtime acceptance or release approval. **Technical/Security/QA gap audit:** [PHASE_0_TECHNICAL_SECURITY_QA_GAP_REGISTER.md](PHASE_0_TECHNICAL_SECURITY_QA_GAP_REGISTER.md).

Tài liệu này là điểm điều hướng trung tâm cho Blueprint HOIQUANWEB. Nó tổng hợp các quyết định đã được người dùng xác nhận, các thông tin còn thiếu và các tài liệu chuyên môn cần hoàn thiện.

Thứ tự ưu tiên nguồn thông tin:

1. Quyết định được người dùng xác nhận trong dự án.
2. Project Input đã được xác nhận.
3. Blueprint và tài liệu chuyên môn đã được duyệt.
4. Repository hiện tại — chỉ dùng để mô tả trạng thái mã nguồn/tài liệu, không tự động biến implementation thành yêu cầu nghiệp vụ.
5. Giả định của AI — không được ghi thành quyết định; nếu cần phải đánh dấu rõ.

**Quy tắc:** Không tự tạo USP, khách hàng mục tiêu ưu tiên, giá, case study, chứng nhận, số liệu hiệu quả, chính sách hoặc năng lực chưa được xác minh.

## 2. Project baseline — các quyết định đã xác nhận

| ID | Nội dung | Giá trị đã xác nhận | Trạng thái |
|---|---|---|---|
| DEC-001 | Brand | HOIQUANWEB | Approved |
| DEC-002 | Domain | hoiquanweb.io.vn | Approved |
| DEC-003 | Website type | Website doanh nghiệp/dịch vụ nhiều trang | Approved |
| DEC-004 | Languages | Vietnamese + English | Approved |
| DEC-005 | Market | Việt Nam và quốc tế; ưu tiên thị trường nói tiếng Anh | Approved |
| DEC-006 | Primary conversion | Nhận yêu cầu tư vấn và báo giá | Approved |
| DEC-007 | Service groups | Giữ nguyên 7 nhóm dịch vụ bên dưới | Approved |
| DEC-008 | SEO direction | SEO-first, kiến trúc SEO đồng bộ toàn website | Approved |
| DEC-009 | Delivery approach | Preview-first / Core-first; nghiệm thu trước khi mở rộng | Approved |
| DEC-010 | Scope control | Chỉ triển khai P0 trước; P1/P2 sau khi được duyệt | Approved |
| DEC-011 | Customer scope and rollout priority | Phục vụ cả B2C và B2B; ưu tiên B2C trước, sau đó mở rộng B2B; persona chi tiết còn TBD | Approved |
| DEC-012 | Factual business description | Owner-approved wording recorded in OWNER_DECISION_REVIEW.md; formal industry classification and operating/revenue model remain TBD | Approved (description only) |
| DEC-013 | Public USP and comparative claims for Core Preview | No public USP/comparative claim; use factual service descriptions only until a claim and evidence are separately approved | Approved (Preview content restriction) |
| DEC-014 | Interim visual system for Core Preview | Use interim blue/white visual system and retain five existing source-observed colors as provisional tokens; this is not the official brand identity | Approved (Preview only) |
| DEC-015 | Inquiry channel for Core Preview | Website consultation/quotation form with business email notification; destination, privacy/consent, backend/email setup and runtime acceptance remain prerequisites for live lead collection | Approved (channel only) |
| DEC-016 | Inquiry notification destination and handling owner | Use `info@hoiquanweb.io.vn` as the notification destination; the Project Owner personally monitors and manages incoming inquiries; mailbox delivery remains unverified | Approved (destination and handling ownership supplied) |
| DEC-017 | Inquiry data retention period | Retain customer inquiry data for 24 months from the last interaction | Approved (duration and starting point) |
| DEC-018 | Inquiry data action at retention expiry | Completely delete the customer's personal information and inquiry/request content when the 24-month period expires; backup handling is governed by DEC-020 | Approved (expiry action) |
| DEC-019 | Events resetting inquiry-data retention period | Reset the 24-month period when the Project Owner sends a quotation to the customer or when the customer replies; no other reset events are implied | Approved (event types) |
| DEC-020 | Backup handling for expired inquiry data | Retain backups until their normal lifecycle expires; when restoring, reapply retention rules and delete expired inquiry records before normal operation resumes; exact backup lifecycle duration remains TBD | Approved (handling policy only) |
| DEC-021 | Default language for hreflang x-default | Vietnamese (vi) is the default fallback destination; each genuine VI/EN pair points x-default to its Vietnamese URL | Approved (2026-11-13) |
| DEC-022 | Core Web Vitals acceptance thresholds | LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1; evaluate field p75 separately for mobile and desktop where data is available; lab results remain separate | Approved (2026-11-13); other performance targets remain TBD |

### 2.1 Bảy nhóm dịch vụ đã chốt

1. Website
2. Software
3. Mobile App
4. Game
5. SEO
6. AI & Automation
7. Other Technology Services

Không tự ý gộp, đổi tên hoặc loại bỏ nhóm dịch vụ nếu chưa có phê duyệt.

## 3. Các thông tin quan trọng còn thiếu

Danh sách câu hỏi xác nhận tập trung, không suy diễn thay Owner, được quản lý tại [OWNER_DECISION_REVIEW.md](OWNER_DECISION_REVIEW.md). Chỉ các câu trả lời được Owner xác nhận mới được cập nhật thành quyết định đã duyệt.

Các mục dưới đây chưa được người dùng xác nhận. Chúng là giới hạn đối với việc hoàn thiện định vị, nội dung bán hàng và thiết kế chuyển đổi.

| ID | Thông tin cần xác nhận | Ảnh hưởng | Trạng thái |
|---|---|---|---|
| TBD-001 | Persona, nhu cầu, use case và demographic cụ thể của B2C (ưu tiên trước); buyer roles/company size của B2B (giai đoạn sau) | Messaging, IA, UX, CTA, content | Open — sequencing approved |
| TBD-002 | Ngành phân loại chính thức và mô hình vận hành/nguồn doanh thu (mô tả doanh nghiệp đã được duyệt tại DEC-012) | Business Blueprint, trust, legal content | Partially resolved |
| TBD-003 | Evidence-backed USP / Value Proposition for a future approved release | Homepage, service messaging and differentiation | Deferred for Core Preview — no public USP claim authorized by DEC-013 |
| TBD-004 | Quy mô khách hàng và pain points | Persona, solution mapping | Open |
| TBD-005 | Portfolio/case study có quyền công bố | Trust, proof, E-E-A-T signals | Open |
| TBD-006 | Giá, cách tính phí, chính sách báo giá | Pricing page, quote flow | Open |
| TBD-007 | Official logo, brand guidelines, final typography and official brand identity (interim Preview tokens approved under DEC-014) | UI/Design System | Partially resolved — Preview interim system approved; official identity remains TBD |
| TBD-008 | Production hosting, deployment và ownership | Technical/Architecture Blueprint | Open |
| TBD-009 | Chính sách vận hành, bảo hành, hỗ trợ và SLA | Service content, legal, conversion | Open |
| TBD-010 | Thị trường/quốc gia tiếng Anh ưu tiên | Localization, keyword research, legal | Open |
| TBD-011 | Mailbox access, monitoring procedure and operational availability | F-009, notification routing and operations | Open — Project Owner confirmed as direct handler under DEC-016; mailbox delivery/access and monitoring procedure still require verification |
| TBD-012 | Privacy notice, consent wording and detailed data-retention/handling rules for inquiry form | F-009, Security & Compliance, legal acceptance | Partially resolved — 24 months (DEC-017), complete deletion at expiry (DEC-018), reset events (DEC-019), and backup handling (DEC-020) approved; exact backup lifecycle duration, separate legal/operational exceptions and final notice/consent remain open |
| TBD-013 | Configured inquiry API, verified mailbox delivery, email sender/provider and end-to-end delivery evidence | F-009, Architecture, QA and deployment | Open — destination supplied; runtime configuration and testing required |

Không được dùng nội dung mẫu như dữ liệu thật. Khi cần thiết kế layout trước khi có dữ liệu, dùng placeholder nội bộ có nhãn CONTENT REQUIRED; không xuất bản placeholder.

### 3.1 Thứ tự ưu tiên khách hàng đã được Owner xác nhận

- **Giai đoạn ưu tiên đầu tiên: B2C.** Homepage, thông điệp giới thiệu, thứ bậc nội dung và hành trình tư vấn/báo giá cần ưu tiên khách hàng cá nhân.
- **Giai đoạn tiếp theo: B2B.** Bổ sung/điều chỉnh thông điệp và hành trình cho doanh nghiệp/tổ chức sau khi nền tảng B2C-first được xác lập.
- B2B vẫn thuộc phạm vi khách hàng của HOIQUANWEB; thứ tự này không loại bỏ B2B khỏi website và không tự động mở rộng Core Preview P0.
- Persona, độ tuổi, nhu cầu, use case, ngành nghề và dữ liệu hành vi cụ thể vẫn TBD cho đến khi có thông tin xác thực.

## 4. Mục tiêu và phạm vi Core Preview

### 4.1 Mục tiêu

Tạo bản Preview website công khai đa trang để người dùng nghiệm thu cấu trúc, giao diện, nội dung nền tảng, khả năng chuyển đổi và SEO kỹ thuật cơ bản trước khi phát triển các module vận hành nâng cao.

### 4.2 Trong phạm vi Core Preview (P0)

- Trang chủ.
- Giới thiệu HOIQUANWEB.
- Trang tổng quan dịch vụ.
- Trang chi tiết cho 7 nhóm dịch vụ đã chốt.
- Trang dự án/portfolio; chỉ hiển thị dự án có dữ liệu và quyền công bố.
- Trang kiến thức/blog nếu nội dung được xác nhận; không tạo bài viết giả để lấp trang.
- Trang liên hệ/yêu cầu tư vấn và báo giá.
- Điều hướng song ngữ Việt/Anh.
- Responsive cho mobile, tablet và desktop.
- Metadata SEO theo trang, canonical, hreflang, sitemap, robots, Open Graph, structured data phù hợp.
- Trạng thái form: validation, submitting, success, error; không thông báo gửi thành công nếu backend không xác nhận.
- Trang 404 và các trạng thái lỗi/empty cần thiết.

### 4.3 Ngoài phạm vi Core Preview

Không triển khai trong đợt này nếu chưa có phê duyệt riêng:

- CMS nâng cao/page builder.
- CRM mở rộng và workflow nội bộ.
- Customer Portal.
- Thanh toán, hóa đơn, booking.
- AI chatbot, AI content automation.
- Hosting/domain provisioning.
- Template marketplace provisioning/checkout.
- Các tích hợp vận hành production chưa được lựa chọn.

Các module này có thể tồn tại trong roadmap dài hạn của repository; điều đó không làm chúng trở thành P0 của Core Preview.

## 5. Information Architecture — cấu trúc cấp cao

Đây là cấu trúc nội dung mục tiêu để hoàn thiện; URL cuối cùng phải được xác minh trong URL Map trước khi implementation.

| Page group | Nội dung/chức năng | Ngôn ngữ |
|---|---|---|
| Home | Brand, service overview, value proposition đã xác nhận, process, proof hợp lệ, CTA | VI/EN |
| About | Thông tin doanh nghiệp đã xác nhận, năng lực có bằng chứng | VI/EN |
| Services | Tổng quan 7 nhóm dịch vụ | VI/EN |
| Service detail | Vấn đề, phạm vi, deliverables, quy trình, FAQ, CTA theo từng nhóm | VI/EN |
| Portfolio | Dự án được phép công bố | VI/EN |
| Knowledge/Blog | Bài viết có nguồn, tác giả/người duyệt và nội dung hữu ích | VI/EN |
| Contact / Request a quote | Form tư vấn/báo giá, consent và thông tin liên hệ xác minh | VI/EN |
| Legal / Policy | Điều khoản, quyền riêng tư và các chính sách cần thiết | VI/EN |

Build generator scripts/build_public_site.mjs khai báo 40 localized page routes theo cấu trúc dữ liệu hiện tại (7 service pairs, 3 project pairs và các page groups VI/EN). URL inventory chi tiết 20 cặp VI/EN, mục đích trang, CTA, topic seed và indexation proposal được ghi tại [URL_MAP.md](URL_MAP.md); đây là inventory từ source code, không phải xác nhận rằng toàn bộ nội dung đã được duyệt để index. CI run 43364707457 đã chạy generator và validator thành công: log xác nhận Generated 40 localized pages và Public site validation passed: 40 pages, internal links/assets, localized metadata, canonical sitemap, brand tokens and inquiry fallback. File sitemap.xml ở repository root chỉ có homepage; Pages workflow tạo website từ public-site/dist và deploy sitemap được sinh trong build output. Preview artifact build cũng thành công ở run 43364707609. Live production deployment vẫn chưa được thực hiện hoặc nghiệm thu.

## 6. Blueprint deliverable register

Blueprint Standard yêu cầu đủ 19 phần. Trạng thái dưới đây phản ánh tiến độ tài liệu, không phải trạng thái hoàn thành phần mềm.

| # | Blueprint module | Trạng thái | Ghi chú |
|---:|---|---|---|
| 01 | Executive Summary | Working baseline — not final | Master Blueprint sections 1–4 summarize confirmed scope and open inputs; a concise Owner-approved executive summary remains pending |
| 02 | Business Blueprint | Partial — source-of-truth baseline | Confirmed business facts and TBDs remain in Master Blueprint; dedicated Business Blueprint still needs full module treatment and Owner input |
| 03 | Brand Blueprint | Partial — interim Preview system only | DEC-014 approves provisional blue/white Preview tokens; official identity, logo, brand story, voice and final typography remain TBD |
| 04 | Competitor Blueprint | Research framework draft created | Xem [COMPETITOR_BLUEPRINT.md](COMPETITOR_BLUEPRINT.md); no competitor selected or assessed; market, service scope and shortlist inputs remain open |
| 05 | SEO Blueprint | Draft created — review required | Xem [SEO_BLUEPRINT.md](SEO_BLUEPRINT.md); keyword research, market-specific mapping, competitor evidence, assembled Preview QA and R-016 remain open |
| 06 | Content Blueprint | Draft created — review required | Xem [CONTENT_BLUEPRINT.md](CONTENT_BLUEPRINT.md); service-scope inputs, keyword validation, portfolio proof, pricing and approved page copy remain open |
| 07 | UX Blueprint | Draft complete — review required | Xem [UX_BLUEPRINT.md](UX_BLUEPRINT.md); journey baseline đã định nghĩa, persona/customer research còn TBD |
| 08 | UI Blueprint | Draft complete — review required | Xem [UI_BLUEPRINT.md](UI_BLUEPRINT.md); tokens hiện tại là code-observed, brand identity chính thức còn TBD |
| 09 | Feature Blueprint | Draft complete — review required | Xem [FEATURE_BLUEPRINT.md](FEATURE_BLUEPRINT.md); P0 được giới hạn trong Core Preview |
| 10 | Technical Blueprint | Draft / partial | Xem [TECHNICAL_BLUEPRINT.md](TECHNICAL_BLUEPRINT.md); P0 technical contract documented, production topology/runtime and acceptance evidence remain TBD |
| 11 | Architecture Blueprint | Draft / partial | Xem [ARCHITECTURE_BLUEPRINT.md](ARCHITECTURE_BLUEPRINT.md); 15 deliverables consolidated; production topology and runtime acceptance remain TBD |
| 12 | Performance Blueprint | Planning draft created; Core Web Vitals thresholds approved under DEC-022; actual measurement pending | Xem [PERFORMANCE_BLUEPRINT.md](PERFORMANCE_BLUEPRINT.md); Lighthouse, TTFB, asset budgets, API and load targets remain TBD |
| 13 | Security Blueprint | Draft / partial | Xem [SECURITY_BLUEPRINT.md](SECURITY_BLUEPRINT.md); P0 controls/test plan documented; runtime, privacy, backup/restore and security acceptance remain open |
| 14 | AI Blueprint | Deferred | Không thuộc Core Preview |
| 15 | Marketing Blueprint | Strategy framework draft created | Xem [MARKETING_BLUEPRINT.md](MARKETING_BLUEPRINT.md); no campaigns, budgets, numeric targets or public USP approved; audience, channel and measurement inputs remain open |
| 16 | Development Roadmap | In progress | Dùng roadmap hiện tại, cần tách Core Preview khỏi roadmap dài hạn |
| 17 | Risk Assessment | Draft complete | Xem RISK_ASSESSMENT.md; rủi ro chưa được đóng |
| 18 | Project Timeline | Not baselined | Chưa ước lượng trước khi scope/inputs được xác nhận |
| 19 | Final Validation | Pending | Chỉ thực hiện sau khi các deliverables và TBD cần thiết được xử lý |

## 7. Requirement traceability

Traceability chi tiết cho toàn bộ 55 trường Project Input được đánh dấu Required nằm tại [PROJECT_INPUT_TRACEABILITY.md](PROJECT_INPUT_TRACEABILITY.md). Cross-check đầy đủ 19 module, owner role, priority, dependencies, acceptance evidence, Project Input gaps và các điểm mâu thuẫn liên tài liệu được quản lý tại [BLUEPRINT_CROSS_CHECK.md](BLUEPRINT_CROSS_CHECK.md). Các tài liệu này là bản rà soát, không thay thế quyết định của Project Owner.

| Requirement ID | Nguồn | Requirement | Deliverable | Acceptance evidence |
|---|---|---|---|---|
| REQ-BIZ-001 | User-confirmed decision | Primary conversion là yêu cầu tư vấn/báo giá | BP-02, BP-07, BP-09 | CTA và form hoạt động đúng, có trạng thái backend rõ ràng |
| REQ-BIZ-002 | User-confirmed decision | Giữ 7 nhóm dịch vụ | BP-02, BP-06, BP-09 | Có đủ 7 nhóm trong IA và service overview |
| REQ-WEB-001 | User-confirmed decision | Website nhiều trang | BP-05, BP-06, BP-07, BP-09 | URL inventory và từng route được kiểm thử trực tiếp |
| REQ-I18N-001 | User-confirmed decision | Việt/Anh | BP-05, BP-06, BP-08 | Nội dung, navigation, metadata, hreflang tương ứng |
| REQ-SEO-001 | User-confirmed decision | SEO-first toàn website | BP-05, BP-06, BP-08 | Per-route metadata, canonical, hreflang, sitemap, robots, structured data |
| REQ-QA-001 | Project standards | Không nghiệm thu khi có placeholder/dữ liệu giả/lỗi nghiêm trọng | BP-19 | QA evidence và danh sách lỗi được đóng |

Requirement IDs là mã truy vết trong Blueprint; không thay thế mã requirement của hệ thống quản lý khác nếu dự án đã có quy ước riêng.

## 8. Dependencies và blockers

1. Target audience/primary segment để hoàn thiện persona và messaging.
2. Business description, USP và competitive advantages để hoàn thiện homepage/service content.
3. Portfolio evidence và publishing permission để hoàn thiện trust sections.
4. Pricing policy để quyết định có public pricing hay chỉ quote CTA.
5. Brand identity để khóa UI tokens và visual direction.
6. Production domain/hosting/API decisions để hoàn tất technical deployment plan.
7. Route inventory và sitemap generation phải đồng nhất trước SEO acceptance.

## 9. Change control

- Mọi thay đổi phạm vi P0 phải có lý do, tác động, priority và xác nhận.
- Không thêm feature chỉ vì repository đã có code hoặc vì dễ triển khai.
- Không đánh dấu Approved khi chỉ mới có đề xuất.
- Không đánh dấu Complete nếu thiếu acceptance evidence.
- Mọi thay đổi ảnh hưởng URL phải cập nhật URL Map, internal links, canonical, hreflang, sitemap và redirect plan.
- PR chỉ được merge sau review, CI và nghiệm thu phù hợp; production deployment cần phê duyệt riêng.

## Governance & Development Readiness

- [HDO-019 — Project Governance & Development Readiness](HDO-019_PROJECT_GOVERNANCE_AND_DEVELOPMENT_READINESS.md): hồ sơ quản trị và điều kiện sẵn sàng; hiện là Draft — For Owner Review. Gate 2 và Development Authorization chưa được phê duyệt.

## 10. Exit criteria cho Phase 0

Phase 0 chỉ được đóng khi:

- [ ] Project Input critical fields đã được xác nhận hoặc được ghi nhận rõ là không chặn Core Preview.
- [ ] 19 Blueprint modules có deliverable/status/owner/dependency/acceptance criteria; đối chiếu tại [BLUEPRINT_CROSS_CHECK.md](BLUEPRINT_CROSS_CHECK.md), owner roles vẫn cần Project Owner xác nhận.
- [x] Feature Blueprint P0 đã được lập thành draft: [FEATURE_BLUEPRINT.md](FEATURE_BLUEPRINT.md).
- [x] UI Blueprint Core Preview đã được lập thành draft: [UI_BLUEPRINT.md](UI_BLUEPRINT.md).
- [x] UX Blueprint baseline đã được lập: [UX_BLUEPRINT.md](UX_BLUEPRINT.md); persona validation vẫn chờ target segment.
- [x] Content Blueprint đã được lập thành draft: [CONTENT_BLUEPRINT.md](CONTENT_BLUEPRINT.md); keyword research, service-scope inputs, editorial ownership and content approval remain open.
- [x] SEO Blueprint đã được lập thành draft: [SEO_BLUEPRINT.md](SEO_BLUEPRINT.md); keyword evidence, competitor research, assembled Preview QA and R-016 remain open.
- [x] Competitor Blueprint research framework đã được lập: [COMPETITOR_BLUEPRINT.md](COMPETITOR_BLUEPRINT.md); competitor shortlist and evidence collection remain open.
- [x] Marketing Blueprint strategy framework đã được lập: [MARKETING_BLUEPRINT.md](MARKETING_BLUEPRINT.md); channel validation, budget, campaign approvals and KPI baselines remain open.
- [ ] UX Blueprint / persona / journey được hoàn thiện sau khi target segment được xác nhận.
- [ ] Scope P0/P1/P2 không mâu thuẫn với roadmap repository.
- [x] URL inventory 20 cặp / 40 route đã được đối chiếu với route generator; policy indexation và sitemap vẫn cần triển khai/kiểm thử.
- [ ] Sitemap chỉ chứa canonical public URLs đủ điều kiện index; blog-detail shell bị loại khỏi sitemap và noindex.
- [ ] VI/EN language architecture và hreflang rules được định nghĩa.
- [ ] Brand/Content placeholders không bị trình bày như dữ liệu thật.
- [ ] Technical decisions cần cho Preview được phân biệt với quyết định production.
- [ ] Risk Assessment có mitigation và residual risk.
- [ ] User review và phê duyệt Blueprint trước khi chuyển sang UI/Development.
- [ ] Inquiry endpoint, approved recipient/email, privacy/consent wording and end-to-end form + email delivery acceptance are confirmed.
- [ ] Core Preview / first usable platform release được phân biệt rõ trong mọi tài liệu.
- [ ] Performance acceptance thresholds được Project Owner quyết định hoặc ghi nhận rõ là TBD. x-default language fallback đã được Owner phê duyệt là tiếng Việt theo DEC-021; generated-artifact và Preview verification vẫn phải hoàn tất.

**Current decision:** Phase 0 chưa được tuyên bố hoàn tất. Core Preview được phép chuẩn bị theo các quyết định đã xác nhận, nhưng không được tự điền các dữ liệu nghiệp vụ còn thiếu.


## Appendix A — URL Map

- Source of truth: `scripts/build_public_site.mjs`.
- Detailed route inventory and indexation matrix: [docs/URL_MAP.md](URL_MAP.md).
- The inventory is source-verified; keyword targets, content approval, indexation recommendations and runtime acceptance remain pending.


## Appendix B — Feature and UI specifications

- [Feature Blueprint](FEATURE_BLUEPRINT.md): P0 feature register, functional/non-functional requirements, dependencies and acceptance criteria.
- [UI Blueprint](UI_BLUEPRINT.md): public site shell, page templates, components, responsive and accessibility rules.
- Both documents are draft planning specifications and require owner review; neither marks implementation or production runtime as accepted.


- [UX Blueprint](UX_BLUEPRINT.md): visitor journey, service discovery, language switching, inquiry flow and evidence-based validation plan.
- [Content Blueprint](CONTENT_BLUEPRINT.md): bilingual content architecture, seven service groups, page templates, topic-cluster framework, CTA, localization, E-E-A-T, media, internal linking and maintenance rules; draft for Owner review.
- [SEO Blueprint](SEO_BLUEPRINT.md): keyword research method, intent/mapping, clusters, metadata, schema, entities, E-E-A-T, technical/indexation gates, link-building governance and KPIs; draft for Owner review.
- [Executive Summary](EXECUTIVE_SUMMARY_BLUEPRINT.md): concise source-grounded project scope, decisions, blockers and Phase 0 exit conditions; draft for Owner review.
- [Business Blueprint](BUSINESS_BLUEPRINT.md): 15 mandatory business deliverables, confirmed facts, open commercial/audience inputs and acceptance controls; draft for Owner review.
- [Brand Blueprint](BRAND_BLUEPRINT.md): 15 mandatory brand deliverables and interim Preview tokens; official identity remains unapproved.
- [Competitor Blueprint](COMPETITOR_BLUEPRINT.md): competitor classification, evidence protocol and comparison framework; no market findings or competitor claims asserted.
- [Marketing Blueprint](MARKETING_BLUEPRINT.md): audience sequencing, channel framework, funnel, inquiry governance, KPIs and budget approval controls; no campaigns or spend authorized.
- [Blueprint Cross-check](BLUEPRINT_CROSS_CHECK.md): đối chiếu 19 modules, Project Input completeness, approved role-responsibility model, cross-document conflicts, blockers và Phase 0 exit criteria.
- [Performance Blueprint](PERFORMANCE_BLUEPRINT.md): metric definitions, test protocol, optimization strategy, monitoring and owner-approved acceptance threshold requirements.
- [Owner Decision Review](OWNER_DECISION_REVIEW.md): các quyết định còn thiếu cần Project Owner xác nhận trước Blueprint Final.
