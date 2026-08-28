# SheShield Architecture

## High-level Components

1. **Frontend (React/Vite)**
   - Handles user interface, routing, auth state, maps, SOS controls, and chat widgets.
   - Talks to backend over HTTP (`/api/*`) and Socket.IO (`/socket.io`).

2. **Primary Backend (Node/Express)**
   - Owns auth, SOS, guardians, incidents, community messages, settings, and AI chat endpoints.
   - Emits real-time events through Socket.IO.
   - Persists data in MongoDB.

3. **Alternative Backend (FastAPI)**
   - Mirrors the Node backend HTTP contract for portability.
   - Kept in parity via automated route contract checks.

4. **MongoDB**
   - Stores users, incidents, guardians, settings, posts, and SOS audit events.

5. **External Services**
   - Twilio: SOS SMS/calls and authority notifications.
   - OpenRouteService/Nominatim/Overpass: routing, geocoding, nearby safety amenities.
   - Gemini: in-app safety assistant responses.

## Data Flow (SOS)

1. User activates SOS in frontend.
2. Frontend sends `/api/sos/activate` with coordinates.
3. Backend validates request and resolves guardians.
4. Backend queues and dispatches Twilio notifications.
5. Backend returns activation status + delivery summary to UI.
6. Backend emits async delivery updates over Socket.IO.
7. Backend stores SOS audit trail in MongoDB.

## Data Flow (Safe Routes)

1. Frontend geocodes source/destination.
2. Frontend fetches recent incidents from backend.
3. Frontend requests external routing and amenities APIs.
4. Frontend computes safety score and renders map overlays.

## Operational Guardrails

- Strict env validation for critical backend secrets.
- API contract parity checks between Node and FastAPI.
- CI gates for lint/build/audit/parity.
- Rate limits on auth routes.
