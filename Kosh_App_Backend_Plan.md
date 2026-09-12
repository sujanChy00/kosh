# Kosh App — Backend Plan

Covers database schema, real-time chat/notification architecture, biometric login flow, and push token handling. Pairs with the main app plan (roles, features, phases).

---

## 1. Database Schema (Postgres, via Drizzle)

Note: since auth uses **Better-Auth**, it manages its own core tables (`user`, `session`, `account`, `verification`) automatically via its schema generation — the `users` table below shows the fields relevant to your app; Better-Auth's migration will actually create/own most of this table, with your app-specific columns (biometric flag, etc.) added alongside it.

### users
*(Better-Auth managed, extended with app fields)*
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| name | text | |
| email | text, unique | |
| email_verified_at | timestamp, nullable | |
| password_hash | text | managed by Better-Auth |
| photo_url | text, nullable | |
| biometric_enabled | boolean, default false | UI/settings flag only — see §3 |
| selected_kosh_id | uuid, fk → kosh, nullable | the currently active kosh in the multi-kosh switcher; null when no kosh is selected. Scopes all transactions/chat data to one kosh at a time. `ON DELETE SET NULL` if the kosh is deleted |
| created_at | timestamp | |
| updated_at | timestamp | |

### push_tokens
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| user_id | uuid, fk → users | |
| expo_push_token | text, unique | |
| device_id | text, nullable | distinguishes multiple devices per user |
| platform | enum(ios, android) | |
| last_used_at | timestamp | updated on each successful send |
| created_at | timestamp | |

### kosh
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| code | text, unique | short human-readable code, e.g. `SAGA-7XPK`; auto-generated from the kosh name prefix at creation and stable for the kosh's lifetime. Reference code shown on transactions/reports and used for invites/sharing |
| name | text | |
| description | text, nullable | |
| icon_url | text, nullable | |
| monthly_amount | decimal | |
| due_day | int | day of month, editable |
| currency | text, default 'NPR' | **fixed to NPR (Nepali Rupees)** — not configurable at creation or later |
| member_interest_rate | decimal | |
| non_member_interest_rate | decimal | |
| loan_cap | decimal | same value applies to all members |
| late_penalty_amount | decimal, nullable | |
| start_date | date | **optional at creation, defaults to today if not set; future dates rejected** |
| duration_months | int | |
| end_date | date | computed from start_date + duration_months |
| max_members | int, nullable | |
| created_by | uuid, fk → users | |
| created_at | timestamp | |
| updated_at | timestamp | |

### kosh_memberships
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
| user_id | uuid, fk → users | |
| role | enum(adhyaksh, koshadhyaksh, sadasya) | Nepali role codes — Adhyaksh (Admin), Koshadhyaksh (Treasurer), Sadasya (Member) |
| status | enum(active, pending, left, removed) | pending = awaiting approval from open-link join |
| joined_at | timestamp, nullable | |
| left_at | timestamp, nullable | |
| unique | (kosh_id, user_id) | |

### kosh_role_requests
*(treasurer appointments — the only path to becoming a Koshadhyaksh; no min_treasurers field at kosh creation)*
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
| invited_by | uuid, fk → users | the Adhyaksh who sent the invitation |
| invitee_id | uuid, fk → users | the member who was invited |
| target_role | enum, default koshadhyaksh | role being offered |
| status | enum(pending, accepted, rejected) | |
| reason | text, nullable | **optional** rejection reason supplied by the member |
| decided_at | timestamp, nullable | when the invitee accepted/rejected |
| created_at | timestamp | |
| updated_at | timestamp | |
| index | (kosh_id), (invitee_id) | |

**Flow — invite → accept / reject:**
1. Adhyaksh calls `membership.inviteTreasurer` with an active member's user id → inserts a `pending` `kosh_role_request` and notifies the member (`type = treasurer_invite`, `requires_action = true`).
2. The member calls `membership.respondTreasurerInvite`:
   - **accept** → the member's `kosh_memberships.role` flips to `koshadhyaksh` in the same transaction, request becomes `accepted`.
   - **reject** → request becomes `rejected` with an **optional** `reason`; if the member leaves the reason blank, the admin just sees the rejection without one.
3. Either way the Adhyaksh is notified (`type = role_changed`): *"[Member] accepted/rejected your request to be a Koshadhyaksh (Treasurer)"*, appending the reason when provided.
4. The Adhyaksh can list all invitations for a kosh (`membership.treasurerRequests`) including status and any rejection reason.

### payment_methods
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| user_id | uuid, fk → users | |
| type | enum(bank, wallet, qr) | |
| label | text, nullable | e.g. "eSewa", "NIC Asia" |
| account_details | jsonb | flexible per type (account number/bank name/holder, wallet id, qr image url) |
| is_primary | boolean, default false | |
| created_at | timestamp | |

### invites
*(one invite type — plain code, link kosh-app://invite/TOKEN, and QR all resolve to the same underlying PREFIX-XXXX token)*
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
| token | text, unique | format: `PREFIX-XXXX` (e.g. `SAGA-7XPK`); prefix derives from the kosh's stable `code`, plus a unique per-invite suffix so each invite token is distinct from the kosh code and regenerable |
| created_by | uuid, fk → users | |
| max_uses | int, nullable | nullable = unlimited (default 50 or custom override) |
| use_count | int, default 0 | incremented on each redeem attempt |
| expires_at | timestamp, **not null**, default 7 days | **mandatory expiry** — an invite can never be created without one; code/link/QR all resolve to this same expiring token |
| status | enum(active, revoked, expired) | |
| created_at | timestamp | |


### join_requests
*(every join goes through this table now, regardless of invite channel)*
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| invite_id | uuid, fk → invites | |
| kosh_id | uuid, fk → kosh | |
| user_id | uuid, fk → users | |
| status | enum(pending, approved, rejected) | |
| requested_at | timestamp | |
| reviewed_by | uuid, fk → users, nullable | |
| reviewed_at | timestamp, nullable | |
| rejection_reason | text, nullable | |

### contributions
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
| member_id | uuid, fk → users | |
| period | date | represents the contribution month |
| expected_amount | decimal | |
| paid_amount | decimal, default 0 | |
| status | enum(pending, paid, partial, late) | |
| penalty_amount | decimal, default 0 | |
| date_paid | timestamp, nullable | |
| recorded_by | uuid, fk → users | |
| created_at | timestamp | |

### loan_requests
*(covers both origin paths — member-requested in-app, or Adhyaksh entering a loan requested outside the app; both converge on the same approval flow and broadcast notifications)*
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
| origin | enum(member_requested, admin_initiated) | which path created this |
| requested_by | uuid, fk → users | the borrower — themselves if member-requested, or selected by Adhyaksh if admin-initiated |
| created_by | uuid, fk → users | who actually submitted the record (equals `requested_by` for member_requested; the Adhyaksh for admin_initiated) |
| amount_requested | decimal | |
| note | text, nullable | |
| status | enum(pending_adhyaksh, pending_koshadhyaksh, approved, rejected) | `pending_adhyaksh` only applies to member_requested; admin_initiated skips straight to `pending_koshadhyaksh` since Adhyaksh creating it counts as their approval |
| rejection_reason | text, nullable | |
| resulting_loan_id | uuid, fk → loans, nullable | set once it clears Adhyaksh approval and becomes an actual loan pending disbursement |
| resulting_transaction_id | uuid, fk → transactions, nullable | the Koshadhyaksh-approval wrapper |
| adhyaksh_decided_by | uuid, fk → users, nullable | |
| adhyaksh_decided_at | timestamp, nullable | |
| created_at | timestamp | |

### loans
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
| loan_request_id | uuid, fk → loan_requests, nullable | null if Adhyaksh issued directly without a prior request |
| borrower_id | uuid, fk → users, nullable | null if non-member borrower |
| non_member_borrower_id | uuid, fk → non_member_borrowers, nullable | |
| principal | decimal | |
| interest_rate | decimal | |
| issue_date | date | |
| due_date | date, nullable | |
| status | enum(active, paid_off, defaulted) | |
| amount_remaining | decimal | |
| payout_method_id | uuid, fk → payment_methods, nullable | |
| created_at | timestamp | |

### non_member_borrowers
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
| name | text | |
| phone | text, nullable | |
| notes | text, nullable | |

### loan_repayments
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| loan_id | uuid, fk → loans | |
| amount | decimal | |
| date | timestamp | |
| remaining_balance_after | decimal | |
| recorded_by | uuid, fk → users | |

### transactions
*(the approval wrapper — anything needing Koshadhyaksh sign-off goes through this)*
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
| type | enum(contribution, loan_disbursement, loan_repayment, payout) | |
| reference_id | uuid | points to the related record (contribution/loan/repayment/payout) |
| amount | decimal | |
| initiated_by | uuid, fk → users | always an Adhyaksh |
| status | enum(pending_approval, approved, rejected, executed) | |
| created_at | timestamp | |
| executed_at | timestamp, nullable | |

### transaction_approvals
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| transaction_id | uuid, fk → transactions | |
| treasurer_id | uuid, fk → users | |
| decision | enum(approved, rejected) | |
| reason | text, nullable | required when decision = rejected |
| decided_at | timestamp | |

### kosh_end_payouts
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
| member_id | uuid, fk → users | |
| gross_share | decimal | |
| loan_deduction | decimal | |
| net_payout | decimal | |
| payout_method_id | uuid, fk → payment_methods, nullable | |
| status | enum(pending, approved, paid) | |
| created_at | timestamp | |

### kosh_subscriptions
*(DEFERRED — not built until Phase 9. Kept here so the schema is ready whenever subscriptions get prioritized; do not migrate this table in early phases.)*
*(ad-removal subscription — scoped per kosh, paid by the Adhyaksh)*
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
| subscribed_by | uuid, fk → users | the Adhyaksh who purchased it |
| provider | enum(ios, android) | which store's billing was used |
| revenuecat_customer_id | text | for reconciling with RevenueCat's records |
| status | enum(active, expired, cancelled, grace_period) | kept in sync via RevenueCat webhooks |
| current_period_end | timestamp | |
| created_at | timestamp | |
| updated_at | timestamp | |

### audit_logs
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh, nullable | |
| actor_id | uuid, fk → users | |
| action | text | e.g. "updated_interest_rate", "changed_role" |
| old_value | jsonb, nullable | |
| new_value | jsonb, nullable | |
| created_at | timestamp | |

### chat_threads
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
| type | enum(group, direct) | |
| created_at | timestamp | |

### chat_thread_participants
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| thread_id | uuid, fk → chat_threads | |
| user_id | uuid, fk → users | |
| joined_at | timestamp | |
| last_read_at | timestamp, nullable | for unread badges |

### chat_messages
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| thread_id | uuid, fk → chat_threads | |
| sender_id | uuid, fk → users | |
| reply_to_id | uuid, fk → chat_messages, nullable | self-reference for message replies |
| type | enum(text, image, file, system) | default 'text' |
| content | text, nullable | optional if message contains attachments only |
| attachments | jsonb, nullable | array of { url, name, size, mimeType } |
| created_at | timestamp | |
| edited_at | timestamp, nullable | |
| deleted_at | timestamp, nullable | |

### chat_message_reactions
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| message_id | uuid, fk → chat_messages | |
| user_id | uuid, fk → users | |
| emoji | text | UTF-8 emoji string |
| created_at | timestamp | |
| unique | (message_id, user_id, emoji) | prevents duplicate identical reactions per user |


### notifications
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| user_id | uuid, fk → users | |
| kosh_id | uuid, fk → kosh, nullable | null for account-scoped notifications (e.g. security alerts) |
| type | enum | see categories below |
| requires_action | boolean, default false | powers the "Needs Action" filter |
| title | text | |
| body | text | |
| data | jsonb | deep-link target, e.g. { koshId, screen } |
| read_at | timestamp, nullable | |
| created_at | timestamp | |

**Type categories:**
- Kosh-scoped: `join_request_submitted`, `join_request_approved`, `join_request_rejected`, `role_changed`, `treasurer_invite`, `contribution_due`, `contribution_late`, `loan_requested`, `loan_request_approved`, `loan_request_rejected`, `loan_repayment_due`, `loan_repayment_overdue`, `transaction_pending_approval`, `transaction_approved`, `transaction_rejected`, `chat_message`, `kosh_ending_soon`, `kosh_end_payout_processed`, `member_removed`
- Account-scoped (`kosh_id` null): `security_alert`

**Broadcast notifications:** `loan_requested`, `loan_request_approved`, and `loan_request_rejected` are sent to **every member of the kosh**, not just the requester or approvers — one `notifications` row gets inserted per recipient. Worth batching these inserts (all recipients in one query) rather than looping one-by-one, since kosh size could be dozens of members.

---

## 2. Real-Time Chat & Notifications

Two genuinely different problems here — worth not conflating them:

**In-app real-time (app open, foreground)** — for chat messages appearing live while someone's on the chat screen.
- **MVP recommendation: skip WebSockets initially.** Use simple **refetch-on-focus + short polling interval** (e.g. tRPC query with `refetchInterval` of 3–5s while the chat screen is active). Zero extra infra, works fine on Render's free tier, good enough for small kosh groups (tens of members, not thousands of messages/sec).
- **Upgrade path when it matters:** tRPC v11 supports **SSE-based subscriptions** (`httpSubscriptionLink`), which is simpler to run than raw WebSockets — no separate socket server, no sticky-session/load-balancer complications, works over standard HTTP. This is the natural next step for real "typing indicator, instant message" feel, without the operational overhead of a full WebSocket layer. Raw WebSockets (via `ws` alongside your Hono/Node server) remain an option if you outgrow SSE, but I'd only reach for that once you have real concurrent usage that justifies it.

**Background/app-closed alerts (contribution due, loan due, approval needed, new chat message while app isn't open)** — this is a fundamentally different problem, and **no in-app real-time protocol solves it** (WebSocket/SSE connections drop when the app is backgrounded or killed on mobile). This is what **Expo Push Notifications** are for:
- Backend sends to Expo's push API (`https://exp.host/--/api/v2/push/send`) using the stored `expo_push_token`
- Handle push receipts — if Expo reports `DeviceNotRegistered` for a token, mark that `push_tokens` row inactive/delete it
- Batch sends when notifying many members at once (e.g. "contribution due" reminders to a whole kosh)

**Bottom line:** you need push notifications regardless (for the background case, which is most of what you described — due-date reminders, approval requests). You don't need WebSockets for MVP — polling covers in-app chat well enough at this scale, and SSE is the natural upgrade later if it feels sluggish.

---

## 3. Biometric Login — How It Actually Works

Important distinction: **biometrics are a local, device-level gate — your backend never verifies a fingerprint or face directly.** The actual flow:

1. User logs in normally (email + password). Backend issues a session/refresh token as usual (handled by Better-Auth).
2. That token is stored in the device's **secure storage** (`expo-secure-store`, backed by iOS Keychain / Android Keystore).
3. If the user enables biometric login in Settings, the app just remembers "biometric unlock is on" (this is where `biometric_enabled` in the `users` table or local device storage comes in — mostly for UI state, not security enforcement).
4. On next app open: instead of showing the login form, the app calls `expo-local-authentication` to prompt Face ID/fingerprint.
5. If the OS confirms the biometric check passed, the app retrieves the **already-stored session token** from secure storage and uses it to authenticate to the backend — same as a normal session, just unlocked via biometric instead of re-typing a password.
6. If biometric fails or isn't available, fall back to the standard email/password login screen.

So there's no biometric data, hashes, or challenge sent to your server at all — the device's secure enclave handles the actual biometric matching, and it's purely gating access to a token that was already issued through normal login. This is the standard, correct pattern (same as how banking apps, WhatsApp, etc. do "biometric unlock").

*(A more advanced approach — WebAuthn-style public-key challenge/response bound to the device biometric — would let the server issue a fresh cryptographic proof per login rather than relying on a stored static token. This is more secure but meaningfully more complex to implement; worth considering post-MVP if it becomes a priority, not needed to ship the first version.)*

---

## 4. Push Token Registration Flow

1. On successful login (whether via password or biometric-unlocked token), the app calls `expo-notifications`' `getExpoPushTokenAsync()`.
2. App sends that token to the backend (e.g. a `registerPushToken` tRPC mutation) along with a device identifier and platform.
3. Backend **upserts** into `push_tokens` keyed on `(user_id, device_id)` — so re-logging in on the same device updates the existing row rather than creating duplicates, while a second device (e.g. a tablet) gets its own row.
4. On logout, the app can optionally call a `deactivatePushToken` mutation for that specific device — prevents notifications going to a device the user has since logged out of.
5. When sending, the backend queries all active `push_tokens` rows for a user (could be more than one device) and sends to all of them.

---

## 5. API Layer Notes (tRPC routers, high-level grouping)

- `auth` — handled mostly by Better-Auth directly, plus custom procedures for biometric-related settings
- `kosh` — create, update settings, list user's kosh, switch context
- `membership` — invite (targeted/open), join requests, role changes (**treasurer invite → member accept/reject with optional reason**), remove member
- `contribution` — generate monthly records, mark paid/partial, list per member
- `loan` — issue, repay, list per member, per kosh
- `transaction` — create (wraps contribution/loan/payout actions requiring approval), approve, reject, list pending
- `payout` — kosh-end payout calculation and execution
- `paymentMethod` — add/remove/set primary bank/wallet/QR
- `chat` — threads, messages, send, mark read
- `notification` — list, mark read, registerPushToken
- `audit` — list logs per kosh (Adhyaksh/Koshadhyaksh visibility)
