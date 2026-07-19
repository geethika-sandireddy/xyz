# SpendShield — Subscription Analyzer

> Stop overpaying on subscriptions. SpendShield analyzes your bank statements, flags unused or overpriced subscriptions, and drafts ready-to-send cancellation and negotiation messages.

## What It Does

1. **Upload your bank statement** — paste text or upload a PDF
2. **AI scans for recurring charges** — Netflix, Spotify, gym, insurance, cloud storage, and more
3. **Flags wasteful subscriptions** — unused, duplicate, or overpriced ones get highlighted
4. **Drafts negotiation messages** — one click generates a polite but firm cancellation or discount request
5. **Tracks money saved** — log every win and watch your savings grow

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
- [ ] v2: Local service price checker ("Is ₹800 fair for AC repair?")
- [ ] v2: Community price database
- [ ] v2: Email/WhatsApp message delivery

## License

MIT
