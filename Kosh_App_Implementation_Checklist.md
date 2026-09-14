# Kosh App — Implementation Checklist (Status)

Canonical "what's left to build" tracker. Mirrors `Kosh_App_Full_Plan_v2.md` (product) and `Kosh_App_Backend_Plan.md` (schema/API). Keep this file in sync when items ship.

**Legend:** ✅ done · 🚧 partial / backend-only · ⬜ pending

---

## 1. Foundation
- ✅ Workspaces: `api`, `db`, `native`, `web`, `server`, `utils`, `language`, `env`, `auth`, `config`.
- ✅ Better Auth: email/password, verify-email, forgot/reset password, session; Expo client with cookie forwarding.
- ✅ Onboarding (3 steps), theme provider (Uniwind design tokens), react-query + tRPC (`utils/trpc.ts`).
- ✅ All migrations 0000→0005 applied; `db:generate` is a clean no-op currently.
- ⬜ Passkey / biometric login polish (passkey lib installed; plan §4 wants it).

## 2. Kosh — create & list  (DONE)
- ✅ `kosh.create` — NPR-only (no currency input), optional `startDate` (defaults to today, future blocked), `durationMonths` → computed `endDate`, 6-digit `transactionPin`, creator auto-inserted as **Adhyaksh** membership, sets `user.selectedKoshId`.
- ✅ `kosh.list` — infinite/keyset pagination (`createdAt DESC, id DESC`, cursor `timestamp|id`); only kosh the user is an **active member** of; returns per kosh: `memberCount`, `totalCollected` (contributions + collected penalties + interest received via repayments), `totalRemaining` (`totalCollected − outstanding balance of active+defaulted loans`).
- ✅ Native list screen (`(app)/kosh/index.tsx`) — LegendList (`@legendapp/list/react-native`), `onEndReached` pagination, pull-to-refresh, empty/loading/error states, card shows name, description, `NPR/month`, member count, role chip, Total collected / In kosh now.
- ✅ Targeted invalidation: `queryClient.invalidateQueries({ queryKey: trpc.kosh.list.queryKey() })` after create.
- ✅ Removed the planned stable `kosh.code` (migration 0005) — YAGNI; invite tokens carry their own regenerable `PREFIX-XXXX`.

## 3. Kosh — detail & management
- ⬜ **Kosh detail screen** (`(app)/kosh/[koshId]`) — make list cards navigable. Header: name/icon/description, stats (memberCount, Total collected, In kosh now, monthly amount, due day, start/end). Actions: manage members, invites, contributions, loans.
- ⬜ Kosh settings — edit `due_day`, `loan_cap`, description, icon; change `transactionPin` (Adhyaksh only).
- ⬜ Leave/remove-members flow + member removal notifications (plan §6 mentions `member_removed`).

## 4. Members
- ✅ Backend `membership.list(koshId)` — active members w/ name/email/image/role/joinedAt; requires active membership.
- ⬜ Member tab screen (`(tab)/member.tsx`) — list of selected kosh's members, role badges, status.
- ⬜ Member profile/detail (from avatar tap) — payments history later.

## 5. Treasurer (Koshadhyaksh) invites — backend done, UI pending
- ✅ Schema `kosh_role_request` (targetRole, status, reason, decidedAt).
- ✅ API: `membership.inviteTreasurer` (Adhyaksh only, pending-dupe check, `treasurer_invite` notification), `membership.respondTreasurerInvite` (accept → role flip in tx; reject → optional reason; `role_changed` notification to Adhyaksh with reason), `membership.treasurerRequests` (Adhyaksh/Koshadhyaksh), `membership.pendingTreasurerInvites`.
- ⬜ UI — pending-invites screen (deep link `screen: "treasurer-invites"`), accept/reject w/ optional reason; "Invite treasurer" picker from member list; requests list for Adhyaksh.

## 6. Invites & joining — backend done, UI pending
- ✅ Schema: `invite` (token unique, `maxUses`, `useCount`, `expiresAt` default now()+7d, status active/revoked/expired), `join_request` (per-invite, pending/approved/rejected, reviewedBy/At).
- ✅ API `invite.create(koshId, maxUses=50)` — Adhyaksh only; regenerable `PREFIX-XXXX` token (4-char prefix from kosh name, collision-safe), 7-day mandatory expiry; `invite.list` (Adhyaksh/Koshadhyaksh, lazily expires) ; `invite.revoke` (Adhyaksh only).
- ✅ API `invite.preview(token)` — any logged-in user; kosh info + validity (`active/expired/revoked/not_found`) + your membership state.
- ✅ API `invite.requestJoin(token)` — validates expiry / `maxUses` / kosh `maxMembers`, creates pending `join_request`, flips membership to `pending` (reactivates left/removed rows to dodge the (kosh,user) unique index), bumps `use_count`, notifies all active Adhyaksh — all in one transaction.
- ✅ API `invite.requests(koshId)` (manager view) and `invite.review(requestId, decision: approved|rejected, reason?)` — Adhyaksh only; approve → membership `active`+`joinedAt`, notifies requester; reject → deletes the pending membership (frees slot for re-request), notifies requester with optional reason.
- ⬜ UI — share sheet (copy code / link `kosh-app://invite/{token}` / QR), in-app QR scanner (`expo-camera`), manual code entry → kosh preview → "Request to Join"; Adhyaksh joins inbox to approve/reject.

## 7. Contributions — backend done, UI pending
- ✅ Schema: `contribution` (koshId, memberId, period, expectedAmount, `contributionAmount` = base paid, `penaltyAssessed` = charged, `penaltyPaid` = collected, status pending/paid/partial/late, datePaid, recordedBy). Total for a period is computed (`contributionAmount + penaltyPaid`), not stored.
- ✅ API `contribution.periodData(koshId, period?)` — lazy-generates a `contribution` row per active member for the period (expectedAmount = monthlyAmount, status and penaltyPrefill computed), returns members with existing record + computed `penaltyPrefill` (kosh.latePenaltyAmount when the period is past due and member short; otherwise 0). Period defaults via the 5-day rule (see §16). Adhyaksh-only.
- ✅ API `contribution.record(koshId, period, memberId, contributionAmount?, penaltyPaid?, repaymentAmount?)` — single member. Penalty auto-assessment only when the period is past due AND still short; full/early payers get 0; stored assessments are never recomputed. Repayment amount (when provided) goes to the member's active loan if one exists, split interest-first (accrued simple interest since issue, net prior interest) — kept independent of the contribution write.
- ✅ API `contribution.recordBulk(koshId, period, entries[])` — multi-member; per-entry try/catch so one bad row never blocks others. "Mark all paid" = entries with `contributionAmount: expectedAmount` (a `periodData.defaultPeriod` payload is pre-filled). Over-payment of loans is rejected per-entry without blocking the contribution.
- ✅ Smoke-tested end-to-end against the live dev server (32 assertions): period defaults/badges, sadasya FORBIDDEN, full/partial/late statuses, penalty assessment, interest-first repayment split, over-payment independence, no-loan rejection, financial totals, zod validation, full cleanup (`scripts/smoke-contribution.ts`).
- 🚧 Native recording screen (`(app)/contribution/index.tsx`) — period navigation (prev/next + reload default), per-member controlled inputs (contribution / penalty / loan repayment), live status chips + late badge, expected/entering totals, "Mark all as paid", bulk submit with per-member failure toasts; kosh picker fallback when opened without a `koshId`; reachable via a toolbar button on the Kosh list screen. Native `tsc --noEmit` clean. Not yet visually verified on a device.
- ⚠️ Decision logged: a fraction of `penaltyAssessed` may remain uncollected — only `penaltyPaid` counts toward collected funds.

## 8. Loans — schema exists, nothing built
- ✅ Schema: `loan_request` (origin member_requested/admin_initiated; borrower = `requestedBy` XOR `nonMemberBorrowerId`, both nullable — XOR enforced in mutation layer, approval chain, `resultingLoanId/TransactionId`), `loan` (principal, amountRemaining, status), non_member_borrower, `transaction`/`transaction_approval`. Repay writes through `loan_repayment` (`principalPortion` + `interestPortion`, applied interest-first per recorded business rule, + `remainingBalanceAfter`); repayment entries are written by `contribution.record`/`recordBulk` when `repaymentAmount` is given (independent of the contribution write — a failed repayment never rolls back a saved contribution, and over-payment is rejected per-entry).
- ⬜ API — request loan (member) / create (Adhyaksh, with Internal/External borrower picker incl. inline non-member creation), approve chain (Adhyaksh → Koshadhyaksh → disburse via transaction; admin_initiated skips `pending_adhyaksh`), repay (split into principal+interest, updates `amountRemaining`), broadcast notifications to all members.
- ⬜ UI — loan tab (`(tab)/loan.tsx` placeholder) + `(app)/loan/index.tsx` placeholder: request form, list, approve/reject inbox, repay.

## 9. Transactions & approvals / audit
- ⬜ Backend money-movement wrapper: contribution/loan/repayment/payout money moves go through `transaction` (status pending_approval/approved/rejected/executed) with `transaction_approval` (treasurer decision, reason when rejected).
- ⬜ Treasury-consistency checks when executing transfers (totalRemaining must not go negative).
- ⬜ `audit` table wiring (currently unused).

## 10. Notifications
- ✅ Schema with types: join/submit/approve/reject, role_changed, treasurer_invite, contribution_due/late, loan_*, transaction_*, chat, kosh_end, member_removed, security_alert.
- 🚧 Backend inserts for treasurer flow only.
- ⬜ API — list notifications (paginated), mark read, unread badge; per-type deep links.
- ⬜ UI — notification screen (`(app)/notification/index.tsx` placeholder).
- ⬜ Cron/scheduler for `contribution_due` / `loan_repayment_due` generation.

## 11. Chat — schema exists, nothing built
- ⬜ `chat` tab (`(tab)/chat.tsx` placeholder); threads (group/direct), messages (text/image/file/system).

## 12. Kosh-end payout — schema exists, nothing built
- ⬜ `kosh_end_payout` — payout on endDate, member distribution, notifications, mark kosh ended.

## 13. Account & settings
- ✅ update-profile, update-password screens.
- ✅ Home header exists (language selector demo on home tab).
- ⬜ Kosh switcher from home (uses `user.selectedKoshId`).
- ⬜ Security section (biometric/passkey hooks — wire `expo-local-authentication`), 2FA (plan).

## 14. Reports / statements
- ⬜ per-kosh statement: contributions collected, loans given/repaid, treasury balance; shareable/printable. (Stable kosh code removed — use name + id.)

## 15. Monetization (deferred / decided)
- Per plan §15: Nepal can't register Play merchant → Play Billing blocked for Nepal-registered accounts; wallet (eSewa/Khalti) alternative is non-compliant once on Play Store. Realistic path later: RevenueCat + Play Billing under supported-country entity, or non-Play distribution during pilot. Ads (Phase 5) also deferred.
- Phase 8–9 all deferred.

## 16. Implemented decisions worth remembering (don't re-litigate)
- Currency is **NPR-only**, not configurable.
- Start date optional → defaults to today; future dates blocked.
- Treasurers are **not** set at create time; only via invite/accept flow (backend ready, UI pending).
- Role names in Nepali: **Adhyaksh** (admin), **Koshadhyaksh** (treasurer), **Sadasya** (member).
- No stable kosh code; invite tokens regenerate per invite and always expire (default 7 days).
- No hard date-blocking: every period (past/current/future) is always recordable; date only drives the default period and late badges, never submission restrictions. Default period: if today is >5 days before the next `dueDay` occurrence → previous period; otherwise (within 5 days / on/after it) → the upcoming period (`contribution.defaultPeriodFor`).
- Late badge threshold = 5 days (same `LATE_THRESHOLD_DAYS` constant as the default-period rule).
- `totalCollected` = `sum(contribution.contributionAmount) + sum(contribution.penaltyPaid) + sum(loanRepayment.interestPortion)` (interest on actual repayments — not accrual). `totalRemaining` = `totalCollected − sum(loan.amountRemaining WHERE status IN ('active','defaulted'))` (paid_off excluded). No stored total column — always computed to avoid drift.
- Enum values were renamed in migrations (0004) — run `db:generate` carefully; it prompts on ambiguous rename/col decisions.
- tRPC infinite queries: pass `{ getNextPageParam }` (required); don't pass `initialPageParam`.
- `@legendapp/list` is imported from `@legendapp/list/react-native`, not the package root.

## 17. Recommended next-order (dependency-driven)
1. **Invites & join flow** (§6) — only way to get >1 real member.
2. **Kosh detail screen** (§3) — make cards tappable, landing point for stats/actions.
3. **Member tab UI** (§4) — then **treasurer invite UI** (§5) using real members.
4. **Contributions** (§7) → populates the derived totals.
5. **Loans + transaction/approval wrapper** (§8, §9).
6. **Notifications UI** (§10), chat (§11), payout (§12), reports (§14).