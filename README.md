# NeedRelay 🌊🚨
### Autonomous Multi-Agent AI Disaster Relief & Humanitarian Coordination Platform

[![Next.js](https://img.shields.io/badge/Next.js-13.5.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Groq Cloud](https://img.shields.io/badge/LLM-Groq%20Llama%203.3%2070B-orange)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

NeedRelay is an intelligent, localized disaster response system built specifically for flood emergency relief operations across Pakistan. During natural disasters, traditional emergency hotlines fail under message volume and dialect barriers. NeedRelay ingests unstructured, chaotic distress messages (WhatsApp voice note transcripts, SMS, citizen reports in Roman-Urdu, Urdu, and English) and deploys a coordinated pipeline of autonomous AI agents to parse, deduplicate, route, and verify aid deliveries in seconds.

---

## 📌 Table of Contents
- [Executive Overview](#-executive-overview)
- [System Architecture](#-system-architecture)
- [The 4-Agent Pipeline](#-the-4-agent-pipeline)
- [Complete Technology Stack](#-complete-technology-stack)
- [Project Directory Layout](#-project-directory-layout)
- [State Management & Data Truthfulness](#-state-management--data-truthfulness)
- [Environment Configuration](#-environment-configuration)
- [Local Development & Setup](#-local-development--setup)
- [API Reference](#-api-reference)
- [Production Roadmap](#-production-roadmap)

---

## 🧭 Executive Overview

During monsoon floods, humanitarian responders face three primary bottlenecks:
1. **Language & Dialect Barriers:** Crucial distress reports arrive in colloquial Roman-Urdu (e.g., *"pani chhat tak a gaya hai, bache phanse hain"*), mixing phonetic spelling, local landmarks, and vague headcount estimates.
2. **Duplicate Saturation:** Multiple relatives or neighbors report the same emergency, resulting in duplicate dispatches while unconfirmed crises remain unattended.
3. **Logistics Latency:** Matching available volunteers, equipment (boats, de-watering pumps), and medical/food supplies across disparate NGOs is manual, slow, and error-prone.

NeedRelay resolves these bottlenecks by combining high-speed LLM inference (**Groq Cloud LPU**) with deterministic routing heuristics and an offline-resilient Roman-Urdu fallback engine.

---

## ⚙️ System Architecture

```
[ Incoming Distress Stream ]
(WhatsApp, Voice Notes, SMS, Hotline, Web App GPS Report)
              │
              ▼
┌────────────────────────────────────────────────────────┐
│             Agent 1: Ingestion & Translation           │
│  - Extracts Need (Food, Water, Medical, Rescue, etc.)  │
│  - Parses Pakistani District & Landmark centroid       │
│  - Translates Roman-Urdu / Urdu into English Summary   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│            Agent 2: Deduplication & Verification       │
│  - Semantic & Spatial cross-check with open incidents   │
│  - Merges duplicate reports & increments confirmations │
│  - Automatically escalates severity (Medium → Critical)│
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Agent 3: Logistics & Routing Engine        │
│  - Deterministic heuristic matcher (zero LLM latency)  │
│  - Finds nearest available volunteer with skills       │
│  - Checks NGO warehouse inventory & computes ETA       │
│  - Transitions volunteer status to 'Deployed'          │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│            Agent 4: Proof of Delivery (PoD) Auditor    │
│  - Audits field completion logs & delivery photos      │
│  - AI verification verdict: ACCEPTED vs REJECTED       │
│  - Closes incident ticket & releases volunteer         │
└────────────────────────────────────────────────────────┘
```

---

## 🤖 The 4-Agent Pipeline

### Agent 1: The Interpreter (Ingestion & Translation)
- **File:** `lib/agents/groq.ts` / `app/api/agent/extract/route.ts`
- **Model:** Meta Llama 3.3 70B via Groq
- **Function:** Ingests raw multi-lingual strings. Normalizes distress calls into structured JSON including need type (`Food`, `Water`, `Medical`, `Rescue`, `Shelter`), severity (`Critical`, `High`, `Medium`, `Low`), city/district, affected people count, and GPS coordinates.
- **Offline Fallback:** If Groq is unavailable, `lib/agents/fallback.ts` applies regex and lexical scoring against Roman-Urdu keywords (`khana`, `dawa`, `phansa`, `doob`, `tent`, etc.) and maps 24+ Pakistani cities (Dadu, Khairpur, Rajanpur, Swat, Jaffarabad, etc.) to district centroids.

### Agent 2: The Guard (Deduplication & Verification)
- **File:** `lib/agents/groq.ts` / `app/api/agent/dedup/route.ts`
- **Model:** Meta Llama 3.3 70B via Groq
- **Function:** Evaluates newly extracted tickets against all active rescues within the same district. If a report references the same vicinity and need, it merges the report into the master incident, increments the verification count, and elevates urgency.

### Agent 3: The Router (Logistics & Matching)
- **File:** `lib/agents/pipeline.ts` (`runAgent3`)
- **Engine:** Deterministic spatial heuristic solver
- **Function:** Runs instantaneously without LLM overhead. Scans the volunteer registry for available responders matching the skill requirements (e.g. water rescue, trauma medical), identifies nearest NGO supply depots, computes distance and ETA, and dispatches the task.

### Agent 4: The Auditor (Proof of Delivery Verification)
- **File:** `lib/agents/groq.ts` / `app/api/agent/pod/route.ts`
- **Model:** Meta Llama 3.3 70B via Groq
- **Function:** When a field volunteer submits a completion report (text note and photo), Agent 4 audits the resolution narrative against the original crisis parameters, issuing an `ACCEPTED` or `REJECTED` verdict to prevent false closures.

---

## 🛠️ Complete Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Framework & Core** | **Next.js 13.5.1** (App Router), **React 18.2.0**, **TypeScript 5.2.2**, **Node.js** |
| **AI & Inference** | **Groq Cloud LPU**, **LangChain** (`@langchain/groq`, `@langchain/core`), **Meta Llama 3.3 (70B Versatile)** |
| **Styling & System** | **Tailwind CSS 3.3.3**, `tailwindcss-animate`, Custom palette: Deep Teal (`#274245`) & Dusty Cream (`#DFD6AE`) |
| **Component Primitives** | **Radix UI** primitives (Accordion, Alert Dialog, Dialog, Dropdown, Tabs, Popover, Sheet, Slider, etc.), **shadcn/ui** |
| **Icons & UI Feedback** | **Lucide React 0.446**, **Sonner** (Toast notifications) |
| **Geospatial & Mapping** | **Leaflet 1.9.4**, **React-Leaflet 4.2**, **CartoDB Dark Matter** tiles, HTML5 Geolocation API |
| **Data Visualization** | **Recharts 2.12.7** |
| **State Management** | React `useSyncExternalStore` (Pub/Sub pattern) + browser `localStorage` caching |
| **Forms & Validation** | **React Hook Form 7.53**, **Zod 3.23** |
| **Deployment** | **Netlify** (`@netlify/plugin-nextjs`), Git |

---

## 📂 Project Directory Layout

```
NeedRelay/
├── app/
│   ├── api/agent/               # Secure server-side AI endpoints
│   │   ├── extract/route.ts     # Ingestion & translation endpoint
│   │   ├── dedup/route.ts       # Incident deduplication endpoint
│   │   └── pod/route.ts         # Proof of delivery audit endpoint
│   ├── ground/page.tsx          # Live tactical map & emergency reporting modal
│   ├── volunteers/page.tsx      # Field volunteer dispatch & NGO inventory portal
│   ├── settings/page.tsx        # System diagnostics, AI engine test, store reset
│   ├── layout.tsx               # Root application shell & metadata
│   ├── page.tsx                 # Command Center dashboard & real-time intake feed
│   └── globals.css              # Custom CSS variables, glow effects, theme tokens
├── components/
│   ├── app-shell.tsx            # Navigation header & live metric badges
│   ├── incident-card.tsx        # Structured emergency card with source audit trail
│   ├── incident-badges.tsx      # Need, severity, and status badges
│   ├── map-view.tsx             # SSR-resilient dynamic Leaflet map component
│   ├── pod-dialog.tsx           # Proof of Delivery audit dialog
│   ├── report-emergency-dialog.tsx # Citizen reporting dialog with GPS & photo upload
│   └── ui/                      # 40+ modular shadcn/ui and Radix components
├── lib/
│   ├── agents/
│   │   ├── groq.ts              # LangChain Groq prompt definitions & invocations
│   │   ├── fallback.ts          # Offline heuristic NLP & Roman-Urdu dictionary
│   │   └── pipeline.ts          # End-to-end agent workflow orchestrator
│   ├── mock-data.ts             # Realistic flood crisis seed data (Pakistan)
│   ├── store.ts                 # Reactive client store with localStorage persistence
│   ├── types.ts                 # Core TypeScript data contracts & models
│   └── utils.ts                 # Tailwind class merging utility (clsx + twMerge)
├── next.config.js               # Webpack shims for browser Leaflet & node built-ins
├── tailwind.config.ts           # Design tokens, color system, and animations
└── netlify.toml                 # Netlify automated build and plugin configuration
```

---

## 🔍 State Management & Data Truthfulness

To maintain 100% architectural transparency:
- **Client-Side Reactive Store:** All application data (Incidents, Messages, Volunteers, NGOs, Inventory, PoD Logs, and Agent Statuses) is managed via `lib/store.ts` using React's native `useSyncExternalStore`.
- **Persistence:** State persists across reloads via browser `localStorage` (`needrelay-store-v1`).
- **Seed Datasets:** The application initializes with verified realistic test data modeled after Pakistan flood disaster zones (Sindh, South Punjab, Balochistan, KPK).
- **Backend Role:** Next.js route handlers (`/api/agent/*`) act as secure proxies to Groq Cloud so that API secrets are never exposed to browser network clients.
- **Note on Supabase:** `@supabase/supabase-js` is included in `package.json` as a prepared dependency for remote cloud sync, but the active codebase currently executes via client-side storage and serverless route handlers.

---

## 🔐 Environment Configuration

Create a `.env` file in the root directory:

```bash
# Groq Cloud API Key — used on server-side only
GROQ_API_KEY=gsk_your_groq_api_key_here

# Groq Model Identifier
GROQ_MODEL=llama-3.3-70b-versatile
```

> **Note:** If `GROQ_API_KEY` is not provided or runs out of quota, NeedRelay automatically degrades gracefully to the offline heuristic engine with zero downtime or runtime crashes.

---

## 🚀 Local Development & Setup

### Prerequisites
- Node.js `18.x` or higher
- npm, yarn, or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/your-username/NeedRelay.git
cd NeedRelay
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env  # or create .env as shown above
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Code Quality & Type Check
```bash
# Validate TypeScript typings
npm run typecheck

# Run Next.js Linter
npm run lint
```

---

## 📡 API Reference

### 1. Extract Incident (`Agent 1`)
- **Endpoint:** `POST /api/agent/extract`
- **Body:**
  ```json
  {
    "text": "Dadu block 4 mein pani chhat tak pohnch gaya hai, 8 log phanse hain khana aur boat chahiye",
    "gps": { "lat": 26.7329, "lng": 67.7767 }
  }
  ```
- **Response:**
  ```json
  {
    "extraction": {
      "needType": "Rescue",
      "needDetail": "Water reached roof level, 8 people trapped, need food and boat",
      "city": "Dadu",
      "district": "Dadu",
      "sector": "Block 4",
      "landmark": "Block 4",
      "affectedPeople": 8,
      "urgency": "Critical",
      "translatedSummary": "Flood waters reached roof level trapping 8 individuals requiring rescue boat and rations.",
      "lat": 26.7329,
      "lng": 67.7767
    },
    "usedLLM": true
  }
  ```

### 2. Deduplicate Incident (`Agent 2`)
- **Endpoint:** `POST /api/agent/dedup`
- **Body:** `{ "extraction": { ... }, "existing": [ ... ] }`
- **Response:**
  ```json
  {
    "isDuplicate": true,
    "duplicateOf": "inc-m01",
    "reason": "Matching landmark Block 4 and overlapping Rescue request in Dadu.",
    "usedLLM": true
  }
  ```

### 3. Proof of Delivery Audit (`Agent 4`)
- **Endpoint:** `POST /api/agent/pod`
- **Body:**
  ```json
  {
    "podMessage": "Successfully dropped 8 ration cartons and evacuated family by boat.",
    "incidentSummary": "8 people trapped on roof in Dadu needing food and boat rescue."
  }
  ```
- **Response:**
  ```json
  {
    "verdict": "ACCEPTED: Volunteer confirms successful rescue and ration distribution.",
    "usedLLM": true
  }
  ```

---

## 🗺️ Production Roadmap
- [ ] **Multi-Tenant Database:** Integrate PostgreSQL / Supabase for synchronized multi-operator dispatch across command centers.
- [ ] **Twilio & WhatsApp Business API:** Directly ingest incoming citizen WhatsApp audio notes with automated Whisper transcription.
- [ ] **Offline PWA / Sync:** Service Worker support for field volunteers operating in zero-reception disaster pockets.
- [ ] **Satellite Flood Inundation Overlays:** Integrate Sentinel-1 synthetic aperture radar (SAR) flood masks into the Leaflet map layer.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
