# Threat Intelligence Dashboard

A full-stack TypeScript application that aggregates IP threat intelligence from **4 data sources** (AbuseIPDB, IPQualityScore, IPAPI, VirusTotal), presenting the data in a clean, user-friendly interface with persistent search history and side-by-side comparison.

---

## Tech Stack

**Frontend:**

- React 18 + TypeScript
- Vite 5 (build tool)
- TanStack Query (React Query) for server state
- React Hook Form + Zod for form validation
- Tailwind CSS for styling
- Vitest + React Testing Library for testing

**Backend:**

- Node.js 20+ + Express 4
- TypeScript (strict mode)
- Axios for external API calls
- Zod for runtime validation
- Vitest + Supertest for testing

**Architecture:**

- Monorepo with npm workspaces
- Shared TypeScript types and Zod schemas (ES modules)
- Frontend-only search history (localStorage)

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm 10+
- API keys from:
  - [AbuseIPDB](https://www.abuseipdb.com/account/api) (free tier: 1,000 requests/day) — **Required**
  - [IPQualityScore](https://www.ipqualityscore.com/create-account) (free tier: 5,000 requests/month) — **Required**
  - [VirusTotal](https://www.virustotal.com/gui/join-us) (free tier: 500 requests/day) — _Optional_
  - IPAPI uses free tier with no key required — _Optional_

### Quick Setup

```bash
# 1. Install dependencies and build shared package
npm run setup

# This runs: cp env.example .env && npm install && npm run build:shared
```

### Configure API Keys

Edit `.env` in the project root and add your real API keys:

```bash
# .env
NODE_ENV=development
PORT=3001

# Replace with your real keys
ABUSEIPDB_API_KEY=your_abuseipdb_key_here
IPQUALITYSCORE_API_KEY=your_ipqualityscore_key_here

FRONTEND_URL=http://localhost:5173
```

---

## Running the Application

### Start Both Services (Recommended)

```bash
npm run dev
```

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173

### Start Individually

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

---

## Running Tests

```bash
# All tests (backend + frontend)
npm test

# Backend integration tests only
npm run test:backend

# Frontend component tests only
npm run test:frontend
```

**Test Coverage:**

- **Backend**: Unit and integration tests covering routes, services, middleware, and utilities
- **Frontend**: Component tests, hook tests, and integration tests
- **Test Framework**: Vitest for both backend and frontend
- **Test Location**: Tests are co-located with source files in `__tests__` directories

---

## Key Features

### Core Functionality

- **IP Threat Lookup**: Query threat intelligence for any public IPv4 address
- **Multi-Source Aggregation**: Combines data from **4 providers** in parallel:
  - AbuseIPDB (abuse reports)
  - IPQualityScore (fraud/VPN detection)
  - **IPAPI** (geolocation/ISP metadata)
- **VirusTotal** (security vendor consensus)
- **Partial Data Resilience**: Returns available data if some providers fail (with clear indicator)
- **Risk Scoring**: Weighted algorithm balancing all 4 signals → LOW/MEDIUM/HIGH assessment
- **Private IP Protection**: Rejects private/reserved IP ranges (10.x, 192.168.x, 127.x, etc.)

### Search History & Compare

- **Persistent History**: Stores last 10 lookups in localStorage with full results
- **Google-Style Dropdown**: Shows filtered suggestions on input focus with keyboard navigation (↑/↓/Enter/Esc)
- **Side-by-Side Comparison**: Compare current lookup with any previous one
- **Auto-Submit**: Selecting from history automatically triggers lookup

### Accessibility

- ARIA labels and roles for screen readers
- Keyboard-navigable interface
- Visible focus indicators on all interactive elements
- Alert announcements for errors

---

## Architecture & Decisions

### API Design

- **`POST /api/intel`** with JSON body (more flexible than GET)
- Flat response structure maps directly to UI fields
- `sources` object indicates which providers succeeded (transparency)

### Data Aggregation

- Parallel API calls with `Promise.all` for performance
- Graceful degradation: ≥1 provider succeeds → partial data (200), all providers fail → 503
- **Metadata Priority**: IPAPI > AbuseIPDB > IPQualityScore (for hostname/ISP/country)
- **Optional Providers**: IPAPI and VirusTotal gracefully disable if API keys not configured

### Risk Scoring Algorithm

```typescript
baseScore = abuseScore * 0.5 + threatScore * 0.3 + vtScore * 0.2
finalScore = isVpnOrProxy ? baseScore + 15 : baseScore

// Buckets: 0-29 (low), 30-59 (medium), 60-100 (high)
```

- **Weights**: Abuse score 50% (direct evidence), threat score 30% (fraud), VirusTotal 20% (vendor consensus), VPN/proxy adds 15 points

### State Management

- **React Query** for server state (caching, loading, errors)
- **React Hook Form** for form state
- **localStorage** for search history
- **No Redux** - app is server-driven data, no complex client state

### Validation Strategy

- **Client-side**: React Hook Form + Zod (immediate UX feedback)
- **Server-side**: Same Zod schema (security + consistency)
- **Private IP detection**: Backend rejects before calling external APIs (saves quota)

### Monorepo Structure

- **Shared package**: TypeScript types and Zod schemas compiled as ES modules
- **Build order**: shared → backend/frontend (automated with root scripts)
- **Why ES modules**: Vite (frontend) requires them; configured with `"type": "module"` and modern `exports` field

---

## Error Handling & API Contract

### HTTP Status Codes

| Code    | Meaning             | When                                     | Response Includes                              |
| ------- | ------------------- | ---------------------------------------- | ---------------------------------------------- |
| **200** | Success             | Valid IP, ≥1 provider succeeded          | Full or partial threat data + `sources` object |
| **400** | Validation Error    | Invalid IP format or private/reserved IP | Error message + field details                  |
| **503** | Service Unavailable | **All** external providers failed        | Error message + `retryAfter: 60`               |
| **500** | Internal Error      | Unexpected server failure                | Generic error message                          |

**Note**: 429 (rate limiting) is not implemented. Would require application-level rate limiting layer.

### Private/Reserved IP Ranges (Rejected with 400)

- `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (private networks)
- `127.0.0.0/8` (loopback)
- `169.254.0.0/16` (link-local)
- `0.0.0.0/8` (special use)

### API Example

**Request:**

```bash
curl -X POST http://localhost:3001/api/intel \
  -H "Content-Type: application/json" \
  -d '{"ip":"8.8.8.8"}'
```

**Success Response:**

```json
{
  "ip": "8.8.8.8",
  "hostname": "dns.google",
  "isp": "Google LLC",
  "country": "United States",
  "abuseScore": 0,
  "recentReports": 0,
  "isVpnOrProxy": false,
  "threatScore": 0,
  "sources": {
    "abuseipdb": true,
    "ipqualityscore": true,
    "ipapi": true,
    "virustotal": true
  },
  "overallRisk": "low"
}
```

---

## Limitations & Trade-offs

### No Response Caching

- Each request hits external APIs (within their rate limits)
- **Why**: Keeping it simple for MVP; caching would add Redis or in-memory LRU complexity
- **Production**: Would cache recent lookups with TTL (e.g., 5 minutes)

### No Application-Level Rate Limiting

- Backend doesn't implement its own rate limiting (would return 429)
- **Why**: External APIs already have rate limits; adding our own would require middleware + storage
- **Production**: Would use `express-rate-limit` with Redis or in-memory store

### Private IP Detection

- Simple regex-based detection for common ranges
- **Why**: Covers 99% of cases; more robust solution would use proper IP libraries (e.g., `ipaddr.js`)
- **Trade-off**: Chose simplicity over edge-case completeness

### Single-Page App

- No routing, no persistent IP history across sessions (only localStorage)
- **Why**: Assignment scoped to single lookup flow
- **Extension**: Could add React Router for `/history`, `/ip/:address` routes

### Search History (localStorage)

- Limited to 10 entries, browser-specific, clearable by user
- **Why**: Frontend-only, no backend persistence needed for demo
- **Production**: Would likely store in database with user accounts

---

## Testing

### Test Structure

- **Backend**: Unit tests for services, middleware, and utilities; integration tests for routes
- **Frontend**: Component tests, hook tests, and integration tests
- **Test Location**: Tests are co-located with source files in `__tests__` directories
- **Test Framework**: Vitest for both backend and frontend
- **Mocking**: MSW (Mock Service Worker) for API mocking in frontend tests

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Watch mode (backend)
cd backend && npm run test:watch
```

## If I Had More Time...

### Additional Testing

- E2E tests with Cypress or Playwright
- Coverage reporting with thresholds (e.g., 80%+)
- More edge case coverage for API responses, timeouts, concurrent requests

### Features

- Batch IP checking (paste a list, check all)
- Export results as JSON/CSV
- IP geolocation map visualization
- Webhook alerts for high-risk detections
- Dark mode toggle

### Production Readiness

- Response caching (Redis with TTL)
- Retry logic with exponential backoff for API calls
- Circuit breaker pattern for failing APIs
- Structured logging (Pino or Winston)
- Error monitoring (Sentry)
- Health checks for external dependencies
- API versioning (`/api/v1/intel`)
- Docker containerization
- CI/CD pipeline (GitHub Actions)

### UX Polish

- Loading skeleton instead of spinner
- Toast notifications for success/error
- Tooltips explaining each metric
- Keyboard shortcuts (e.g., Cmd+K to focus input)
- Animations with Framer Motion
- Copy IP to clipboard button
- Detailed history view with timestamps and full data

---

## Project Structure

```
threat-intelligence-dashboard/
├── shared/                  # Shared types + Zod schemas
│   ├── src/
│   │   ├── types/          # TypeScript interfaces
│   │   └── schemas/        # Zod validation schemas
│   └── dist/               # Compiled ES modules
│
├── backend/                # Express API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic (aggregation, external APIs)
│   │   │   └── __tests__/  # Service unit tests
│   │   ├── middleware/     # Validation, CORS, error handling
│   │   │   └── __tests__/  # Middleware unit tests
│   │   ├── utils/          # Risk scoring, IP validation, logging
│   │   │   └── __tests__/  # Utility unit tests
│   │   ├── __tests__/      # Route integration tests
│   │   └── config/         # Environment configuration
│   └── dist/               # Compiled output
│
└── frontend/               # React SPA
    ├── src/
    │   ├── components/     # React components
    │   │   ├── pages/      # Page components
    │   │   ├── ui/         # Reusable UI components
    │   │   └── __tests__/  # Component tests
    │   ├── hooks/          # Custom React hooks
    │   │   └── __tests__/  # Hook tests
    │   ├── api/            # API client (fetch wrapper)
    │   │   └── __tests__/  # API client tests
    │   ├── utils/          # Utility functions
    │   │   └── __tests__/  # Utility tests
    │   ├── test/           # Test setup and mocks
    │   └── __tests__/      # Integration tests
    └── dist/               # Production build
```

---

## Useful Commands

```bash
# Setup from scratch
npm run setup

# Development
npm run dev              # Start both backend + frontend
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Building
npm run build            # Build all packages
npm run build:shared     # Build shared package only
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only

# Testing
npm test                 # Run all tests
npm run test:backend     # Backend tests only
npm run test:frontend    # Frontend tests only

# Code Quality
npm run lint             # Lint all packages
npm run format           # Format code with Prettier
```

---

## Troubleshooting

### Missing Environment Variables

Backend crashes on startup if required API keys are missing. Ensure `.env` exists in project root with valid keys (not placeholders).

### Shared Package Import Errors

Frontend/backend can't import from `@threat-intel/shared` if the package hasn't been built. Run `npm run build:shared` and verify `shared/dist/` exists.

### API Calls Failing

- Backend not running: `npm run dev:backend`
- Invalid API keys: Check `.env` values
- CORS: Backend configured for `http://localhost:5173`

---

## License

MIT
