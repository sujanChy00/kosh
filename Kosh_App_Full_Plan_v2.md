# Kosh App — Full Plan (Updated)

A multi-tenant mobile app (Expo/Android-first) that lets any community savings group ("kosh") in Nepal digitize their contribution register, manage loans with member/non-member interest tiers, coordinate through built-in chat, and later move money directly through wallet/bank integration.

---

## 1. Roles & Permissions

Role names are Nepali-facing in the UI; internally the app can still store them as simple codes (e.g. `admin` / `treasurer` / `member`) mapped to these display names.

| Role (Nepali) | English equivalent | Manages Members | Initiates Transactions | Approves Transactions | Views Own Data |
|---|---|---|---|---|---|
| **Adhyaksha** | Admin | Yes | Yes | No | Yes |
| **Koshadhyaksha** | Treasurer | No | No | Yes | Yes |
| **Sadasya** | Member | No | No | No | Yes (view-only) |

Each user holds exactly **one role per kosh** — no combined roles. Adhyaksha proposes/initiates transactions, Koshadhyaksha approves them, Sadasya only views. This keeps the initiator and approver strictly separate, which is the entire point of the approval system.

**Important:** role governs *management/approval permissions only* — it has no bearing on participation. **All three roles contribute monthly, can take loans, and receive an equal kosh-end payout, including Adhyaksha and Koshadhyaksha themselves.** "Sadasya" is not a synonym for "the people who save money" — everyone in the kosh does that; Sadasya just means "no management or approval powers." Worth keeping this distinction explicit everywhere the plan says "member," since it's easy to accidentally read that word as "Sadasya-only."

- Default role on joining a kosh (via QR/link invite) is **Sadasya**. Adhyaksha can change roles afterward — **no approval required for role changes** (kept simple for now).
- **Approval rule:** every transaction (contribution confirmation, loan disbursement, kosh-end payout) requires approval. If a kosh has multiple Koshadhyaksha, **all** must approve.
- **Rejection flow:** rejecting Koshadhyaksha must give a reason. Adhyaksha can edit and resubmit. On resubmission, **all Koshadhyaksha must re-approve** (no carried-over approvals). Every rejection is logged (reason + timestamp) for audit/transparency.
- A user can be Adhyaksha and/or Sadasya of **multiple kosh** — Slack-style switcher between them, with all data (transactions, chat) scoped to whichever kosh is currently active.

---

## 2. Invites & Join Verification

Two invite modes, since a plain shareable link/QR can't verify identity on its own:

**Targeted invite (by email)** — Adhyaksha enters a specific person's email. A unique token is generated and tied to that email.
- If the invited person already has the app installed and is logged in with that same email, tapping the link opens the app directly to a **bottom sheet** ("Join [Kosh Name]?") via a deep link: `kosh-app://invite/{token}`, which Expo Router resolves through `app/invite/[token].tsx`.
- If they don't have the app yet (or haven't registered with that email), the invite is simply stored server-side against their email. Once they install the app and log in/register with that same email, the pending invite automatically surfaces in their **Notifications/Invitations inbox** — no working deep link needed for this path.
- Joining this way grants **Sadasya** access immediately — no separate approval step, since the email match already verifies intent.

**Open invite (link/QR)** — a general join link/code, meant for handing out at an in-person meeting rather than targeting one person.
- Has an **expiration** (e.g. 7 days) and a **usage cap**; Adhyaksha can revoke/regenerate it anytime.
- Since it isn't tied to a specific identity, anyone who uses it lands in a **Pending Approval** state, not immediate Sadasya access.
- Adhyaksha reviews a list of join requests and approves/rejects each individually before the person becomes a real member — this is the actual gate, since the link itself can't be locked down from being shared further.

**Phone-based invites are removed** — with auth being email-only, there's no account to match a phone number against, and SMS costs money to send. Everything routes through email + the open-link/QR flow instead.

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

## 4. Kosh Entity — Fields

**Basic Info**
- Name, description (optional), icon/photo (optional)

**Financial Settings**
- Monthly contribution amount
- Contribution due date (editable after creation)
- Currency (NPR default)

**Loan Settings**
- Member interest rate (%)
- Non-member interest rate (%)
- Loan cap — single value, applies equally to all members, editable later as fund grows
- Late repayment penalty (optional)

**Duration**
- Start date, duration (e.g. 3/5 years/custom) → auto-calculated end date

**Membership**
- Minimum required Koshadhyaksha (0 or more)
- Max members (optional)

**Auto-created on kosh creation**
- Group chat for all members (persistent, tied to this kosh)
- Adhyaksha's own membership record

---

## 5. Member/User — Fields

**User Account (global, one-time)**
- Full name, email (verified), password (hashed), profile photo (optional)
- Biometric login enabled (yes/no)
- Payment details (optional, multiple allowed): bank account, wallet (eSewa/Khalti), QR code — one marked **primary**

**Kosh Membership (per kosh joined)**
- Role (Adhyaksha/Koshadhyaksha/Sadasya), join date, status (active/left/removed)
- Loan taken so far, contribution history — both derived from transaction records, not manually entered

---

## 6. Loan Management

**Applies to any participant regardless of role** — Adhyaksha and Koshadhyaksha can borrow too, at the same member interest rate as a Sadasya, since they're kosh participants like anyone else. (Worth deciding later whether a Koshadhyaksha approving their *own* loan request creates a conflict of interest — see Open Decisions.)

- Interest rates and loan cap set per kosh (see §4)
- Loan cap is a **per-member cap**, same value for every participant
- Adhyaksha selects the borrowing participant; if they have multiple payout methods on file, Adhyaksha picks which one to disburse to
- Participants see "amount taken / amount remaining" against the kosh's loan cap at all times
- Repayments: Adhyaksha can **Mark as Paid (full installment)** or **Enter Amount** (partial/lump-sum)
  - Underpay → shortfall carries forward, interest continues accruing on outstanding principal
  - Overpay → extra reduces principal directly, lowering future interest
- Overdue installments trigger reminders

---

## 7. Contribution Tracking

**Applies to every participant regardless of role** — Adhyaksha and Koshadhyaksha contribute monthly the same as any Sadasya. The Adhyaksha still records/confirms payments for everyone (including their own), since that's a management action, not a participation restriction.

- On the due date, a **Pending** record auto-generates per active participant (all roles)
- Adhyaksha marks **Paid (full)** or **Enter Amount** (partial)
  - Full amount → **Paid**
  - Less than full → **Partial**, remainder carries into next due amount
  - Due date passes with balance outstanding → **Late**, automatic penalty applies to the outstanding portion only
- No backdating for now — payment date = date of entry (may revisit later if this causes inaccurate Late flags in practice)
- Participant list view in kosh details shows, per person (any role): contribution status + next due date, and loan status (amount remaining, next installment) side by side

---

## 8. Kosh-End Payout

- On kosh term completion, remaining fund is split **equally per participant — every kosh member regardless of role (Adhyaksha, Koshadhyaksha, and Sadasya all included)**
- Any participant with an **outstanding loan has it deducted from their payout first**
- Payout sent to their chosen payment method (bank/wallet/QR) if set, otherwise handled manually

---

## 9. Chat System

- **Group chat**: one per kosh, auto-created on kosh creation, permanent — a member of 3 kosh sees 3 persistent group chats regardless of which kosh is currently active
- **Direct messages**: scoped to the currently active kosh — two people who share multiple kosh get a **separate DM thread per kosh** (Slack-style), keeping kosh-specific discussions (e.g. loan disputes) tied to the right context

---

## 10. Additional Features

- Export monthly/annual reports as PDF/CSV (totals, interest earned, defaulters list)
- Individual member statement (PDF) — useful if a member leaves early or disputes something
- Dashboard analytics — fund growth, contribution vs. loan ratio
- Meeting/AGM report generator — auto-summary for group finance reviews
- Audit log — tracks changes to interest rate, loan cap, contribution amount, and role changes
- Full data backup/export (CSV/PDF)
- Attendance tracker (nice-to-have, not essential)

---

## 11. Data Model (draft)

- **Kosh**: id, name, description, icon, monthly_amount, due_date, currency, member_interest_rate, non_member_interest_rate, loan_cap, late_penalty, start_date, duration, end_date, min_treasurers, max_members
- **User**: id, name, email, email_verified, password_hash, photo, biometric_enabled
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

## 12. Tech Stack

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

## 13. Development Phases

### Phase 0 — Setup (Week 1)
- Scaffold monorepo with Better-T-Stack (flags above)
- Set up local Docker Postgres, verify Drizzle migrations run
- Set up Better-Auth for email + password + email verification codes
- Set up transactional email (Resend/SendGrid) for verification and password-reset
- Create Render project, connect repo, verify a basic deploy works end-to-end
- Set up basic navigation shell in Expo app (kosh switcher placeholder, tab structure)

### Phase 1 — Auth & Core Kosh/Membership (Weeks 2–4)
- Build all auth screens (§2): Register, Email Verification, Login, Forgot/Reset Password, Biometric Prompt
- Kosh creation flow with all fields from §3
- Invite flow: QR code, shareable link
- Member joins → defaults to Sadasya role
- Adhyaksha member-management screen: view members, change roles, remove members
- Kosh switcher UI (multi-kosh support)
- Auto-create group chat on kosh creation (basic text messages at this stage)

### Phase 2 — Contributions & Loans (Weeks 5–8)
- Contribution tracking: auto-generate monthly Pending records, Mark Paid / Enter Amount flows, Partial/Late status logic, automatic penalty on Late
- Loan issuance: per-member cap, member vs. non-member interest rate, Adhyaksha selects borrower + payout method (manual/cash for now, since payment integration is a later phase)
- Loan repayment: Mark Paid / Enter Amount, over/underpayment handling
- Combined member list view (contribution + loan status side by side)

### Phase 3 — Approval Workflow (Weeks 9–10)
- Koshadhyaksha role wired into transaction flow: every transaction requires all-Koshadhyaksha approval
- Rejection with reason, resubmission requiring full re-approval
- Approval/rejection history log, visible to Adhyaksha and Koshadhyaksha

### Phase 4 — Reports, Chat, Payout Logic (Weeks 11–13)
- PDF/CSV export: monthly/annual reports, individual member statements
- Audit log for settings/role changes
- DM chat, scoped per kosh (separate thread per kosh even for the same two people)
- Kosh-end payout logic: equal split, loan deduction, payout record generation

### Phase 5 — Pilot (Weeks 14–16)
- Deploy to Render, run with one real kosh group
- Collect feedback on real usage patterns (rounding habits, edge cases in late/partial payments, UI friction)
- Fix issues surfaced by real data before opening to other groups

### Phase 6 — Post-Pilot Enhancements (Ongoing)
- SMS notifications for members without smartphones (e.g. via Sparrow SMS)
- Dashboard analytics, meeting/AGM report generator
- Nepali + English UI
- Attendance tracker (if still wanted)
- Revisit backdating for contributions if late-entry issues appear in practice
- Revisit phone-based login/social login if a clear need emerges

### Phase 7 — Payment Integration (Later)
- Wallet integration (eSewa/Khalti) as the realistic middle step before direct bank integration
- Bank account linking per kosh
- Direct in-app transfers for deposits, loan disbursement, kosh-end payout
- Regulatory note: moving actual money will likely require a licensed payment partner (NRB governs payment service providers in Nepal) rather than building a payment rail from scratch

---

## 14. Open Decisions to Revisit

1. Should a kosh be required to have at least 1 Koshadhyaksha, or can it run Adhyaksha-only?
2. Loan cap: stay fully manual, or add a system-suggested safe cap based on kosh balance?
3. What happens if kosh-end payout is negative after loan deduction (member owes more than their share)?
4. Do non-member borrowers need any app account, or are they just tracked as a record by Adhyaksha?
5. Should backdating for contribution payments be added later if Late-flag inaccuracies become a real problem?
6. Should users be encouraged to add a backup verified contact method beyond email, for account recovery?
7. Conflict of interest: if a Koshadhyaksha requests a loan for themselves, should a *different* Koshadhyaksha be required to approve it (rather than potentially self-approving), or does the all-Koshadhyaksha-must-approve rule already cover this adequately once there's more than one Koshadhyaksha?
