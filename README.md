# Kosh App

A multi-tenant mobile app that lets community savings groups ("kosh") in Nepal digitize their contribution register, manage loans, coordinate through built-in chat, and track finances — all with built-in approval workflows.

## What is a Kosh?

A **kosh** is a traditional Nepali community savings group where members contribute a fixed monthly amount, lending is managed internally, and funds are distributed equally at the end of the term. Kosh App brings this offline practice into a secure, transparent digital format.

## Key Features

- **Multi-Kosh Support** — Join and manage multiple kosh groups from a single account (Slack-style switcher)
- **Role-Based Access** — Adhyaksha (admin), Koshadhyaksha (treasurer), and Sadasya (member) with strict separation of duties
- **Contribution Tracking** — Auto-generated monthly pending records, partial/late payment handling, automatic penalties
- **Loan Management** — Member/non-member interest tiers, per-member loan cap, installment tracking, over/underpayment handling
- **Approval Workflow** — Every transaction requires Koshadhyaksha approval; rejections require a reason and trigger full re-approval on resubmission
- **Group Chat & DMs** — Persistent group chat per kosh, Slack-style DM threads scoped to each kosh
- **Kosh-End Payout** — Equal split among all participants with automatic loan deduction
- **Reports & Export** — PDF/CSV monthly/annual reports, individual member statements, audit logs
- **Biometric Login** — Face ID / fingerprint for quick access, with email+password fallback

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Expo + Uniwind (Tailwind for RN) |
| Backend | Hono on Node.js |
| Database | PostgreSQL via Drizzle ORM |
| API | tRPC (end-to-end type safety) |
| Auth | Better-Auth (email + password) |
| DevOps | Docker (local), Render (deploy), Turborepo |

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL)
- Expo CLI

### Setup

```bash
# Clone the repo
git clone https://github.com/your-org/kosh-app.git
cd kosh-app

# Install dependencies
npm install

# Start local PostgreSQL via Docker
docker compose up -d

# Run Drizzle migrations
npm run db:migrate

# Start the Expo app
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://user:password@localhost:5432/kosh
BETTER_AUTH_SECRET=your-secret-key
RESEND_API_KEY=your-resend-api-key
```

## Project Structure

```
kosh-app/
├── apps/
│   └── mobile/          # Expo app
├── packages/
│   ├── db/              # Drizzle schema & migrations
│   ├── api/             # tRPC routers
│   └── auth/            # Better-Auth config
├── docker-compose.yml
└── turbo.json
```

## Development Phases

1. **Phase 0** — Monorepo scaffold, local DB, auth setup, basic navigation
2. **Phase 1** — Auth screens, kosh creation, invites, member management
3. **Phase 2** — Contribution tracking, loan issuance & repayment
4. **Phase 3** — Approval workflow with Koshadhyaksha gates
5. **Phase 4** — Reports, chat, kosh-end payout logic
6. **Phase 5** — Pilot with a real kosh group
7. **Phase 6+** — SMS notifications, analytics, Nepali UI, payment integration

## License

Private — not for redistribution.
