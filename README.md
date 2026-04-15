# ☕ WFC — Work From Coffeehouse

> **A personal tool for people who work from cafés intentionally.** 

**Built by [Dan Harrison](https://github.com/wombatlabs-dan) · Wombat Labs · San Francisco, CA**

🌐 [Live App](https://third-place.pages.dev/) &nbsp;·&nbsp; 📄 [One-Pager](docs/wfc-one-pager.md) &nbsp;·&nbsp; 📋 [PRD](docs/wfc-prd.md)

---

<!-- SCREENSHOT: Replace the placeholder below with a screenshot of the app's home screen / randomizer result card on mobile -->
<!-- Suggested filename: docs/screenshot-randomizer.png -->
<!-- Example: ![WFC Randomizer](docs/screenshot-randomizer.png) -->

<img width="449" height="1006" alt="screenshot-randomizer" src="https://github.com/user-attachments/assets/f3899358-8d19-4de6-92d5-9c0e5984907f" />


---

## The Problem

*Where should I work from today?*

3 million Americans treat coffee shops as their office — spending $2,000+ a year doing it. But they manage their entire café practice with Google Maps and mental notes. There's no memory, no taste profile, no habit loop. Every morning is the same low-grade decision fatigue: the same two or three spots on rotation, or twenty minutes down a Yelp rabbit hole before giving up and going home.

Foursquare, the only app that ever gave people a personal relationship with their third places, **shut down in December 2024.** The gap it left hasn't been filled.

> *"3 million Americans are running their work-from-café lives on a tool that no longer exists."*

---

## What WFC Does

WFC is a mobile-first personal tool for people who work from cafés intentionally. It knows your taste, remembers everywhere you've been, spins the wheel when you can't decide, and keeps finding new spots that match your preferences.

🎲 **The Randomizer** — Filter by neighborhood and mode (Coffee Only / Coffee + Food / Lunch Spot), tap "Take me somewhere," and get a curated result in seconds. Re-spin as many times as you want. Confirm when you're ready to go.

📍 **Two-Step Visit Logging** — "I'm going" and "I'm here" are separate actions. You can browse options without polluting your visit history. Only confirmed arrivals count.

📓 **Per-Visit Journal** — Four lightweight prompts after every visit: what you worked on, what you accomplished, who you saw, how the coffee was. Optional but habit-forming.

📊 **Visit Tracking** — Every venue tracks how many times you've been, when you last visited, and your full journal history. The randomizer surfaces places you haven't been to in a while.

✨ **Weekly Discovery** — A scheduled background job searches for new SF specialty coffee openings and surfaces candidates for your review. You approve before anything enters your active list.

🔍 **Venue Validation** — The same weekly job checks your existing venues against Google Places to catch permanent closures before you show up to a locked door.

---

## The User

**v1 — personal tool.** Built for Dan Harrison: fractional design consultant, works from SF cafés 3–4 days/week, strong taste preferences (third wave, pour-over, no matcha-only spots, laptop-friendly), wants to build a genuine café practice rather than default to the same three places.

**v2+ — The Intentional Remote.** Age 28–45, urban, remote worker or freelancer, specialty coffee enthusiast. Already spending $150–250/month at cafés. Wants structure and discovery without Yelp friction every morning.

*Where they hang out:* r/digitalnomad, r/remotework, r/Coffee, Hacker News, productivity Substacks, third wave coffee Instagram.

---

## Why This Exists — Market Context

### The Behavior Is Real and Growing

- Google Trends: searches for "coffee shops to work from [city]" at all-time highs
- 75% of US employees did some form of remote work in 2025 — the café as office is structural, not a pandemic blip
- 44% of workers have "coffee badged" — physical café spaces are part of professional identity now
- Specialty coffee market growing at 10.6% CAGR, explicitly driven in part by remote work culture
- Remote workers who use cafés regularly spend **$150–250/month** — they're not price-sensitive, they're *option*-sensitive

### The Gap Nobody Fills

| Competitor | What they do | What's missing |
|---|---|---|
| Google Maps / Yelp | Discovery at scale | No work-friendliness signal, no personal memory, no taste filter |
| Workfrom.co | Work-focused venue directory | Sparse data outside major metros, no personal layer, feels abandoned |
| Foursquare / Swarm | Check-ins + personal history | City guide shut down December 2024; no taste curation |
| Nomad Work / Nomadable | Digital nomad venue finder | Built for city-hoppers, not locals building a practice |
| Notes apps / spreadsheets | Flexible personal tracking | No randomization, no discovery, no habit loop |

**The gap:** taste-aware personalization with memory. Every competitor treats all venues as equal. WFC knows *you* — your preferences, your history, and how long it's been since you tried somewhere new.

### The Market Opportunity

- ~3–4M US remote workers use cafés regularly as work venues
- Realistic addressable audience (urban, specialty coffee, intentional): 500K–1M
- Comparable lifestyle apps (Strava, Day One, Fantastical) price at $3–8/month or $25–50/year
- Lifestyle business at consumer tier: $180K–$300K ARR at 1% penetration
- B2B expansion path: "third place operating system" for remote-first teams — sold as a company perk

### The Big Bet

That intentional remote workers will pay for a tool that manages their café practice **the same way runners pay for Strava** — not because they couldn't track it themselves, but because the structure, memory, and discovery loop makes the habit more satisfying and sustainable.

---

## How It Works

```
Filter by neighborhood + mode
        ↓
"Take me somewhere" → randomizer picks from active venues
        ↓
Result card: venue name, ratings, hours, visit history, Maps link
        ↓
"I'm going here" → Heading Out screen with deep Maps link
        ↓
Arrive → "I'm here" → visit logged (counter + timestamp)
        ↓
Journal entry: 4 optional prompts, attached to the visit record
        ↓
(Weekly, background) Discovery + validation workers run
```

**Three randomizer modes:**
- `Coffee Only` — third wave coffee shops, pour-over focused, laptop-friendly
- `Coffee + Food` — hybrid all-day cafés where you can stay for lunch
- `Lunch Spot` — casual sandwich/deli spots comfortable with laptops

---

## Project Structure

```
WFC/
├── artifacts/
│   ├── api-server/          ← Express 5 backend, TypeScript
│   │   └── src/             ← Route handlers, middleware
│   ├── third-place/         ← React + Vite frontend (the app UI)
│   │   ├── src/
│   │   │   ├── components/  ← Randomizer, result cards, journal UI
│   │   │   └── pages/       ← Today, History, Places, New, Settings
│   │   └── public/          ← PWA manifest, icons, apple-touch-icon
│   └── mockup-sandbox/      ← Design prototyping (ignore for build)
├── lib/
│   ├── db/                  ← Drizzle ORM schema + migrations (PostgreSQL)
│   ├── api-spec/            ← OpenAPI specification
│   ├── api-zod/             ← Zod validation schemas (generated)
│   └── api-client-react/    ← React API hooks (generated via Orval)
├── scripts/                 ← Build + codegen utilities
├── pnpm-workspace.yaml      ← Monorepo workspace config
└── replit.md                ← Technical setup notes
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| UI | shadcn/ui components + Tailwind CSS |
| Backend | Express 5, Node.js 24 |
| Database | PostgreSQL (Replit) → Cloudflare D1 / Neon (migration in progress) |
| ORM | Drizzle ORM + drizzle-zod |
| Validation | Zod v4 |
| API codegen | Orval (generates hooks + schemas from OpenAPI spec) |
| Package manager | pnpm workspaces |
| Hosting | Cloudflare Workers + Pages (target) |
| Scheduled jobs | Cloudflare Workers Cron Triggers |
| Discovery API | Brave Search API |
| Validation API | Google Places API |
| Build | esbuild (CommonJS output) |

---

## Running Locally

### Prerequisites
- Node.js 24+
- pnpm 9+

### Setup

```bash
# Clone the repo
git clone https://github.com/wombatlabs-dan/WFC.git
cd WFC

# Install all workspace dependencies
pnpm install
```

### Environment Variables

```bash
# Create a .env file in artifacts/api-server/
DATABASE_URL=your_postgres_connection_string
GOOGLE_PLACES_API_KEY=your_key_here
BRAVE_SEARCH_API_KEY=your_key_here
```

### Database Setup

```bash
# Push schema to your database (development only)
pnpm --filter @workspace/db db:push
```

### Development

```bash
# Run the API server locally
pnpm --filter @workspace/api-server dev

# In a second terminal, run the frontend
pnpm --filter @workspace/third-place dev
```

### Other Commands

```bash
# Type-check all packages
pnpm typecheck

# Build all packages
pnpm build

# Regenerate API client from OpenAPI spec
pnpm codegen
```

---

## Design Direction

WFC should feel like a specialty coffee magazine crossed with third-wave roaster packaging — not a default Tailwind app.

- **Palette:** Warm linen base (`#F5F0E8`), espresso ink (`#2C1810`), terracotta accent (`#C4704B`)
- **Typography:** Fraunces (variable serif) for display, Literata for body — no system fonts
- **Key moment:** The randomizer result card. It needs presence, texture, and character. Not a flat card with rounded corners.
- **Feel:** Intentional, personal, slightly opinionated. Like opening a well-designed notebook, not a SaaS dashboard.

---

## Deployment Status

| Component | Current | Target |
|---|---|---|
| Frontend | Replit (replit.app) | Cloudflare Pages |
| Backend | Replit (Express 5) | Cloudflare Workers (Hono) |
| Database | Replit PostgreSQL | Neon serverless Postgres or Cloudflare D1 |
| Scheduled jobs | Not yet deployed | Cloudflare Workers Cron |
| Auth | None (personal tool) | Cloudflare Access (before any public sharing) |

*Migration to Cloudflare is in progress. See [cloudflare-migration-context.md](docs/cloudflare-migration-context.md) for the full migration plan.*

---

## Go-to-Market Path (if this becomes a product)

**Phase 1 — Personal dogfood (now):** Use it daily in SF. Journal every visit. Let the data accumulate. Find what's missing.

**Phase 2 — Soft launch (3–6 months):** Share with 5–10 people who work from cafés regularly. No public launch yet.

**Phase 3 — City expansion:** Add NYC or LA. Write a Substack post about the "third place practice" concept. Seed r/remotework, r/digitalnomad, r/Coffee.

**Phase 4 — Monetization decision:** At 500+ active users, choose between (a) freemium consumer app at $3–5/month or (b) B2B pivot — sold to remote-first companies as a team perk.

---

## Documentation

- 📄 [Product One-Pager](docs/wfc-one-pager.md) — problem, solution, market opportunity, killer stat
- 📋 [Product Requirements Document](docs/wfc-prd.md) — full feature spec, technical architecture, out-of-scope decisions
- 🗺️ [Venue List](docs/wfc-sf-venues.md) — the curated SF venue database (35 seed venues, 5 categories)
- 🚀 [Cloudflare Migration Plan](docs/cloudflare-migration-context.md) — architecture decisions for the Cloudflare deployment

---

## About

Built by **Dan Harrison** — Founding Director at [WombatLabs](https://wombatlabs.ai), fractional design and research partner for AI startups in San Francisco. This project started as a personal tool and is being developed openly as an exploration of whether personal utility tools can become lifestyle products.

Part of a broader portfolio of exploratory projects: [Bill-ingual](https://github.com/wombatlabs-dan/bill-ingual) · [Culture Compass](https://github.com/wombatlabs-dan/culture-compass) · [Pathfinder AI](https://github.com/wombatlabs-dan/pathfinder-ai)
