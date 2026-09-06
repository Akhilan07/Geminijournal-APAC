# Lumina — Personal Gemini Journal & Reflections

> **Google APAC Cloud Run Social Challenge Submission**  
> **Live Web App**: [https://geminijournalref1.ai.studio](https://geminijournalref1.ai.studio)  
> **Repository**: [https://github.com/Akhilan07/Geminijournal-APAC](https://github.com/Akhilan07/Geminijournal-APAC)

---

## Overview

**Lumina** is a modern, high-end personal reflection and journaling web application powered by **Gemini 3.6 Flash**, **Google Maps Platform**, and **Cloud Firestore**. Built with a luxury dark glassmorphic interface, Lumina provides users with a tranquil sanctuary to record thoughts, explore creative brainstorming angles, generate structured summaries, and capture spatial memory across time and location.

Every reflection and dialogue is protected by owner-isolated Cloud Firestore security rules, ensuring zero data leak between accounts.

---

## Architecture & Tech Stack

```mermaid
graph TD
    Client["React 19 Frontend (Glassmorphism UI)"] -->|Firebase Auth| Auth["Firebase Authentication (Google Identity)"]
    Client -->|Owner-bound Security Rules| Firestore[("Cloud Firestore (/users/{uid}/interactions)")]
    Client -->|Google Maps SDK| Maps["Google Maps JavaScript API"]
    Client -->|Proxy REST Requests| Express["Express.js Server (Cloud Run Port 3000)"]
    Express -->|@google/genai SDK| Gemini["Gemini API (gemini-2.5-flash / gemini-3.6-flash)"]
    Express -->|Fetch Credential| Secrets["Google Cloud Secret Manager (GEMINI_API_KEY)"]
```

| Layer | Component | Technology & Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 6 | Fast HMR, component isolation, modular rendering. |
| **Design & UI/UX** | Tailwind CSS v4 + Glassmorphism | Custom dark aesthetic with ambient backdrop mesh gradients, Outfit & Playfair Display typography. |
| **Spatial Memory** | Google Maps JS API | Interactive location picker, lat/lng pinning, address reverse-geocoding. |
| **Database** | Cloud Firestore | Isolated document storage strictly partitioned under `/users/{userId}/interactions/{interactionId}`. |
| **Authentication** | Firebase Auth | Federated Google Sign-In with popup flow; zero plaintext passwords handled or stored. |
| **Backend & Proxy** | Node.js + Express.js | Full-stack server proxy preventing client-side `GEMINI_API_KEY` leakage. |
| **AI SDK** | `@google/genai` (v2.4.0) | Official Google GenAI SDK with multi-turn chat support and automatic fallback ladder. |
| **Hosting & Infra** | Google Cloud Run | Serverless container deployment with auto-scaling and zero-downtime execution. |
| **Secret Management** | Google Cloud Secret Manager | Dynamic runtime credential binding for Cloud Run runtime service accounts. |

---

## Key Enhancements Beyond Starter Template

### 1. 📍 Location-Aware Spatial Memories
- **Interactive Google Maps Integration**: Users can pin exact geographical locations for every journal entry using Google Maps (`@googlemaps/js-api-loader`).
- **Rich Spatial Metadata**: Each entry persists location metadata including `{ latitude, longitude, address, placeName }`.
- **Location Preview Map**: Archive views render compact location badges and interactive Google Maps previews.

### 2. 🛡️ Resilient Model Fallback Ladder
- **100% Uptime Guarantee**: Server-side proxy implements an automated 5-tier fallback ladder across Gemini model endpoints:
  1. **Primary**: `gemini-2.5-flash`
  2. **High-Availability Fallback**: `gemini-2.5-flash-lite`
  3. **Next-Gen Primary**: `gemini-3.6-flash`
  4. **Next-Gen Fallback**: `gemini-3.1-flash-lite`
  5. **Dynamic Alias**: `gemini-flash-latest`
- **Graceful Degraded State**: If a quota limit or transient outage occurs on the primary model, the server seamlessly retries down the fallback chain without user interruption.

### 3. 🔐 Hardened Security & Isolation
- **Owner-Bound Firestore Rules**: Access control rules strictly restrict read and write operations to the authenticated owner (`request.auth.uid == userId`):
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```
- **Zero Secret Exposure**: `GEMINI_API_KEY` and backend credentials are strictly encapsulated on the server side and in Secret Manager, never exposed in client browser bundles.
- **Strict Environment Hygiene**: `.env` and local secrets are excluded via `.gitignore`. `.env.example` serves as the public schema template.

### 4. 🤖 Agentic Quality Workflow & Pre-Commit Validation
- **Antigravity Custom Skill**: Includes `.agent/skills/journal-enhancement/SKILL.md` enforcing project rules for security, fallback resilience, and modular architecture.
- **Automated Pre-Commit Hooks**: Husky hooks run TypeScript validation (`tsc --noEmit`) and Vitest test suite (`npm run test`) before every commit to ensure zero broken code reaches production.

---

## Local Setup & Development Guide

### 1. Prerequisites
- **Node.js**: v18 or higher
- **Package Manager**: `npm` or `bun`
- **Google Cloud SDK**: `gcloud` CLI installed and authenticated

### 2. Clone & Install
```bash
git clone https://github.com/Akhilan07/Geminijournal-APAC.git
cd Geminijournal-APAC
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your API keys in `.env`:
```env
# Required for Gemini AI API calls
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Optional: Host URL
APP_URL="http://localhost:3000"

# Google Maps API Key for spatial features
GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"
VITE_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"
```

### 4. Launch Local Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 5. Run Verification & Tests
```bash
# Type check
npm run lint

# Unit test suite
npm run test

# Production build
npm run build
```

---

## Google Cloud Run Deployment Guide

### 1. GCP Project & API Initialization
```bash
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="us-central1"

gcloud config set project $PROJECT_ID

gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

### 2. Configure Secret Manager
```bash
# Create and populate GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant Cloud Run service account access
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy to Cloud Run
```bash
gcloud run deploy gemini-reflections \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000
```

### 4. Attach Challenge Verification Label
To register the Cloud Run deployment for the **Google APAC Cloud Run Challenge** verification pipeline:
```bash
gcloud run services update gemini-reflections \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=$REGION
```

---

## License

Distributed under the MIT License. See `LICENSE` for details.
