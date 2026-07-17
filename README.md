# Subscription_Analyzer

What it does
Upload your bank statement → AI finds subscriptions you're overpaying for or forgot about → generates ready-to-send cancellation/negotiation messages → you track money saved.

The App: Pages & Features
Page	What's on it
/ Home	Hero section explaining the tool, "Analyze my bills" CTA, how it works (3 steps), sample results teaser
/analyze	Paste bank statement text OR upload PDF → click Analyze → see results
/subscriptions	List of all detected subscriptions, each with: name, amount, status (active / flagged / cancelled), "Generate Message" button
/savings	Dashboard — total money saved, list of wins ("Cancelled Hotstar — saved ₹299/month"), savings over time chart
Tech Stack
Layer	Tech
Frontend	React + Vite, TypeScript
UI	shadcn/ui components, Tailwind CSS
Backend	Express 5 (Node.js / TypeScript)
AI	Gemini (your API key)
Database	PostgreSQL + Drizzle ORM
PDF parsing	pdf-parse npm package
File upload	multer npm package
State/data fetching	TanStack React Query (auto-generated hooks)
Database Schema
subscriptions table

id, sessionId, name (e.g. Netflix), amount (₹), frequency (monthly/annual), category (streaming/fitness/etc), status (active/flagged/cancelled), flagReason, createdAt
savings table

id, subscriptionId, amountSaved, note, savedAt
negotiation_messages table

id, subscriptionId, messageType (cancel/negotiate), message, createdAt
API Endpoints
Method	Endpoint	What it does
POST	/api/bills/analyze	Send bank statement text → Gemini scans it → returns detected subscriptions
GET	/api/subscriptions	List all subscriptions for a session
PATCH	/api/subscriptions/:id	Update status (mark as cancelled, etc.)
POST	/api/subscriptions/:id/message	Gemini drafts a cancellation/negotiation message
GET	/api/subscriptions/:id/message	Get the saved message for a subscription
POST	/api/savings	Record money actually saved
GET	/api/savings	List all savings + total
What Gemini Does (the AI layer)
Analyze — reads raw bank statement text, identifies recurring charges, estimates if each is used/unused, flags high-risk ones
Message drafting — given subscription name + amount + context, writes a polite but firm cancellation or discount request message tailored to Indian service providers
Smart flagging — flags subscriptions that: appear duplicate, haven't been used in >3 months (inferred), or are priced above market rate for that service


Build Steps 
Step 1 — Gemini API key (need this from you, securely stored)
Step 2 — Create react-vite artifact (the frontend app)
Step 3 — Write the OpenAPI spec (lib/api-spec/openapi.yaml)
Step 4 — Run codegen → generates React Query hooks + Zod schemas
Step 5 — Launch design subagent (builds the entire UI in the background)
Step 6 — Simultaneously: build the backend routes + DB schema
Step 7 — Wait for design subagent to finish
Step 8 — Start both workflows (frontend + API server)
Step 9 — Fix any integration issues, test end-to-end
Step 10 — Present the finished app

Steps 5 and 6 run in parallel — the design subagent builds the frontend while I'm building the backend at the same time. That's how we get this done fast.
