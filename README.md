# SpendShield — Personal Finance Copilot

> Most budgeting tools assume you already have a budget. SpendShield starts from zero — income, fixed costs, subscriptions, loans — and gives you one real number: what's actually left to spend. Subscription cancelling and negotiation drafting are part of that picture, not the whole product.

## What It Does

1. **Paste your bank statement text** — copy the relevant transactions in, no account linking required
2. **Pattern-matches recurring charges** — Netflix, Spotify, gym, insurance, cloud storage, and more, checked against known pricing ranges
3. **Flags wasteful subscriptions** — unused, duplicate, or overpriced ones get highlighted
4. **Drafts negotiation messages** — one click generates a polite but firm cancellation or discount request
5. **Tracks money saved** — log every win and watch your savings grow
6. **Renewal Watch** — track free trials and upcoming renewals so you're reminded *before* you get charged, not after. Cancelling in time auto-logs the saved amount to your Savings ledger.
7. **Budget** — set your monthly income and savings target, log fixed expenses (rent, electricity, petrol, EMIs), add financial goals (e.g. a home down payment), and see your real remaining balance after subscriptions are factored in.
8. **Refund Hunter** — draft a refund request when you got charged after forgetting to cancel in time.
9. **Price-Hike Detector** — update a subscription's billed amount and it's automatically flagged if the price silently went up, with the old price shown struck through.
10. **Bundle Optimizer** — flags when you have 2+ active subscriptions in the same category (e.g. multiple streaming services) that might be cheaper as a bundle.
11. **Deal Watch** — cross-references your active subscriptions against a curated deals database (student/family plans, bundle offers, off-peak pricing) to surface savings you might not know about.
12. **Loans** — track EMIs and see an amortization-based payoff timeline (months remaining, interest left) for each loan.
13. **Tax Estimator** — a rough India old-vs-new-regime tax comparison based on your income and 80C investments (estimate only, not tax advice).
14. **Calendar export** — download a `.ics` file for any tracked renewal so you get a reminder even outside the app.
15. **Regret Score** — if you dismiss a flag and keep a subscription active more than once, you'll see a gentle nudge asking if it's really worth it.
16. **Share a Plan** — post that you're open to splitting a family/group plan, or search for someone else already looking.

No sample or demo data ships with this project — the database is empty until you paste in your own statement.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Express 5 (Node.js / TypeScript) |
| Subscription detection | Rule-based pattern matching against known service pricing |
| Database | PostgreSQL + Drizzle ORM |
| API contracts | OpenAPI spec → Orval-generated Zod validators + React Query hooks |
| Data Fetching | TanStack React Query |

## Project Structure

```
├── artifacts/
│   ├── spend-shield/       # React + Vite frontend
│   └── api-server/         # Express backend
├── lib/
│   ├── api-spec/           # OpenAPI spec (source of truth)
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod validation schemas
│   └── db/                 # Drizzle ORM schema + client
```

## Getting Started

### Prerequisites
- Node.js 22.9+ (needed for `--env-file` support)
- pnpm — install with `npm install -g pnpm` if you don't have it (this is a pnpm workspace monorepo; plain `npm install` will not work here)
- A PostgreSQL database (local install, or a free hosted one like Neon/Supabase)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Set up the API server's environment
cp artifacts/api-server/.env.example artifacts/api-server/.env
# open that file and fill in your real DATABASE_URL

# 3. Set up the frontend's environment (defaults are fine for local dev)
cp artifacts/spend-shield/.env.example artifacts/spend-shield/.env

# 4. Push the database schema (creates all tables — no data is inserted)
pnpm --filter @workspace/db run push

# 5. Run both dev servers, each in its own terminal
pnpm --filter @workspace/api-server run dev   # http://localhost:5000
pnpm --filter @workspace/spend-shield run dev # http://localhost:5173
```

The database starts completely empty — nothing seeds or demos itself. Paste in a real (or your own) bank statement on the Analyze page to get started.

### Verifying the build works

```bash
pnpm run typecheck   # typechecks every package
pnpm run build        # typecheck + production build of everything
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/bills/analyze` | Analyze bank statement text/PDF |
| `GET` | `/api/subscriptions` | List all detected subscriptions |
| `PATCH` | `/api/subscriptions/:id` | Update subscription status |
| `POST` | `/api/subscriptions/:id/message` | Generate negotiation/cancellation message |
| `GET` | `/api/subscriptions/:id/message` | Retrieve saved message |
| `POST` | `/api/savings` | Record money saved |
| `GET` | `/api/savings` | List all savings with totals |
| `GET` | `/api/renewals` | List all tracked trials/renewals |
| `POST` | `/api/renewals` | Start tracking a trial or upcoming renewal |
| `GET` | `/api/renewals/upcoming` | Alert feed — renewals due within N days |
| `PATCH` | `/api/renewals/:id` | Update status (cancelled/renewed/ignored) — cancelling logs a save |
| `DELETE` | `/api/renewals/:id` | Stop tracking a renewal |
| `POST` | `/api/renewals/:id/message` | Generate a cancel-before-renewal message |
| `GET` | `/api/subscriptions/bundle-suggestions` | Bundle Optimizer — category overlap suggestions |
| `GET` | `/api/budget/profile` | Get income + savings target |
| `PUT` | `/api/budget/profile` | Set income + savings target |
| `GET` | `/api/budget/expenses` | List fixed monthly expenses |
| `POST` | `/api/budget/expenses` | Add a fixed expense |
| `DELETE` | `/api/budget/expenses/:id` | Remove a fixed expense |
| `GET` | `/api/budget/goals` | List financial goals |
| `POST` | `/api/budget/goals` | Add a financial goal |
| `DELETE` | `/api/budget/goals/:id` | Remove a financial goal |
| `GET` | `/api/budget/summary` | Remaining-balance breakdown (income − expenses − subscriptions − savings) |
| `GET` | `/api/subscriptions/deal-watch` | Deal Watch — curated deals matching active subscriptions |
| `GET` | `/api/renewals/:id/calendar.ics` | Download a .ics calendar reminder for a renewal |
| `GET` | `/api/loans` | List all tracked loans |
| `POST` | `/api/loans` | Add a loan/EMI to track |
| `PATCH` | `/api/loans/:id` | Update outstanding balance/EMI/rate |
| `DELETE` | `/api/loans/:id` | Stop tracking a loan |
| `GET` | `/api/loans/:id/payoff` | Amortization-based payoff estimate |
| `POST` | `/api/tax/estimate` | Rough old-vs-new-regime tax estimate |
| `GET` | `/api/share-plans` | List your own requests, or search for others by service |
| `POST` | `/api/share-plans` | Post that you're open to splitting a plan |
| `DELETE` | `/api/share-plans/:id` | Withdraw a share request |

## Environment Variables

`artifacts/api-server/.env`:
```env
DATABASE_URL=postgresql://...
PORT=5000
```

`artifacts/spend-shield/.env`:
```env
PORT=5173
BASE_PATH=/
```

## Roadmap

- [x] Bank statement parsing (pasted text)
- [x] Subscription detection with flagging logic
- [x] Negotiation message drafting
- [x] Savings tracking dashboard
- [x] Renewal Watch — trial/renewal alerts before you're charged
- [x] Bundle optimizer — flag when switching to a bundle plan is cheaper
- [x] Refund hunter — draft a refund request when you got charged after forgetting to cancel
- [x] Price-hike detector — catch silent price increases on recurring bills
- [x] Budgeting module — income, fixed expenses, savings goals, remaining-balance estimator
- [x] Deal Watch — curated deals database matched against your active subscriptions
- [x] Calendar export — .ics download for renewal reminders
- [x] Loans & tax section (estimate only, not financial/tax advice)
- [x] "Regret score" — nudge for subscriptions repeatedly kept despite being flagged
- [x] Family/shared plan matcher
- [ ] PDF statement upload (currently paste-only)
- [ ] Email/screenshot auto-parsing for trial signups (no manual entry)
- [ ] v2: AI-assisted extraction for messier/non-standard statement formats
- [ ] v2: Local service price checker ("Is ₹800 fair for AC repair?")
- [ ] v2: Community price database
- [ ] v2: Email/WhatsApp message delivery
- [ ] v2: WhatsApp/SMS bot interface
- [ ] v2: Public negotiation-tactic leaderboard (anonymized)

## License

MIT
