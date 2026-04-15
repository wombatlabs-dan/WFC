# Product Requirements Document
## Work From Coffeehouse (WFC) — Personal Coffee Shop Operating System
### Version 1.0 — Personal MVP

*Prepared: April 14, 2026*
*Author: Dan Harrison*
*Status: Planning*

---

## 1. Problem Statement

Remote workers and freelancers with location flexibility spend $1,800–$3,000/year working from coffee shops — but manage their entire café practice with Google Maps and mental notes. Discovery tools (Yelp, Workfrom) tell you where to go but have no memory, no taste filtering, and no habit loop. Foursquare, the only app that gave people a personal relationship with their third places, shut down in December 2024.

The result: decision fatigue every morning ("where should I work today?"), repetition blindness (defaulting to the same 2–3 spots), no record of what you've tried, and no structured way to discover new places that match your taste.

**Work From Coffee** solves this for Dan Harrison first — a personal tool tuned to his specific taste (third wave, pour-over, no matcha-only shops, laptop-friendly) and anchored in San Francisco. If it works as a personal tool, it becomes a product.

---

## 2. Proposed Solution

A mobile-first web app (hosted on Cloudflare, built in Replit) that:

1. **Randomizes** a venue selection based on filters (neighborhood, coffee-only vs. coffee + food)
2. **Tracks** every visit with a counter and timestamped journal entry
3. **Discovers** new venues on a schedule and validates that existing ones are still open
4. **Surfaces** what's new — recently discovered spots with source links
5. **Displays** hours, Google Maps links, and work-friendliness notes for every venue

The app is seeded with 35 curated SF venues across five categories, pre-loaded with Dan's taste preferences. It starts as a single-user personal tool with no login complexity.

---

## 3. Target User (v1)

**Dan Harrison** — sole user of v1. Fractional design consultant, works from SF cafés regularly, has genuine schedule flexibility. Strong taste preferences: third wave coffee, pour-over or interesting rotating beans, laptop-friendly environment, comfortable with staying for lunch. Actively avoids: matcha-only spots, tourist traps, places without seating culture.

**Future user (v2+):** The Intentional Remote — 28–45, urban, remote worker or freelancer, specialty coffee enthusiast, already spending $150–250/month at cafés, wants structure and discovery without the friction of Yelp every morning.

---

## 4. Goals & Success Metrics

**Personal success (v1):**
- Dan uses the app to decide where to work at least 3x/week
- The journal is filled in after at least 50% of visits
- The app surfaces at least 2–3 new venues Dan didn't know about within the first month
- No visits to closed venues (validation is working)

**Product success (future):**
- 100 active users in one additional city within 6 months of public launch
- 30-day retention > 40%
- Average journal entries per user > 5 within first 30 days

---

## 5. Core Features (MVP)

### 5a. Venue Database
- 35 seed venues pre-loaded (from wfch-sf-list.md)
- Each venue record includes:
  - Name, neighborhood, address
  - Category: `coffee-only` | `coffee-food` | `coworking` | `sandwich-lunch`
  - Tags: `pour-over`, `interesting-beans`, `outlets`, `wifi`, `laptop-friendly`, `food`, `quiet`, `founder-crowd`
  - Work-friendliness rating (1–5, Dan-assigned)
  - Coffee quality rating (1–5, Dan-assigned)
  - Hours (stored as text, e.g. "Mon–Fri 7am–5pm")
  - Google Maps URL
  - Source article URL (if discovered via web search)
  - Date added to database
  - Status: `active` | `closed` | `temporarily-closed` | `unverified`
  - Visit count (auto-incremented)
  - Last visited date

### 5b. The Randomizer (Core Feature)
- **Neighborhood filter:** dropdown of SF neighborhoods + "Anywhere in SF" default
- **Mode selector:**
  - `Coffee Only` — selects from coffee-first venues matching taste profile
  - `Coffee + Food` — selects from hybrid café/all-day dining venues
  - `Lunch Spot` — selects from sandwich/lunch venues only
- Random selection button ("Take me somewhere") with animated result card
- Result card shows: name, neighborhood, category tags, hours, work-friendliness rating, coffee rating, Google Maps link, visit count
- Option to re-spin ("Somewhere else") or confirm ("I'm going here")

### 5c. Visit Logging
- Confirming a destination starts a pending visit
- "I'm here" button logs the visit with timestamp (separate from "I'm going" — Dan may look at multiple options before deciding)
- Visit counter increments on the venue record
- Visit history: chronological list of all past visits with date, venue, and journal preview

### 5d. Journal Entry (per visit)
Four prompted fields, all optional, all free text:
- **What I worked on** — what project/tasks did I tackle?
- **What I accomplished** — what got done?
- **Who I saw** — any notable people, conversations, serendipitous encounters?
- **How was the coffee?** — quality, what I ordered, any notes

Journal entries are attached to the visit record and viewable on the venue detail page and visit history.

### 5e. Discovery & Validation (Automated)
- **Scheduled Cloudflare Worker** runs weekly (Sunday nights)
- **Discovery job:** Web search for new SF specialty coffee / work-friendly café openings; surfaces candidates into a "New Finds" queue for Dan to review and approve before they're added to the active database
- **Validation job:** Checks existing venues against Google Places API to confirm still-open status; flags any that show as closed or have updated hours
- **Manual trigger:** "Run search now" button in the app for on-demand discovery

### 5f. What's New Section
- Dedicated tab/section showing venues added in the last 30 days
- Each new venue shows: name, neighborhood, date added, source article link (if available), status (pending review / active)
- Dan can approve or reject pending venues from this view

### 5g. Venue Detail Page
- Full venue record view
- All past visit journal entries for this venue
- Total visit count + last visited date
- Edit capability for hours, tags, ratings, status
- Google Maps embed or deep link

---

## 6. Out of Scope (v1)

- **User accounts / authentication** — single user, no login for v1. Add Cloudflare Access (Google login at infrastructure layer) before any public sharing.
- **Multi-city support** — SF only for v1
- **Social / sharing features** — no public profiles, no shared lists
- **Native iOS/Android app** — mobile-first PWA only; no App Store submission
- **Real-time hours from Google** — hours stored as static text, updated by validation worker
- **Geo-proximity / Combo Mode** — pairing a sandwich spot with a nearby coffee shop requires lat/long coordinates and Haversine distance logic; deferred to v2
- **Automated venue approval** — new venues surface as candidates; Dan approves manually
- **Payment / subscription** — free personal tool; monetization is a v2+ question

---

## 7. Technical Architecture

### Design Direction: Editorial Roaster

The app should feel like a specialty coffee magazine crossed with third-wave packaging design — warm, confident, typographic. It should not look like a default Tailwind app, a Material UI template, or anything that reads as "vibe-coded." Every screen should feel like someone with taste made it for themselves.

- **Aesthetic:** Warm editorial with specialty roaster confidence. Light base (warm linen, not white), dark type (espresso, not black), one bold terracotta accent.
- **Typography:** Fraunces (variable serif) for display/headings paired with Literata for body text. No system fonts, no Inter, no Roboto.
- **Palette:** Warm linen base (#F5F0E8), espresso ink (#2C1810), terracotta accent (#C4704B), muted sage for secondary states (#8B9D83). No pure white or pure black anywhere.
- **Key design moment:** The randomizer result card. This is the thing you see most. It should have presence — depth, texture, character. Not a flat card with rounded corners.
- **Overall feel:** Intentional, personal, slightly opinionated. Like opening a well-designed notebook, not a SaaS dashboard.

### Stack
- **Frontend:** React (Vite) — mobile-first, PWA-capable. Tailwind for utility styling + custom CSS for the design system. No component libraries (no Material UI, Chakra, Ant Design). Google Fonts: Fraunces + Literata.
- **Backend:** Cloudflare Workers (API layer)
- **Database:** Cloudflare D1 (SQLite-compatible SQL database, free tier)
- **Scheduled jobs:** Cloudflare Workers Cron Triggers (free tier: up to 5 cron jobs)
- **Build environment:** Replit
- **Deployment:** Wrangler CLI (Cloudflare's deployment tool, runs inside Replit)
- **Hosting:** Cloudflare Workers + Pages

### Key APIs
- **Google Places API** — venue validation (is it still open? current hours?) — pay-per-use, low volume = near-zero cost
- **Brave Search API** — new venue discovery (generous free tier, no credit card for low volume)
- **Google Maps** — deep links per venue (no API key needed for standard map links)

### Database Schema (simplified)

```sql
-- Venues
CREATE TABLE venues (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  neighborhood TEXT,
  address TEXT,
  category TEXT, -- coffee-only | coffee-food | coworking | sandwich-lunch
  tags TEXT, -- JSON array
  work_rating INTEGER, -- 1-5
  coffee_rating INTEGER, -- 1-5
  hours TEXT,
  maps_url TEXT,
  source_url TEXT,
  status TEXT DEFAULT 'active',
  date_added TEXT,
  visit_count INTEGER DEFAULT 0,
  last_visited TEXT
);

-- Visits
CREATE TABLE visits (
  id INTEGER PRIMARY KEY,
  venue_id INTEGER REFERENCES venues(id),
  visited_at TEXT,
  worked_on TEXT,
  accomplished TEXT,
  who_saw TEXT,
  coffee_notes TEXT
);

-- Discovery Queue
CREATE TABLE discovery_queue (
  id INTEGER PRIMARY KEY,
  name TEXT,
  address TEXT,
  source_url TEXT,
  discovered_at TEXT,
  status TEXT DEFAULT 'pending' -- pending | approved | rejected
);
```

### Cloudflare Architecture Notes
- The app is a standard Cloudflare Worker serving the React frontend as a static asset
- D1 database is bound to the Worker
- Cron triggers call internal Worker routes (`/api/cron/discover`, `/api/cron/validate`)
- All free tier — zero hosting cost for personal use
- **Auth note:** Before sharing with anyone, wrap with Cloudflare Access (zero-trust, Google login at the CDN layer, no app code changes needed)

---

## 8. Go-to-Market (if this becomes a product)

**Phase 1 — Personal dogfood (now):** Build v1 for Dan. Use it daily. Journal every visit. Let the data accumulate. Identify what's missing and what's surprisingly useful.

**Phase 2 — Soft launch (3–6 months):** Share with 5–10 people in Dan's network who work from cafés regularly. Gather feedback. No public launch yet.

**Phase 3 — City expansion:** Add one new city (NYC or LA — highest density of the target user). Write a Substack post about the app and the "third place practice" concept. Seed r/remotework, r/digitalnomad, r/Coffee.

**Phase 4 — Monetization decision:** At 500+ active users, decide between: (a) freemium consumer app at $3–5/month, or (b) B2B pivot — pitch to remote-first companies as a team perk.

**Distribution channels:**
- Substack / newsletter writers in the remote work + specialty coffee space
- Reddit communities: r/digitalnomad, r/remotework, r/Coffee, r/sanfrancisco
- Twitter/X: third wave coffee accounts, remote work influencers
- Product Hunt launch (when ready for broader audience)

---

## 9. Open Questions

1. **Name:** "Third Place" is conceptually strong but has prior use (Starbucks used it heavily). Check trademark/domain availability before committing. [addressed].
2. **Brave Search API quality:** How good is it at surfacing new SF café openings vs. generic results? Test before relying on it for discovery.
3. **Google Places API cost:** At weekly validation runs for 35 venues, cost should be negligible — but confirm pricing tier before launch.
4. **Journal friction:** Will Dan actually fill in 4 fields after every visit? Consider making 1 field (coffee notes) the only required one, with the rest optional and collapsible.
6. **PWA install prompt:** For the mobile experience to feel native, the app needs a proper PWA manifest and service worker so it installs to the home screen. Plan for this in the Replit build.

---

## 10. Appendix

- **Seed venue database:** `wfch-sf-list.md` (35 venues, 5 categories)
- **Product one-pager:** `wfch-app-one-pager.md`
- **Market research conducted:** April 14, 2026 (see conversation transcript)
- **Key competitive insight:** Foursquare City Guide shut down December 2024 — the personal venue relationship layer is gone from the market
- **Killer stat:** *"3 million Americans are running their work-from-café lives on a tool that no longer exists."*
