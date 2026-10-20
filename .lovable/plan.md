# Between Us — migration to your own database

## Status and recommended approach

**Planning only.** The current app, code, design, database, accounts, and storage have not been changed. Your destination has not been connected or inspected; its empty public schema is based on your report. An empty public schema does not mean its managed authentication/storage schemas are empty.

The source is **Lovable Cloud-managed PostgreSQL, Cloud authentication, and private Cloud storage**, not a project administered in your own Supabase account. The destination would be the Supabase project you own, including its authentication and storage.

**Lowest-risk route:** restore and test a separate copy against your owned project, leaving this Cloud-backed app intact until a final, approved cutover. This is not a simple connection toggle. Do not remove the current database as a migration step. Source removal/disconnection is not a safe switching method; deletion, if offered by the platform, risks permanently losing Cloud data.

### Live source inventory

Read-only database inspection found **4 accounts, 4 profiles, 1 relationship, 2 relationship members, 2 invitations, 0 rate-limit rows, and 0 stored files**. The invitations are one accepted and one cancelled; there are currently no open invitations or pending approvals. Identity counts are two email identities and two Google identities. These counts may change before export and do not prove every user flow has been tested.

## What migrates and what needs separate setup

| Item | Handling |
|---|---|
| Tables, rows, constraints, indexes, application functions, trigger, RLS | Included in the database export; restore with destination compatibility checks. Preserve UUIDs and timestamps. |
| Accounts, password hashes, authentication identities | Included in the full database export. Use a supported auth-aware restore, not CSV account recreation. Preserve user IDs and identity associations. |
| Storage file contents | Not in the database export. Download separately from **More → Storage**, then upload at identical paths into the private destination bucket. Currently there are zero objects. Recheck at cutover. |
| Bucket configuration and file access rules | Verify/recreate private bucket settings and storage RLS; exported metadata is not a substitute for uploading actual files. |
| Active sessions and signed photo URLs | Do not promise portability. Require a fresh destination login and generate new signed URLs. Do not copy source signing keys or browser session tokens. |
| Google provider credentials, email settings, redirect allowlists, API keys, secrets | Not exported; configure separately at the destination. |
| Application source, static images, PWA assets | Separate from the database export; retain the existing source and visual assets. |

**Export path:** More → Database → Manage → Settings → Export project data → Export data → Database → Export → Start export. Download from the emailed link or More → Storage. If Test/Live environments are present, select the intended environment explicitly.

Exports require a running backend, support databases up to 15 GB and export files up to 5 GB, and are limited to one export per 24 hours. Export contains private account data and password hashes: store it securely, never publish it in Git or the app.

## Accounts, invitations, and couples

- **Email/password:** preserving supported password hashes should let existing users keep their passwords. Confirm destination sign-in before cutover. If an auth-compatible restore cannot be completed, stop and discuss a reset-based alternative; do not silently create replacement accounts.
- **Google:** recreate provider configuration and callback/redirect settings. The app currently uses Lovable's managed Google sign-in helper; a standalone destination copy needs destination-compatible OAuth wiring. Preserve Google identity/provider-subject associations and verify login returns the same user UUID, not a duplicate profile. This has not been tested against your destination.
- **Sessions:** tell users to sign in again after switching. Old password-reset/confirmation links should be treated as invalid for the destination; request fresh links. Verify account confirmation state, reset emails, allowed URLs, and email delivery.
- **Invitations:** copy code, owner/joiner IDs, status, and original expiry unchanged. Do not regenerate codes or restart seven-day lifetimes during migration. Accepted/cancelled/expired codes stay unusable. Rate-limit timestamps should transfer too so migration does not reset an outstanding lockout.
- **Approval:** joining expresses the invited partner's consent and marks the invitation pending; only its creator can approve activation. Acceptance atomically creates the relationship and both memberships. Preserve this flow, including cancellation rights for either participant.
- **Couples:** retain relationship IDs and membership user IDs. The primary key on membership user_id prevents a user belonging to multiple relationships. Acceptance also checks both users under row locks. Self-joining remains blocked.
- **Anniversary:** acceptance takes the creator's saved anniversary for the shared relationship. Later profile saves update the shared anniversary; individual profile anniversaries can differ. Preserve this existing behavior and verify both Home screens use the shared relationship date. Counters are calculated in the app, not stored separately.

## Migration stages — execute only after approval

1. **Confirm destination and hosting.** Verify ownership, region, database/auth versions, existing managed records, capacity, and a free-compatible host for the existing full-stack app. A separate hosted copy avoids modifying this working Cloud project. A static-only host is not automatically compatible with its server runtime.
2. **Take an official source export and separate file downloads.** Record counts and a secure inventory, including invitation statuses and file paths. Do not create users in the destination before determining the restore method.
3. **Inspect the export and design the restore order.** Avoid blindly overwriting destination-managed auth/storage schemas, roles, migrations, or platform extensions. Restore compatible auth accounts/identities and application data with original IDs. Ensure the signup trigger does not create duplicate profile rows during import. Verify extensions/function owners, grants, constraints, indexes, RLS, and storage configuration.
4. **Restore into your empty destination for rehearsal.** Use supported restore tooling for the actual export format. Install application-owned objects in dependency order, restore data respecting foreign keys, and verify accounts and files. No destination changes occur in this planning stage.
5. **Configure destination authentication and a separate app copy.** Set public connection values and any server-only configuration, update Google integration and session handling, configure email/callback URLs, regenerate database types if needed, and regenerate signed photo URLs. Keep all design and page behavior unchanged. Never put privileged credentials in browser code.
6. **Run migration acceptance checks.** Compare all row counts, IDs, dates, codes, statuses, hashes/identity compatibility without exposing secrets, and file paths. Test existing email and Google login, profile save/readback, photo upload/access, create/copy/share/join/approve, both Home screens and anniversary counters, all tabs, and sign-out. Test anonymous access and an unrelated third account against private data, plus self-join, duplicate couples, code reuse/expiry, cancellation, and rate limiting. Existing mocked tests alone are insufficient.
7. **Freeze source writes for final transfer.** Pause new signups and edits/invitations, take the final export when the 24-hour restriction permits, repeat the verified restore, and rerun critical checks. A planned maintenance window avoids losing writes between export and switching.
8. **Switch only after success.** Direct users to the tested destination-backed app and require fresh login. Keep the source untouched/read-only for a controlled fallback. Rollback after destination writes requires reconciliation; it is not a harmless toggle. Any later deletion is a separate explicit decision.

## Unfinished features — not part of this migration

No tables or storage exist for the following features. Migration cannot make them persistent; propose them separately after the existing app passes destination tests.

| Feature now | Persistence needed later |
|---|---|
| Daily question answer modal; answers unsaved | Question/date identifiers and answers linked to author and couple; access/reveal rules to be decided. |
| Love-letter writing preview; not saved or sent | Couple/author/recipient-linked letters, content, draft/sent state and timestamps; drafts should not automatically become partner-readable. |
| Memories; add button reports saving unimplemented | Couple-linked memory records, captions/dates, file metadata, and a separate private photo bucket with couple-scoped access. |
| Activity idea preview; no tracking | Couple-linked activity records, participants and completion/status dates. |

The daily quote/question text is fixed, not a scheduled content service. No answer history, letter delivery, memory archive, or activity history can be exported because none is stored. Partner updates currently use query refresh/manual checking, not a demonstrated realtime subscription. None of these extras is required to preserve the current app during migration.

## Technical inventory — exact current application schema

`?` means nullable. All other columns are NOT NULL. `timestamptz` means timestamp with time zone.

| Table | Columns and defaults |
|---|---|
| profiles | id uuid PK; name text default ''; photo_path text?; birthday date?; anniversary date? |
| relationships | id uuid PK default gen_random_uuid(); anniversary date; created_at timestamptz default now() |
| relationship_members | user_id uuid PK; relationship_id uuid |
| partner_invitations | id uuid PK default gen_random_uuid(); owner_id uuid; code text UNIQUE default new_invite_code(); joiner_id uuid?; status text default 'open'; expires_at timestamptz default now() + interval '7 days'; created_at timestamptz default now() |
| invite_join_attempts | user_id uuid; created_at timestamptz default now(); no primary key |

Foreign keys, all ON DELETE CASCADE: profiles.id → auth.users.id; relationship_members.user_id → profiles.id; relationship_members.relationship_id → relationships.id; partner_invitations.owner_id and joiner_id → profiles.id. invite_join_attempts has no foreign key.

Checks: profiles name length ≤40; photo_path null or first path segment equals profile UUID; invitation status in open/pending/accepted/cancelled. Indexes: all four PK indexes, unique invitation code index, and invite_join_attempts_user_time on (user_id, created_at). No additional application tables were found.

### Functions and trigger

- my_relationship() → uuid; is_my_partner(target uuid) → boolean: membership lookup helpers.
- create_user_profile() → trigger; create_profile_on_signup is AFTER INSERT ON auth.users and calls it.
- save_profile(p_name text = NULL, p_birthday date = NULL, p_anniversary date = NULL, p_photo_path text = NULL) → void: validates signed-in owner, trimmed name 1–40, required anniversary and no future dates, owner photo path; upserts profile and updates shared anniversary.
- create_partner_invitation() → partner_invitations: completed profile, no existing couple, reuses valid open/pending invitation or inserts one.
- new_invite_code() → text: extensions.gen_random_bytes(8), collision check, alphabet ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (8 symbols, 40 bits).
- join_partner_invitation(p_code text) → text: uppercase/remove non-alphanumerics, regex ^[A-HJ-NP-Z2-9]{8}$, 10 failed attempts/hour/user; successful join clears that user's attempts; open/unexpired code, self/active-couple/pending checks; sets pending.
- invitation_request_name(p_id uuid) → text: exposes only pending unexpired joiner name to creator.
- resolve_partner_invitation(p_id uuid, p_accept boolean) → void: participant cancellation; creator-only unexpired pending acceptance; locked profile/membership checks; inserts couple/members, accepts this invitation and cancels their other outstanding invitations.

All are SECURITY DEFINER with search_path public except new_invite_code, which is currently SECURITY INVOKER and executable only by postgres/service_role. Other functions have authenticated/service_role execution and no public/anon execution. Preserve behavior and safe owners. pgcrypto in extensions is the code-generator dependency; UUID generation must also resolve at the destination.

### RLS and permissions

RLS is enabled, not forced, on all five public tables. Policies target authenticated:

- profiles_read SELECT: id = auth.uid() OR is_my_partner(id).
- profiles_update UPDATE: owner-only USING and WITH CHECK. However authenticated currently lacks table UPDATE privilege; profile changes use save_profile instead.
- invitations_read SELECT: owner_id = auth.uid() OR joiner_id = auth.uid().
- members_read SELECT and relationships_read SELECT: relationship ID = my_relationship().
- invite_join_attempts: no policies; direct user access denied.
- No other public INSERT/DELETE policies; invitation/couple writes occur through checked functions.

Live table ACLs grant broad privileges to anon/authenticated/service_role except authenticated profile UPDATE; RLS still blocks unpermitted rows/operations. At the destination, explicitly grant only required API privileges and retain service-role administration; do not copy source-only sandbox grants. Preserve function execution restrictions.

### Storage and a discovered limitation

One bucket: **profile-photos**, private, limit **2,097,152 bytes**, no bucket MIME allowlist. Paths start with user UUID; the app requests 3,600-second signed URLs.

- photo_insert: authenticated INSERT, bucket match, first folder = auth.uid(), extension jpg/jpeg/png/webp.
- photo_delete: authenticated DELETE, bucket match and own first folder.
- photo_read: authenticated SELECT, bucket match and own first folder OR an EXISTS profile check.
- No UPDATE storage policy.

**Important source defect:** the live partner-read subquery compares `profiles.photo_path = profiles.name`, rather than the stored object's path. It therefore does not reliably authorize the intended partner photo. Nothing was fixed. Treat correct partner photo access as a destination acceptance requirement and obtain approval for a narrowly scoped policy correction; do not claim the existing rule already works.

The join-attempt limit is a count-then-insert check without a per-user lock, so concurrent attempts warrant a security test; it is not a proven hard concurrency cap. This plan does not alter it.

Authentication also depends on auth.users, auth.identities, managed session infrastructure, auth.uid(), the signup trigger, email/password flows, Lovable's Google OAuth helper, browser auth storage, and server bearer-token middleware. Only restore managed internals by supported procedures. No app-owned Edge Functions were found in the inspected source; request/server middleware belongs to the existing full-stack app, not this SQL export.

## Costs and remaining limitations

A ₹0 start is plausible using your destination's Free plan and free-compatible hosting, within their quotas. Ownership does not require a paid AI API. Free service limits, project pausing, storage/egress, email sending, and hosting compatibility must be verified before committing to zero ongoing cost; no destination usage or billing was inspected. Google provider setup is separate from Cloud's managed helper. A custom domain, larger usage, reliable email service or always-on requirements could add costs.

No tests or builds were run because no code changed. This is an inspected plan, not a completed migration or verified destination login. **Next approval:** authorize a destination compatibility and export-format review, not an immediate cutover or new-feature implementation.