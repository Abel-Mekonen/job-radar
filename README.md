# JobFlow - Multi-Board Job Scraper & Pipeline Tracker

A modern, high-productivity job hunting application powered by **Playwright**, featuring robust **anti-detection & Cloudflare challenge mitigation**, real-time multi-board scraping (LinkedIn, Indeed, Wellfound, RemoteOK), and a clean **Google Workspace / Material theme** with high-density feed and pipeline management.

---

## Key Features

### 1. Modern Job Hunting UX (Google Workspace Theming)
- **Design System**: Signature Google Blue (`#1a73e8`), crisp surfaces (`#f8fafd`), subtle dividers (`#dadce0`), Google Sans / Roboto typography, and clean status chips.
- **Iconic `+ Scrape New Jobs` Action**: Styled after Google's iconic multi-colored creation button.
- **Two Core Workflow Views**:
  - **Job Feed View**: High-density, sorted stream of job listings with source badges, salary highlights, remote pills, recency tags, and inline pipeline progression.
  - **Pipeline / Kanban Board View**: Drag/advance positions across *Discovered* → *Saved* → *Applied* → *Interviewing* → *Offers*.
- **Job Detail Modal**: Clean popup with full role specifications, compensation chips, applicant notes editor, and direct external application link.

### 2. Multi-Board Scraper Support (Playwright Powered)
- **LinkedIn**: Public job search engine scraper with guest session preservation, keyword/location parameters, remote filters, and lazy-scroll pagination.
- **Indeed**: Card extraction with salary snippets, company reviews, and direct apply links.
- **Wellfound (formerly AngelList Talent)**: Startup board scraper with equity/compensation extraction and direct Next.js hydration data parsing.
- **RemoteOK**: Global tech board scraper with instant fallback parsing, salary tags, and verified remote listings.

### 3. Anti-Detection & Cloudflare Challenge Defense
- **Playwright-Extra Stealth Suite**: Nullifies `navigator.webdriver` leaks, spoofs `navigator.plugins`, `navigator.languages`, WebGL vendor/renderer, and mocks `window.chrome` runtime APIs.
- **Persistent Browser Profiles**: Caches cookies and session clearance (`cf_clearance`, `__cf_bm`) in `server/data/profiles/`, avoiding repeated challenges on subsequent visits.
- **Humanized Behavioral Simulation**: Natural mouse curves, randomized typing latency (40–120ms), and gradual wheel scrolling.
- **Turnstile / Checkbox Detection & Solver**: Automatically detects Cloudflare Turnstile iframes and supports a toggle for visible window (headful) mode if manual verification is desired.
- **Rotating Proxy Support**: Configurable HTTP/SOCKS5 proxy support with authentication.

### 4. Advanced Filtering & Pipeline Management
- Real-time search across titles, companies, and skills.
- Multi-board selection (LinkedIn, Indeed, Wellfound, RemoteOK).
- Remote-only, hybrid, and onsite workplace toggles.
- Salary disclosed filter.
- Company & staffing agency blacklist manager (automatically excludes firms like CyberCoders, Revature).
- Export to **CSV** and **JSON**.
- Real-time docked **Scraper Terminal Console**: Streaming WebSocket logs showing Playwright actions, Cloudflare detection status, and page extraction metrics.

---

## Quick Start

### 1. Install Dependencies
```bash
# In root
npm install

# In server
cd server && npm install

# In client
cd client && npm install
```

### 2. Run in Development Mode
```bash
# Starts both the backend server (port 3001) and Vite dev server (port 5173 with proxy)
npm run dev
```

### 3. Run in Production Mode
```bash
# Build both client and server
npm run build

# Start the unified server on http://localhost:3001
npm start
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser!

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/jobs` | Query jobs with filtering (`search`, `boards`, `status`, `isRemote`, `hasSalary`, `dateFrom`) |
| `GET` | `/api/jobs/:id` | Get single job details |
| `PATCH`| `/api/jobs/:id` | Update status (*discovered, saved, applied, interviewing, offer*) or notes |
| `DELETE`| `/api/jobs/:id` | Remove a job listing |
| `GET` | `/api/jobs/export/csv` | Download filtered jobs as CSV |
| `GET` | `/api/jobs/export/json` | Download filtered jobs as JSON |
| `POST`| `/api/scrape/start` | Launch a new scraping task (`keywords`, `location`, `boards`, `maxJobsPerBoard`, `headless`) |
| `POST`| `/api/scrape/stop` | Abort active scraping task |
| `GET` | `/api/scrape/status` | Current scraper running status and active task |
| `GET` | `/api/scrape/history` | Past scrape runs with logs and metrics |
| `GET` | `/api/scrape/settings` | Get stealth, proxy, and delay settings |
| `POST`| `/api/scrape/settings` | Save settings and company blacklists |
| `GET` | `/api/stats` | Pipeline metrics and counts per board/status |
| `WS` | `/ws` | Real-time WebSocket feed for live terminal logs and newly scraped jobs |
