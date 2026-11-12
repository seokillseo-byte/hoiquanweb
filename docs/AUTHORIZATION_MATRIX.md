# Authorization matrix

This document records the server-side authorization contract currently implemented by the Cloudflare Worker. A signed-in identity does not automatically grant access to CRM or customer records.

## Role and membership matrix

| Capability | Anonymous | Authenticated without customer membership | Customer member | Customer owner / billing | Staff | Admin |
|---|---:|---:|---:|---:|---:|---:|
| Public published pages/posts/services/templates/media | Allow | Allow | Allow | Allow | Allow | Allow |
| Submit public lead | Rate-limited | Rate-limited | Rate-limited | Rate-limited | Rate-limited | Rate-limited |
| Read own profile/session | Deny | Allow | Allow | Allow | Allow | Allow |
| Read customer quotes | Deny | No records | Own customer only | Own customer only | Operational CRM access | Operational CRM access |
| Accept a sent, non-expired quote | Deny | Deny | Deny | Allow | Deny as customer | Operational admin action only |
| Read own orders/projects/tickets | Deny | No records | Own customer only | Own customer only | Admin workspace | Admin workspace |
| Read/write own notifications | Deny | Own user only | Own user only | Own user only | Own user only | Own user only |
| CRM leads/customers/quotes and assignments | Deny | Deny | Deny | Deny | Allow | Allow |
| Projects, milestones, tickets and private project files | Deny | Deny | Own membership; customer-visible files only | Own membership; customer-visible files only | Allow, including internal files | Allow, including internal files |
| CMS page/post/service draft create and edit | Deny | Deny | Deny | Deny | Allow | Allow |
| CMS publish/archive/restore/delete | Deny | Deny | Deny | Deny | Deny | Allow |
| CMS media upload, draft preview and metadata edit | Deny | Deny | Deny | Deny | Allow | Allow |
| CMS media publish/archive | Deny | Deny | Deny | Deny | Deny | Allow |
| Template catalog create/edit/revisions | Deny | Deny | Deny | Deny | Allow | Allow |
| Template publish/archive | Deny | Deny | Deny | Deny | Deny | Allow |
| Staff directory | Deny | Deny | Deny | Deny | Allow | Allow |
| Assign privileged roles | Deny | Deny | Deny | Deny | No public API | No public API |

## Enforcement notes

- Customer owner and billing memberships may accept a quote; ordinary customer members may read it but cannot accept it.
- Browser-supplied customer IDs are not proof of ownership. The Worker derives access from the authenticated user and customer membership table.
- Cross-customer resource reads return 404 where implemented to avoid resource-existence disclosure.
- Notifications are queried and mutated using the authenticated user ID, not a caller-supplied user ID.
- Customer project files are visible only to current project/customer members and only when marked customer-visible; staff/admin may access internal files.
- Staff may prepare and edit CMS drafts and template/media records. Publication, archive, restore and delete transitions are admin-only where implemented.
- Public sign-up cannot self-assign a privileged role. No public role-assignment API is exposed.

## Automated coverage

The integration suite exercises anonymous, ordinary-user, staff, admin, customer owner, customer member and billing boundaries across the main route families. Separate tests cover project/ticket/file membership boundaries, private file visibility, notification ownership, CMS media publication and public-only content delivery.

Primary test suite: backend/tests/auth.integration.test.js.

## Remaining verification

This is a source/test authorization matrix, not production acceptance. Full endpoint-by-endpoint negative tests for every HTTP method, session expiry/recovery, permission-change revocation, rate-limit behavior and staging browser/runtime verification remain outstanding. No Cloudflare staging or production deployment is implied.
