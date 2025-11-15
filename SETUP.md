# Setup Guide – Threat Intelligence Dashboard

Quick start guide for running the application locally.

---

## Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **API Keys**:
  - AbuseIPDB account ([sign up](https://www.abuseipdb.com/account/api))
  - IPQualityScore account ([sign up](https://www.ipqualityscore.com/create-account))

---

## Initial Setup

### 1. Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd threat-intelligence-dashboard

# Install all dependencies (root + all workspaces)
npm install
```

### 2. Create Environment File

```bash
# Copy the example environment file
cp env.example .env
```

### 3. Add Your API Keys

Edit `.env` and replace the placeholder values:

```bash
# .env
NODE_ENV=development
PORT=3001

# ⚠️ Replace these with your real API keys
ABUSEIPDB_API_KEY=your_real_abuseipdb_key_here
IPQUALITYSCORE_API_KEY=your_real_ipqualityscore_key_here

FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001
```

**Where to get keys:**

- **AbuseIPDB**: https://www.abuseipdb.com/account/api (free tier: 1,000 requests/day)
- **IPQualityScore**: https://www.ipqualityscore.com/create-account (free tier: 5,000 requests/month)

### 4. Build Shared Package

**Important:** The shared package must be built before starting frontend/backend.

```bash
npm run build:shared
```

This compiles the shared TypeScript types and Zod schemas that both frontend and backend depend on.

---

## Running the Application

### Option A: Start Both Services (Recommended)

```bash
npm run dev
```

This starts both backend and frontend concurrently:

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173

Open your browser to **http://localhost:5173** to use the application.

### Option B: Start Services Separately

**Terminal 1 – Backend:**

```bash
npm run dev:backend
```

**Terminal 2 – Frontend:**

```bash
npm run dev:frontend
```

---

## Verify Setup

**Backend health check**: http://localhost:3001/health should return `{"status": "ok", "timestamp": "..."}`

**Frontend**: http://localhost:5173 should display the threat intelligence dashboard with IP input field and lookup functionality.

**End-to-end test**: Enter a public IP (e.g., `8.8.8.8`) and verify results include risk badge, scores, ISP/country/hostname, VPN/proxy detection, and data sources indicator.

---

## Troubleshooting

### Missing Environment Variables

Backend crashes on startup if required API keys are missing. Ensure `.env` exists in project root with valid keys (not placeholders).

### Shared Package Import Errors

Frontend/backend can't import from `@threat-intel/shared` if the package hasn't been built. Run `npm run build:shared` and verify `shared/dist/` exists.

The shared package must be compiled because frontend and backend import TypeScript types from it. Compiled files live in `shared/dist/`.

### ES Module Configuration Issues

If you see "Cannot resolve module" or "ipInputSchema not found", verify:
- `shared/package.json` has `"type": "module"`
- `shared/tsconfig.json` has `"module": "ESNext"`
- Rebuild: `cd shared && rm -rf dist && npm run build`

### API Calls Failing

- Backend not running: `npm run dev:backend`
- Wrong API URL: Check `VITE_API_URL` in `.env`
- Invalid API keys: Verify keys in `.env` are valid
- CORS: Backend configured for `http://localhost:5173`

---

## Build Order (Important!)

In a monorepo, build order matters:

```
1. shared package (must be first)
   ↓
2. backend (depends on shared)
   ↓
3. frontend (depends on shared)
```

**One-line setup:**

```bash
npm run setup
```

This runs: `cp env.example .env && npm install && npm run build:shared`

---

## Testing

### Running Tests

**Run all tests (backend + frontend):**

```bash
npm test
```

**Run backend tests only:**

```bash
npm run test:backend
# or
cd backend && npm test
```

**Run frontend tests only:**

```bash
npm run test:frontend
# or
cd frontend && npm test
```

**Run tests in watch mode (during development):**

```bash
# Backend
cd backend && npm run test:watch

# Frontend
cd frontend && npm test
```

### Test Coverage

**Test Structure:**

- **Backend**: Unit tests for services, middleware, and utilities; integration tests for routes
  - Route integration tests in `backend/src/__tests__/`
  - Service unit tests in `backend/src/services/__tests__/`
  - Middleware tests in `backend/src/middleware/__tests__/`
  - Utility tests in `backend/src/utils/__tests__/`
- **Frontend**: Component tests, hook tests, and integration tests
  - Component tests co-located with components in `__tests__/` directories
  - Hook tests in `frontend/src/hooks/__tests__/`
  - Integration tests in `frontend/src/__tests__/`

**Test Infrastructure:**

- **Backend**: Vitest + Supertest (integration tests with mocked external APIs)
- **Frontend**: Vitest + React Testing Library + jsdom + MSW (Mock Service Worker)

---

## API Error Codes

The backend returns the following HTTP status codes:

| Code    | Meaning             | When                                      | Response Includes                              |
| ------- | ------------------- | ----------------------------------------- | ---------------------------------------------- |
| **200** | Success             | Valid IP, at least one provider succeeded | Full or partial threat data + `sources` object |
| **400** | Validation Error    | Invalid IP format, private/reserved IP    | Error message + field details                  |
| **503** | Service Unavailable | **All** external providers failed        | Error message + `retryAfter: 60`               |
| **500** | Internal Error      | Unexpected server failure                 | Generic error message                          |

**Note on 429 (Rate Limiting):**

- **Not currently implemented**
- If added, would return `{ error: "Rate Limit Exceeded", retryAfter: 60 }`

**Private/Reserved IP Ranges (rejected with 400):**

- `10.0.0.0/8` (10.x.x.x)
- `172.16.0.0/12` (172.16-31.x.x)
- `192.168.0.0/16` (192.168.x.x)
- `127.0.0.0/8` (loopback - 127.x.x.x)
- `169.254.0.0/16` (link-local - 169.254.x.x)
- `0.0.0.0/8` (special use)

---

## Useful Commands

```bash
# Setup from scratch
npm run setup

# Start both services
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Build shared package
npm run build:shared

# Build all packages
npm run build

# Run backend tests
npm run test

# Lint all code
npm run lint

# Format all code
npm run format
```

---

## Project Structure

```
threat-intelligence-dashboard/
├── .env                    # Environment variables (git-ignored, created from env.example)
├── env.example             # Template for .env
├── package.json            # Root package (npm workspaces)
│
├── shared/                 # Shared TypeScript types & Zod schemas
│   ├── src/
│   │   ├── types/         # TypeScript interfaces
│   │   └── schemas/       # Zod validation schemas
│   └── dist/              # Compiled output (generated)
│
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic (external API integration)
│   │   │   └── __tests__/ # Service unit tests
│   │   ├── middleware/    # Validation, CORS, error handling
│   │   │   └── __tests__/ # Middleware unit tests
│   │   ├── utils/         # Risk scoring, IP validation, logging
│   │   │   └── __tests__/ # Utility unit tests
│   │   ├── __tests__/     # Route integration tests
│   │   └── config/        # Environment config
│   └── dist/              # Compiled output (generated)
│
└── frontend/              # React + Vite SPA
    ├── src/
    │   ├── components/    # React components
    │   │   ├── pages/     # Page components
    │   │   ├── ui/        # Reusable UI components
    │   │   └── __tests__/ # Component tests
    │   ├── hooks/         # Custom React hooks
    │   │   └── __tests__/ # Hook tests
    │   ├── api/           # API client (fetch wrapper)
    │   │   └── __tests__/ # API client tests
    │   ├── utils/         # Utility functions
    │   │   └── __tests__/ # Utility tests
    │   ├── test/          # Test setup and mocks
    │   └── __tests__/     # Integration tests
    └── dist/              # Production build (generated)
```

---

## Verification

To verify the application is working correctly:

- Test valid IP lookup: `8.8.8.8`
- Test validation: Invalid IPs (e.g., `999.999.999.999`) should be rejected
- Test private IP rejection: `192.168.1.1` should return 400
- Test partial data handling: If one API fails, warning banner should appear
- Test responsive design: UI should adapt to different screen sizes

---

## Debugging

When running the application locally:

- **Backend logs**: Output in the terminal running `npm run dev:backend`
- **Frontend logs**: Browser DevTools → Console tab
- **Network requests**: Browser DevTools → Network tab
- **API health check**: http://localhost:3001/health

Common setup issues are documented in the Troubleshooting section above.
