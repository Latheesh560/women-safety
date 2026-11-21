# 🛡️ SheShield — Smart Women Safety & Emergency Telemetry Platform

**SheShield** is a full-stack web application designed to empower women with real-time safe route navigation, instant multi-channel emergency SOS alerts (SMS + automated voice calls), hands-free voice-activated SOS ("Safe Walk Mode"), crowdsourced incident mapping, a real-time community support chat, and an empathetic AI Safety Assistant.

---

## ✨ Key Features

- **🧭 Intelligence Safe Routing (`/safe-routes`)**
  - Uses **OpenStreetMap (Nominatim + Overpass API)** and **OpenRouteService** to compute walking routes that actively avoid crowdsourced high-risk incident zones (`avoid_polygons`).
  - Maps nearby **Police Stations**, **Hospitals/Medical Centers**, and **Avoided Danger Zones** in real time and calculates a dynamic corridor **Safety Index Score**.
- **🚨 One-Tap Emergency SOS & Deterrent Fake Call (`/sos-center`)**
  - Dispatches live GPS coordinates via **Twilio SMS** and places automated **Twilio Voice Calls** to all registered guardians.
  - Features an interactive smartphone **Fake Call Simulator** with synthesized ringtones and spoken voice dialogue to help exit uncomfortable or unsafe situations discreetly.
- **🎙️ Voice-Activated SOS Widget ("Safe Walk Mode")**
  - Floating hands-free speech recognition widget supporting English and Telugu wake words/phrases (e.g., *"Help me"*, *"Activate SOS"*, *"Kapadandi"*).
- **⚠️ Crowdsourced Incident Reporting (`/incident-report` & `/my-reports`)**
  - Report safety hazards with automatic GPS coordinate locking/geocoding and optional image/video media evidence (validated up to 10MB).
  - Broadcasts high/critical severity alerts in real time to connected users via **Socket.IO**.
- **💬 Real-Time Community Support (`/community`)**
  - Live WebSocket-powered peer support channel with swipe-to-reply and instant reply notifications.
- **🤖 AI Safety Assistant (`ChatbotWidget`)**
  - Powered by **Google Gemini (`gemini-2.5-flash`)** to provide safety preparedness guidance and immediate emotional support.

---

## 🏗️ Tech Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS, Framer Motion, React-Leaflet, Zustand, Socket.IO Client, Lucide Icons
- **Backend (Option A — Node.js):** Express, Mongoose (MongoDB), Socket.IO, JWT + Bcrypt, Multer, Twilio SDK, `@google/generative-ai`
- **Backend (Option B — Python):** FastAPI, Motor (Async MongoDB), `python-socketio`, PyJWT + Passlib, Twilio SDK, `google-generativeai`

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** 18+ (and/or **Python** 3.10+ if running the FastAPI backend)
- **MongoDB** (local instance or MongoDB Atlas URI)
- API Keys for **OpenRouteService**, **Twilio** (optional for SMS/Calls), and **Google Gemini** (optional for AI Chatbot)

### 2. Configure Environment Variables

Copy `.env.example` to `.env.development` in the root directory:
```env
VITE_API_URL=/api
VITE_OPENROUTESERVICE_KEY=your_openrouteservice_api_key_here
```

Copy `backend/.env.example` to `backend/.env` (or `python-backend/.env`):
```env
PORT=5005
HOST=127.0.0.1
MONGO_URI=mongodb://127.0.0.1:27017/women-safety
JWT_SECRET=your_random_32_byte_hex_secret
FRONTEND_URL=http://localhost:5173
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Install & Run

**Start the Backend (Node.js):**
```bash
cd backend
npm install
npm run dev
```
*(Or to run the Python FastAPI backend instead: `cd python-backend && pip install -r requirements.txt && python main.py`)*

**Start the Frontend:**
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔒 Security Highlights

- **JWT Authentication** with explicit `HS256` verification and rate-limited authentication endpoints.
- **Validated File Uploads** enforcing a 10MB ceiling, strict MIME/extension allow-lists, and randomized UUID filenames.
- **TwiML & Database Sanitization** preventing XML injection in automated voice calls and mass-assignment on settings/profile endpoints.
- **Security Headers** (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`) applied across responses.
