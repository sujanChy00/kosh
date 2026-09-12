# Kosh App — Full Plan (Updated)

A multi-tenant mobile app (Expo/Android-first) that lets any community savings group ("kosh") in Nepal digitize their contribution register, manage loans with member/non-member interest tiers, coordinate through built-in chat, and later move money directly through wallet/bank integration.

---

## 1. Roles & Permissions

Role names are Nepali — internally the app stores them as simple codes `adhyaksh` / `koshadhyaksh` / `sadasya`, displayed to users as **Adhyaksh** / **Koshadhyaksh** / **Sadasya**.

| Role (Nepali) | English equivalent | Manages Members | Initiates Transactions | Approves Transactions | Views Own Data |
|---|---|---|---|---|---|
| **Adhyaksh** | Admin | Yes | Yes | No | Yes |
| **Koshadhyaksh** | Treasurer | No | No | Yes | Yes |
| **Sadasya** | Member | No | No | No | Yes (view-only) |

Each user holds exactly **one role per kosh** — no combined roles. Adhyaksh proposes/initiates transactions, Koshadhyaksh approves them, Sadasya only views. This keeps the initiator and approver strictly separate, which is the entire point of the approval system.

**Important:** role governs *management/approval permissions only* — it has no bearing on participation. **All three roles contribute monthly, can take loans, and receive an equal kosh-end payout, including Adhyaksh and Koshadhyaksh themselves.** "Sadasya" is not a synonym for "the people who save money" — everyone in the kosh does that; Sadasya just means "no management or approval powers." Worth keeping this distinction explicit everywhere the plan says "member," since it's easy to accidentally read that word as "Sadasya-only."

- Default role on joining a kosh (via QR/link invite) is **Sadasya**. Adhyaksh can change roles afterward — **no approval required for role changes** (kept simple for now).
- **Approval rule:** every transaction (contribution confirmation, loan disbursement, kosh-end payout) requires approval. If a kosh has multiple Koshadhyaksh, **all** must approve.
- **Rejection flow:** rejecting Koshadhyaksh must give a reason. Adhyaksh can edit and resubmit. On resubmission, **all Koshadhyaksh must re-approve** (no carried-over approvals). Every rejection is logged (reason + timestamp) for audit/transparency.
- A user can be Adhyaksh and/or Sadasya of **multiple kosh** — Slack-style switcher between them, with all data (transactions, chat) scoped to whichever kosh is currently active.

---

## 2. Invites & Join Verification

One invite mechanism, shareable three ways — a plain **code**, a **link**, or a **QR code** (all three are just different presentations of the same underlying token). No email-targeted invites for now.

Distinct from the kosh's stable **kosh code** (e.g. `SAGA-7XPK`, shown on reports and never changes), each **invite token** is a regenerable `PREFIX-XXXX` value tied to a specific invite record — so a revoked or expired invite doesn't affect the kosh code at all.

**Flow:**
1. Adhyaksh generates an invite for the kosh.
2. An in-app **QR scanner** lets a user scan the code directly (`expo-camera`'s built-in barcode scanning); tapping a link works the same way via the `kosh-app://invite/{token}` deep link; a plain code can be typed in manually.
3. Scanning/tapping/entering opens a screen showing the **kosh's details** (name, description, icon) and a "Request to Join" action.
4. On submission, the user is placed in a **Pending** state (`kosh_memberships.status = pending`), and Adhyaksh receives a notification that a join request is waiting.
5. Adhyaksh reviews a **Join Requests** list (per kosh) and approves or rejects each one. Approval flips status to `active` with role `Sadasya`.

**Invite hygiene:** invites **always have an expiration date** (default **7 days**, mandatory — never an open-ended invite), a **usage cap** (default 50), and Adhyaksh can revoke/regenerate anytime. A code, link, or QR all resolve to the same expiring token, so there's no way to share an invite that never expires. Anyone who scans/taps an expired invite sees a clear "Invite expired" state rather than a generic error.

**Phone-based invites remain removed** — auth is email-only, and SMS costs money to send.

**Kosh history screen:** a user can view their full history of kosh involvement in one place — active memberships, pending join requests, rejected join requests, and kosh they've been removed from. Gives transparency into "what happened" rather than a request or removal silently disappearing.

---

## 3. Authentication

**Decision:** Email + password only, for now. No social login (Google/Apple), no phone/SMS OTP. Financial apps in Nepal (and banking apps generally) avoid social login, and phone-based OTP adds SMS-gateway cost/complexity that isn't needed at this stage.

### Screens
1. **Welcome/Splash** — "Register" and "Log In" options
2. **Register with Email** — name, email, password, confirm password
3. **Email Verification** — 6-digit code sent to confirm the email address
4. **Login** — email + password + "Forgot Password?" link
5. **Forgot Password** — enter email, sends a reset code
6. **Reset Password** — code + new password + confirm new password
7. **Biometric Prompt** — shown once after first successful login: "Enable Face ID/Fingerprint for faster login?"
8. **Home/Kosh Dashboard** — post-auth landing

### Returning-user flow
- Biometrics enabled → straight to Face ID/fingerprint on app open, falls back to email + password if it fails
- Biometrics not enabled → standard Login screen

### Settings — Security section
- Change Password
- Toggle biometric login
- Change email (requires re-verification)

### Notes
- Email verification and password-reset codes can be sent via a free-tier transactional email service (e.g. Resend, SendGrid) — no per-message cost at this stage.
- Revisit phone/SMS OTP later only if there's a clear need (e.g. SMS notifications for non-smartphone members is a separate, later concern from login).

---

## 4. Biometric Login

Biometrics are a **local, device-level gate** — the server never verifies a fingerprint or face directly. The actual security check happens on-device via the phone's secure enclave; the backend's role is limited to issuing and validating the same session token it always would.

**Why the existing stack already does most of the work:**
- `bearer()` — issues a session token used as `Authorization: Bearer <token>` instead of relying on cookies (which don't work well in React Native)
- `expoClient()` (client-side counterpart to the `expo()` server plugin) — automatically stores that bearer token in `expo-secure-store` (iOS Keychain / Android Keystore) after login, with no extra work required

**Flow:**
1. Normal login happens once (email + password, verified). The Expo client plugin silently stores the bearer token securely.
2. User enables "Biometric Login" in Settings — only shown/allowed if the device actually supports it (`LocalAuthentication.hasHardwareAsync()` + `isEnrolledAsync()`). Updates `biometricEnabled` on the user record (already in the schema).
3. On next app open/resume: if a stored session token exists and `biometricEnabled` is true, skip the login form and prompt `LocalAuthentication.authenticateAsync()`.
4. On success, the app just uses the already-stored bearer token — no new call to `/sign-in/email` happens; biometric success unlocks access to what's already there.
5. On failure/cancel, fall back to the standard email/password login screen.

**Edge case to handle:** sessions expire after 7 days (per current config). If someone hasn't opened the app in that long, biometric unlock can succeed locally while the stored token is already invalid server-side — the first authenticated request will 401, and the app needs to catch that and redirect to full login rather than getting stuck.

**Why `biometricEnabled` lives server-side too:** mainly to keep the setting in sync across a person's devices (e.g. a second phone knows whether to offer the toggle). Enforcement itself is always local.

---

## 5. Kosh Entity — Fields

**Basic Info**
- Name, description (optional), icon/photo (optional)
- **Kosh code** — short, unique, human-readable code (e.g. `SAGA-7XPK`, auto-generated from a name prefix at creation), stable for the kosh's lifetime. This is the reference code shown on transactions/reports and used for invites/sharing — it never changes even if the name does.

**Financial Settings**
- Monthly contribution amount
- Contribution due date (editable after creation)
- Currency: **NPR (Nepali Rupees) only** — not configurable at creation or later

**Loan Settings**
- Member interest rate (%)
- Non-member interest rate (%)
- Loan cap — single value, applies equally to all members, editable later as fund grows
- Late repayment penalty (optional)

**Duration**
- Start date (**optional** — if not set it defaults to today; future dates are blocked, the picker caps at "today"), duration (e.g. 3/5 years/custom) → auto-calculated end date

**Membership**
- Max members (optional)
- Treasurers (Koshadhyaksh) are **not set at creation** — the Adhyaksh invites members to become treasurers afterward via the request/accept flow below
- Kosh code (`SAGA-7XPK`-style) auto-generated at creation, stable for the kosh's lifetime

**Treasurer (Koshadhyaksh) invitation flow**
- The Adhyaksh picks a member from the kosh's member list and sends a **treasurer invitation** — a request, not an instant promotion.
- The member gets a notification with the invitation and can **accept** (immediately becomes a Koshadhyaksh) or **reject**.
- On reject, the member is asked for a **reason (optional)** — if given it's stored and shown to the Adhyaksh, who sees *"[Member] rejected your request to be a Koshadhyaksh (Treasurer)"* with the reason attached.
- On accept, the member's role flips to Koshadhyaksh and the Adhyaksh is notified of the acceptance.
- The Adhyaksh can see the status and any rejection reason of every past invitation for a kosh.

**Auto-created on kosh creation**
- Group chat for all members (persistent, tied to this kosh)
- Adhyaksh's own membership record

---

## 6. Member/User — Fields

**User Account (global, one-time)**
- Full name, email (verified), password (hashed), profile photo (optional)
- **Selected/active kosh** (`selected_kosh_id`) — the kosh the user is currently viewing in the multi-kosh switcher; all transactions, chat, and other data are scoped to it. Stored on the user record so it persists across devices.
- Biometric login enabled (yes/no)
- Payment details (optional, multiple allowed): bank account, wallet (eSewa/Khalti), QR code — one marked **primary**

**Kosh Membership (per kosh joined)**
- Role (Adhyaksh/Koshadhyaksh/Sadasya), join date, status (active/left/removed)
- Loan taken so far, contribution history — both derived from transaction records, not manually entered

---

## 7. Loan Management

**Applies to any participant regardless of role** — Adhyaksh and Koshadhyaksh can borrow too, at the same member interest rate as a Sadasya, since they're kosh participants like anyone else. (Worth deciding later whether a Koshadhyaksh approving their *own* loan request creates a conflict of interest — see Open Decisions.)

**Two ways a loan gets started, converging on the same approval steps:**

**A. Member-requested** — any participant submits a loan request (amount, optional note) directly in the app.
1. **Every kosh member gets a notification** naming who requested a loan and how much — informational, for group transparency.
2. The request appears in a **Loan Requests** section on the kosh's details screen — visible to everyone, but only Adhyaksh and Koshadhyaksh see approve/reject actions; a Sadasya can only view it and its status.
3. **Adhyaksh approves or rejects it.** Approving here is what moves it forward — it doesn't disburse yet, it converts the request into an actual loan pending sign-off.
4. **Koshadhyaksh approval is still required** before disbursement (all Koshadhyaksh, per the standard rule).

**B. Adhyaksh-initiated** — for a loan someone requested in person or over a messaging app, outside the kosh app entirely. Adhyaksh manually enters the borrower and amount.
1. This also **broadcasts a notification to every kosh member** — same transparency, even though the request itself didn't originate in-app.
2. **Koshadhyaksh approval is still required** before disbursement, same as path A.

**Either way:** only Adhyaksh and Koshadhyaksh can ever approve/reject a loan — a Sadasya (including the requester themselves) can only view status. Once resolved — disbursed or rejected — **every kosh member gets a notification of the outcome**, not just the borrower.

Beyond the request/approval flow:
- Interest rates and loan cap set per kosh (see §5)
- Loan cap is a **per-member cap**, same value for every participant
- Adhyaksh picks which of the borrower's payout methods to disburse to, if they have more than one on file
- Participants see "amount taken / amount remaining" against the kosh's loan cap at all times
- Repayments: Adhyaksh can **Mark as Paid (full installment)** or **Enter Amount** (partial/lump-sum)
  - Underpay → shortfall carries forward, interest continues accruing on outstanding principal
  - Overpay → extra reduces principal directly, lowering future interest
- Overdue installments trigger reminders

---

## 8. Contribution Tracking

**Applies to every participant regardless of role** — Adhyaksh and Koshadhyaksh contribute monthly the same as any Sadasya. The Adhyaksh still records/confirms payments for everyone (including their own), since that's a management action, not a participation restriction.

- On the due date, a **Pending** record auto-generates per active participant (all roles)
- Adhyaksh marks **Paid (full)** or **Enter Amount** (partial)
  - Full amount → **Paid**
  - Less than full → **Partial**, remainder carries into next due amount
  - Due date passes with balance outstanding → **Late**, automatic penalty applies to the outstanding portion only
- No backdating for now — payment date = date of entry (may revisit later if this causes inaccurate Late flags in practice)
- Participant list view in kosh details shows, per person (any role): contribution status + next due date, and loan status (amount remaining, next installment) side by side

---

## 9. Kosh-End Payout

- On kosh term completion, remaining fund is split **equally per participant — every kosh member regardless of role (Adhyaksh, Koshadhyaksh, and Sadasya all included)**
- Any participant with an **outstanding loan has it deducted from their payout first**
- Payout sent to their chosen payment method (bank/wallet/QR) if set, otherwise handled manually

---

## 10. Chat System

- **Group chat**: one per kosh, auto-created on kosh creation, permanent — a member of 3 kosh sees 3 persistent group chats regardless of which kosh is currently active
- **Direct messages**: scoped to the currently active kosh — two people who share multiple kosh get a **separate DM thread per kosh** (Slack-style), keeping kosh-specific discussions (e.g. loan disputes) tied to the right context

---

## 11. Notifications

**Kosh-scoped types** (filterable by kosh):
- Join request submitted (to Adhyaksh)
- Join request approved / rejected (to requester)
- Role changed (to affected person)
- Contribution due (reminder)
- Contribution late (penalty applied)
- **Loan requested (broadcast to all kosh members)**
- **Loan request approved & disbursed (broadcast to all kosh members)**
- **Loan request rejected (broadcast to all kosh members)**
- Loan repayment due / overdue (to borrower)
- Transaction pending approval (to Koshadhyaksh)
- Transaction approved / rejected (to initiating Adhyaksh)
- Chat message
- Kosh ending soon (term completion approaching)
- Kosh-end payout processed
- Member removed / left kosh

**Account-scoped types** (not tied to any kosh — shown under a "General" bucket separate from the per-kosh filter):
- Security alert (password changed, email changed, new device login)

**Filters (MVP):**
- By kosh (or "General" for account-scoped notifications)
- By invitation (join-request-related notifications specifically)
- Read / unread
- By date range

*(Broader category filtering and a "Needs Action" quick filter are worth adding later — see Phase 6 — but kept out of MVP scope for now.)*

**Push token registration:** happens as its own step, not bundled into the sign-in payload — since fetching an Expo push token requires a permissions prompt and a separate async call, and needs to happen on every app launch/foreground (not just at login) to stay current and to cover biometric-unlocked sessions that never call `/sign-in/email` at all. See the Backend Plan for the `push_tokens` table and registration flow.

---

## 12. Additional Features

- Export monthly/annual reports as PDF/CSV (totals, interest earned, defaulters list)
- Individual member statement (PDF) — useful if a member leaves early or disputes something
- Dashboard analytics — fund growth, contribution vs. loan ratio
- Meeting/AGM report generator — auto-summary for group finance reviews
- Audit log — tracks changes to interest rate, loan cap, contribution amount, and role changes
- Full data backup/export (CSV/PDF)
- Attendance tracker (nice-to-have, not essential)

---

## 13. Onboarding, Ads & Subscriptions

**Status: Ads ship in MVP; subscriptions are deferred.** Everyone sees ads for now — there's no ad-free tier yet. The subscription design below is kept documented for when it's actually built, not for near-term implementation. See § Development Phases for where this now sits.

**Onboarding:** shown on first app open, before authentication — a short intro to what the app does, then into the Welcome/Register screen.

**Ads (MVP):** shown to everyone by default, no exceptions yet. Implemented via AdMob (`react-native-google-mobile-ads`), which requires a **development build (EAS Build)**, not Expo Go, since it needs native modules.
- Recommend non-intrusive placement (e.g. banner ads on dashboard/list screens) and **no ads on transaction, approval, or payment-related screens** — mixing ads into money-movement flows undermines trust in a financial app.

**Subscription (ad removal) — deferred, design kept for later:** Adhyaksh would subscribe to a **monthly plan, per kosh**, to remove ads for that kosh. When active, **all members of that kosh** see no ads.
- **Assumption to confirm whenever this gets built:** ad-free status is scoped to that specific kosh's screens — a person in 2 kosh (one subscribed, one not) still sees ads while viewing the unsubscribed one. Flag if account-wide is actually preferred instead.
- **Known blockers to resolve before building this** (see Open Decisions):
  - Nepal isn't currently a supported country for Google Play merchant/payments profile registration — Play Billing can't be set up under a Nepal-registered account as-is.
  - Google's Payments Policy explicitly names "an ad-free version of an app" as a feature that must go through Play Billing if the app is distributed via Play Store — so a wallet-based (eSewa/Khalti) workaround isn't compliant once publicly listed there, though it's fine to use during a pre-Play-Store pilot phase.
  - Realistic paths once this is prioritized: register the merchant account under a supported-country entity (e.g. a US LLC) and use Play Billing properly (recommend **RevenueCat** at that point, since it wraps both Play/App Store billing, handles receipt validation, and can webhook subscription changes to the backend) — or keep using a non-Play-Store distribution channel for as long as that remains the case.

---

## 14. Data Model (draft)

- **Kosh**: id, code (e.g. `SAGA-7XPK`), name, description, icon, monthly_amount, due_date, currency (NPR only), member_interest_rate, non_member_interest_rate, loan_cap, late_penalty, start_date (optional — defaults to today), duration, end_date, max_members
- **User**: id, name, email, email_verified, password_hash, photo, biometric_enabled, selected_kosh_id
- **PaymentMethod**: id, user_id, type (bank/wallet/qr), details, is_primary
- **KoshMembership**: id, kosh_id, user_id, role, join_date, status
- **Contribution**: id, kosh_id, member_id, month, expected_amount, paid_amount, status (Pending/Paid/Partial/Late), penalty_applied, date_paid
- **Loan**: id, kosh_id, borrower_id, principal, interest_rate, issue_date, due_date, status, amount_remaining
- **Repayment**: id, loan_id, amount, date, remaining_balance
- **Transaction**: id, kosh_id, type (deposit/loan/payout), initiated_by, status (pending/approved/rejected), created_at
- **Approval**: id, transaction_id, treasurer_id, decision, reason, timestamp
- **KoshEndPayout**: id, kosh_id, member_id, gross_share, loan_deduction, net_payout, status
- **GroupChat** / **DirectMessageThread**: id, kosh_id, participants, messages

---

## 15. Tech Stack

- **Monorepo scaffold**: Better-T-Stack CLI
  ```
  npm create better-t-stack@latest kosh-app \
    --frontend native-uniwind \
    --backend hono \
    --runtime node \
    --database postgres \
    --orm drizzle \
    --api trpc \
    --auth better-auth \
    --db-setup docker \
    --addons turborepo,biome
  ```
- **Mobile**: Expo + Uniwind (Tailwind-style styling for React Native)
- **Backend**: Hono, Node runtime
- **Database**: Postgres, via Drizzle ORM
- **API layer**: tRPC (end-to-end type safety between Hono backend and Expo app)
- **Auth**: Better-Auth, configured for email + password + email verification codes (no social providers, no phone/SMS)
- **Local dev**: Docker for local Postgres only (`--db-setup docker`)
- **Deployment**: Render (free tier, no Docker needed for deploy — Render builds natively from Node source); managed Postgres via Render or Neon
- **Transactional email**: Resend or SendGrid free tier (verification codes, password reset)
- **Notifications**: Push notifications (Expo push) + SMS gateway fallback for non-smartphone members (Phase 2+, e.g. Sparrow SMS for Nepal)

---

## 16. Development Phases

### Phase 0 — Setup (Week 1)
- Scaffold monorepo with Better-T-Stack (flags above)
- Set up local Docker Postgres, verify Drizzle migrations run
- Set up Better-Auth for email + password + email verification codes
- Set up transactional email (Resend/SendGrid) for verification and password-reset
- Create Render project, connect repo, verify a basic deploy works end-to-end
- Set up basic navigation shell in Expo app (kosh switcher placeholder, tab structure)

### Phase 1 — Auth & Core Kosh/Membership (Weeks 2–4)
- Build all auth screens (§2): Register, Email Verification, Login, Forgot/Reset Password, Biometric Prompt
- Kosh creation flow with all fields from §5
- Invite flow: QR code, shareable link
- Member joins → defaults to Sadasya role
- Adhyaksh member-management screen: view members, change roles, remove members
- Kosh switcher UI (multi-kosh support)
- Auto-create group chat on kosh creation (basic text messages at this stage)

### Phase 2 — Contributions & Loans (Weeks 5–8)
- Contribution tracking: auto-generate monthly Pending records, Mark Paid / Enter Amount flows, Partial/Late status logic, automatic penalty on Late
- Loan issuance: per-member cap, member vs. non-member interest rate, Adhyaksh selects borrower + payout method (manual/cash for now, since payment integration is a later phase)
- Loan repayment: Mark Paid / Enter Amount, over/underpayment handling
- Combined member list view (contribution + loan status side by side)

### Phase 3 — Approval Workflow (Weeks 9–10)
- Koshadhyaksh role wired into transaction flow: every transaction requires all-Koshadhyaksh approval
- Rejection with reason, resubmission requiring full re-approval
- Approval/rejection history log, visible to Adhyaksh and Koshadhyaksh

### Phase 4 — Reports, Chat, Payout Logic (Weeks 11–13)
- PDF/CSV export: monthly/annual reports, individual member statements
- Audit log for settings/role changes
- DM chat, scoped per kosh (separate thread per kosh even for the same two people)
- Kosh-end payout logic: equal split, loan deduction, payout record generation

### Phase 5 — Ads Integration (Week 14)
- Set up AdMob (`react-native-google-mobile-ads`) and switch to an EAS development build (required for native ad modules — no longer usable in Expo Go from this point on)
- Non-intrusive banner placement on dashboard/list screens; no ads on transaction/approval/payment screens
- **No ad-free tier yet** — everyone sees ads; subscription work is deferred (Phase 9)

### Phase 6 — Pilot (Weeks 15–17)
- Deploy to Render, run with one real kosh group
- Collect feedback on real usage patterns (rounding habits, edge cases in late/partial payments, UI friction)
- Fix issues surfaced by real data before opening to other groups

### Phase 7 — Post-Pilot Enhancements (Ongoing)
- SMS notifications for members without smartphones (e.g. via Sparrow SMS)
- Dashboard analytics, meeting/AGM report generator
- Nepali + English UI
- Attendance tracker (if still wanted)
- Revisit backdating for contributions if late-entry issues appear in practice
- Revisit phone-based login/social login if a clear need emerges

### Phase 8 — Payment Integration (Later)
- Wallet integration (eSewa/Khalti) as the realistic middle step before direct bank integration
- Bank account linking per kosh
- Direct in-app transfers for deposits, loan disbursement, kosh-end payout
- Regulatory note: moving actual money will likely require a licensed payment partner (NRB governs payment service providers in Nepal) rather than building a payment rail from scratch

### Phase 9 — Subscription / Ad Removal (Deferred — not scheduled yet)
- Design already documented in §13; intentionally held until the blockers below are worth resolving
- Resolve merchant eligibility (register Play Console payments profile under a supported-country entity, e.g. a US LLC) or continue distributing outside the Play Store where the merchant/policy constraints don't apply
- Once resolved: integrate RevenueCat, build the per-kosh subscription flow, wire `kosh_subscriptions` status into ad-suppression logic

---

## 17. Open Decisions to Revisit

1. ~~Should a kosh be required to have at least 1 Koshadhyaksh, or can it run Adhyaksh-only?~~ **Resolved:** a kosh defaults to Adhyaksh-only; treasurers are added on demand via the invite/accept flow, so no minimum is enforced.
2. Loan cap: stay fully manual, or add a system-suggested safe cap based on kosh balance?
3. What happens if kosh-end payout is negative after loan deduction (member owes more than their share)?
4. Do non-member borrowers need any app account, or are they just tracked as a record by Adhyaksh?
5. Should backdating for contribution payments be added later if Late-flag inaccuracies become a real problem?
6. Should users be encouraged to add a backup verified contact method beyond email, for account recovery?
7. Conflict of interest: if a Koshadhyaksh requests a loan for themselves, should a *different* Koshadhyaksh be required to approve it (rather than potentially self-approving), or does the all-Koshadhyaksh-must-approve rule already cover this adequately once there's more than one Koshadhyaksh?
8. Ad-free scoping: does an Adhyaksh's subscription remove ads only within that specific kosh's screens, or account-wide for everyone in it across all their kosh? *(revisit when Phase 9 is actually scheduled)*
9. Should a rejected loan request show Adhyaksh's reason to the whole kosh (full transparency) or just to the requester (less exposure for the person who was declined)?
10. Subscription path: register a Play Console merchant account under a supported-country entity (e.g. a US LLC), or keep distributing outside the Play Store to sidestep both the Nepal merchant-eligibility gap and the Play Billing policy requirement for ad-free features? Needs deciding before Phase 9 starts, not before.
