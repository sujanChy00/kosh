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
| name | text | |
| description | text, nullable | |
| icon_url | text, nullable | |
| monthly_amount | decimal | |
| due_day | int | day of month, editable |
| currency | text, default 'NPR' | |
| member_interest_rate | decimal | |
| non_member_interest_rate | decimal | |
| loan_cap | decimal | same value applies to all members |
| late_penalty_amount | decimal, nullable | |
| start_date | date | |
| duration_months | int | |
| end_date | date | computed from start_date + duration_months |
| min_treasurers | int, default 0 | |
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
| role | enum(adhyaksha, koshadhyaksha, sadasya) | |
| status | enum(active, pending, left, removed) | pending = awaiting approval from open-link join |
| joined_at | timestamp, nullable | |
| left_at | timestamp, nullable | |
| unique | (kosh_id, user_id) | |

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
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
| type | enum(targeted_email, open_link) | |
| token | text, unique | |
| invited_email | text, nullable | only for targeted invites |
| created_by | uuid, fk → users | |
| max_uses | int, nullable | open_link only |
| use_count | int, default 0 | |
| expires_at | timestamp | |
| status | enum(active, revoked, expired) | |
| created_at | timestamp | |

### join_requests
*(only used for open_link invites, since targeted email invites skip straight to membership)*
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

### loans
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
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
*(the approval wrapper — anything needing Koshadhyaksha sign-off goes through this)*
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| kosh_id | uuid, fk → kosh | |
| type | enum(contribution, loan_disbursement, loan_repayment, payout) | |
| reference_id | uuid | points to the related record (contribution/loan/repayment/payout) |
| amount | decimal | |
| initiated_by | uuid, fk → users | always an Adhyaksha |
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
| content | text | |
| created_at | timestamp | |
| edited_at | timestamp, nullable | |
| deleted_at | timestamp, nullable | |

### notifications
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| user_id | uuid, fk → users | |
| type | enum(invite, contribution_due, loan_due, approval_needed, transaction_approved, transaction_rejected, chat_message) | |
| title | text | |
| body | text | |
| data | jsonb | deep-link target, e.g. { koshId, screen } |
| read_at | timestamp, nullable | |
| created_at | timestamp | |

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
- `membership` — invite (targeted/open), join requests, role changes, remove member
- `contribution` — generate monthly records, mark paid/partial, list per member
- `loan` — issue, repay, list per member, per kosh
- `transaction` — create (wraps contribution/loan/payout actions requiring approval), approve, reject, list pending
- `payout` — kosh-end payout calculation and execution
- `paymentMethod` — add/remove/set primary bank/wallet/QR
- `chat` — threads, messages, send, mark read
- `notification` — list, mark read, registerPushToken
- `audit` — list logs per kosh (Adhyaksha/Koshadhyaksha visibility)
