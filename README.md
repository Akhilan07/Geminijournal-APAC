# Gemini Journal & Reflections

A secure, user-authenticated personal reflection and journaling web application powered by **Gemini 3.6 Flash** and **Cloud Firestore**. Every reflection, summary, and multi-turn brainstorming session is protected by owner-bound Firestore security rules, ensuring strict data isolation between users.

---

## Architecture Overview

| Component | Technology | Security & Functionality |
| :--- | :--- | :--- |
| **User Identity** | Firebase Authentication | Google Sign-In with popup flow; zero plaintext passwords handled or stored. |
| **Database** | Cloud Firestore | Isolated document storage strictly partitioned under `/users/{userId}/interactions/{interactionId}`. |
| **AI Engine** | Gemini 3.6 Flash | Multi-turn reasoning, summaries, and reflections with automated 4-tier model fallback ladder. |
| **Backend & Routing** | Express.js + Vite | Full-stack server proxy preventing client-side `GEMINI_API_KEY` leakage. |
| **Secret Management** | Google Cloud Secret Manager | Dynamic runtime credential binding for Cloud Run deployment. |

---

## 1. Prerequisites & GCP Configuration

Ensure you have the Google Cloud SDK (`gcloud`) installed and authenticated:

```bash
# Set active project
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="us-central1"
gcloud config set project $PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Secret Management Setup

Gemini API keys must never be committed to source code or bundled into client code. Store your key in **Google Cloud Secret Manager** and bind it to the Cloud Run runtime service account.

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Lookup project number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# 3. Grant Cloud Run compute service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the owner-bound security rules to ensure each authenticated user can read and write exclusively to their own interactions:

### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default-deny all unmatched paths
    match /{document=**} {
      allow read, write: if false;
    }

    // User-isolated interactions
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules using the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Cloud Run Deployment Flow

Build and deploy the containerized full-stack application to **Google Cloud Run**:

```bash
# Build and deploy from source directly to Cloud Run
gcloud run deploy gemini-reflections \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000
```

---

## 5. Required Campaign Labeling (Challenge Verification)

To register your deployed Cloud Run service for the automated challenge verification pipeline, update your service with the mandatory campaign label:

```bash
gcloud run services update gemini-reflections \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=$REGION
```

---

## 6. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   PORT=3000
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. Build for production:
   ```bash
   npm run build
   npm run start
   ```
