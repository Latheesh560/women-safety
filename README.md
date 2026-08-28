# SheShield (Women Safety Application)

SheShield is a safety-first application focused on emergency SOS activation, safe routing, incident reporting, and community support.

## Features

- Secure auth (signup/login/session restore)
- Emergency SOS activation/deactivation
- Guardian contact management
- Incident reporting with optional media uploads
- Safe routes with map overlays
- Community support chat
- AI safety assistant chat

## Tech Stack

- Frontend: React + Vite
- Backend (primary): Node.js + Express + MongoDB + Socket.IO
- Alternative backend: Python FastAPI (kept for API parity)
- Third-party APIs: Twilio, OpenRouteService, Nominatim, Overpass, Gemini

## Repository Structure

- `/home/runner/work/women-safety/women-safety/src` — frontend app
- `/home/runner/work/women-safety/women-safety/backend` — Node/Express backend (recommended production backend)
- `/home/runner/work/women-safety/women-safety/python-backend` — FastAPI backend with matching route contract
- `/home/runner/work/women-safety/women-safety/docs/ARCHITECTURE.md` — architecture details

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- MongoDB
- (Optional) Python 3.11+ for FastAPI backend

### 1) Install frontend dependencies

```bash
cd /home/runner/work/women-safety/women-safety
npm ci
```

### 2) Configure and run Node backend

```bash
cd /home/runner/work/women-safety/women-safety/backend
npm ci
cp .env.example .env
npm run dev
```

### 3) Run frontend

```bash
cd /home/runner/work/women-safety/women-safety
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies API/socket traffic to backend (`http://127.0.0.1:5005`).

## Environment Variables (Node backend)

See `/home/runner/work/women-safety/women-safety/backend/.env.example` for the complete list.

Critical:
- `JWT_SECRET` (required, strong random value)
- `MONGO_URI` (database connection string)

Optional but recommended:
- `FRONTEND_URL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `AUTHORITY_PHONE_NUMBER`
- `GEMINI_API_KEY`

## Validation & CI

From repository root:

```bash
npm run lint
npm run build
npm run check:api-parity
```

- `lint` validates frontend and shared JS rules.
- `build` verifies production frontend bundling.
- `check:api-parity` ensures Node and FastAPI backends expose matching HTTP routes.

## Backend Strategy

Primary production backend is Node/Express under `/backend`.
FastAPI backend is maintained as an API-compatible alternative; parity is checked via `npm run check:api-parity`.

## Deployment Notes

### Frontend (Vercel)

- Keep repository connected in Vercel Project Settings.
- Auto-deploy triggers on pushes to the configured production branch.
- `vercel.json` includes SPA rewrite to `index.html`.

### Backend

- Deploy Node backend as a separate service/container.
- Ensure CORS `FRONTEND_URL` matches deployed frontend origin.
- Configure all required secrets in deployment environment.
