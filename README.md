# SpendShield — Subscription Analyzer

> Stop overpaying on subscriptions. SpendShield analyzes your bank statements, flags unused or overpriced subscriptions, and drafts ready-to-send cancellation and negotiation messages.

## What It Does

1. **Upload your bank statement** — paste text or upload a PDF
2. **AI scans for recurring charges** — Netflix, Spotify, gym, insurance, cloud storage, and more
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

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Express 5 (Node.js / TypeScript) |
| AI | Google Gemini API |
| Database | PostgreSQL + Drizzle ORM |
| File Parsing | pdf-parse + multer |
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
- Node.js 20+
- pnpm 9+
- PostgreSQL database

### Setup

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# Fill in DATABASE_URL and GEMINI_API_KEY

# Push database schema
pnpm --filter @workspace/db run push

# Run development servers
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/spend-shield run dev
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

## Environment Variables

```env
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your_gemini_api_key_here
SESSION_SECRET=a_random_secret_string
```

## Roadmap

- [x] Bank statement parsing (text + PDF)
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
- [ ] Family/shared plan matcher
- [ ] Email/screenshot auto-parsing for trial signups (no manual entry)
- [ ] v2: Local service price checker ("Is ₹800 fair for AC repair?")
- [ ] v2: Community price database
- [ ] v2: Email/WhatsApp message delivery
- [ ] v2: WhatsApp/SMS bot interface
- [ ] v2: Public negotiation-tactic leaderboard (anonymized)

## License

MIT
