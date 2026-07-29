# SpendShield — Personal Finance Copilot

> Most budgeting tools assume you already have a budget. SpendShield starts from zero — income, fixed costs, subscriptions, loans — and gives you one real number: what's actually left to spend. Subscription cancelling and negotiation drafting are part of that picture, not the whole product.

## What It Does

1. **Real accounts** — email/password signup, your data is tied to your account, not a random id in your browser
2. **Paste your bank statement text** — copy the relevant transactions in, no bank login required
3. **Pattern-matches recurring charges** — Netflix, Spotify, gym, insurance, cloud storage, and more, checked against known pricing ranges
4. **Add anything the detector missed** — the pattern matcher only knows a fixed list of services, so you can manually add whatever it didn't catch
5. **Flags wasteful subscriptions** — unused, duplicate, or overpriced ones get highlighted
6. **Drafts negotiation messages** — one click generates a cancellation, negotiation, downgrade, or refund request email
7. **Tracks what actually works** — after sending a message, report the outcome. Win rates per service show up on your dashboard, so the app gets more useful the more people use it, not just for you
8. **Tracks money saved** — log every win and watch your savings grow
9. **Renewal Watch** — track free trials and upcoming renewals so you're reminded *before* you get charged, not after. Cancelling in time auto-logs the saved amount to your Savings ledger, plus a `.ics` calendar download as backup
10. **Budget** — set your monthly income and savings target, log fixed expenses (rent, electricity, petrol, EMIs), add financial goals (e.g. a home down payment), and see your real remaining balance after subscriptions are factored in
11. **Refund Hunter** — draft a refund request when you got charged after forgetting to cancel in time
12. **Price-Hike Detector** — update a subscription's billed amount and it's automatically flagged if the price silently went up, with the old price shown struck through
13. **Bundle Optimizer** — flags when you have 2+ active subscriptions in the same category (e.g. multiple streaming services) that might be cheaper as a bundle
14. **Deal Watch** — a curated deals list (student/family plans, bundle offers, off-peak pricing) plus deal tips other users have posted for the same service
15. **Loans** — track EMIs and see an amortization-based payoff timeline (months remaining, interest left) for each loan
16. **Tax Estimator** — a rough India old-vs-new-regime tax comparison based on your income and 80C investments (estimate only, not tax advice)
17. **Regret Score** — if you dismiss a flag and keep a subscription active more than once, you'll see a gentle nudge asking if it's really worth it
18. **Share a Plan** — post that you're open to splitting a family/group plan, or search for someone else already looking
19. **Delete your account** any time, from the Account page — removes everything tied to it, immediately, no undo

No sample or demo data ships with this project — the database is empty until you sign up and start entering your own numbers. See [Privacy](artifacts/spend-shield/src/pages/privacy.tsx) for exactly what is and isn't stored.

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
# open that file and fill in your real DATABASE_URL and a random SESSION_SECRET

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
| `POST` | `/api/subscriptions` | Manually add a subscription the detector missed |
| `PATCH` | `/api/messages/:id/outcome` | Report if a sent message worked |
| `GET` | `/api/messages/stats` | Win rate per service, based on reported outcomes |
| `GET` | `/api/deals` | List community-submitted deal tips |
| `POST` | `/api/deals` | Post a deal tip |
| `POST` | `/api/deals/:id/upvote` | Upvote a deal tip |
| `POST` | `/api/auth/signup` | Create an account |
| `POST` | `/api/auth/login` | Log in |
| `POST` | `/api/auth/logout` | Log out |
| `GET` | `/api/auth/me` | Get the current logged-in user |
| `DELETE` | `/api/auth/me` | Permanently delete your account and all its data |

## Environment Variables

`artifacts/api-server/.env`:
```env
DATABASE_URL=postgresql://...
PORT=5000
SESSION_SECRET=some_long_random_string
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
- [x] Real accounts — email/password, password hashing, session cookies
- [x] Account deletion, with a page describing exactly what's stored
- [x] Manually add a subscription the detector missed
- [x] Community-submitted deal tips
- [x] Negotiation outcome tracking — report if a message worked, see win rate per service
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
