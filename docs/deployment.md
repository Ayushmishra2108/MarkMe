# Deployment and Setup Guide: MarkMe

## 1. Document Overview
This document describes the configurations, environmental variables, database staging steps, and build workflows required to run **MarkMe** in local development environments and deploy the codebase to Netlify.

---

## 2. Environmental Variables Configuration
Create a `.env` file in the root directory. Configure the client and backend parameters:

### 2.1 Web App Configurations
These variables are loaded by Vite during client compilation:
```env
# Node Environment setting
NODE_ENV=production

# Server API endpoint (fallback to local in development)
VITE_API_URL=/api
```

### 2.2 Firebase Admin SDK Configurations (Backend)
To manage custom claims and create user profiles in Firebase Authentication, the serverless Express backend needs Admin permissions.

Provide the service account JSON as a single collapsed string:
```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"attendance-tracker-aa94a","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-...@attendance-tracker-aa94a.iam.gserviceaccount.com",...}'
```
Alternatively, set the individual variables if service account parsing is not supported by your environment:
```env
FIREBASE_PROJECT_ID=attendance-tracker-aa94a
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@attendance-tracker-aa94a.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

---

## 3. Firebase Setup Requirements

To connect the application to your Google Cloud Firebase instance:

### 3.1 Authentication
1.  Navigate to the Firebase Console -> Build -> **Authentication**.
2.  Enable the **Email/Password** sign-in provider.

### 3.2 Cloud Firestore Database
1.  Navigate to Firestore Database and create a database instance in native mode.
2.  Configure rules to allow authenticated users to perform reads and writes, or establish strict policies:
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Authenticated users can read/write profile details and attendance entries
        match /{document=**} {
          allow read, write: if request.auth != null;
        }
      }
    }
    ```

---

## 4. Local Execution (Development)

Ensure Node.js and `pnpm` are installed. Run local execution scripts:

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Run both the Vite Dev Server and the Express API server (Co-hosted on port 8080)
pnpm dev

# 3. Perform TypeScript validation check
pnpm typecheck
```

*Note: The React client proxies API requests to `http://localhost:8080` in local development mode.*

---

## 5. Netlify Deployment Steps

MarkMe contains built-in Netlify redirects and configuration parameters in `netlify.toml` for hosting the static client and serverless API handlers on the same domain:

### 5.1 Compilation
Run the client and server builder:
```bash
pnpm build
```
*This places compiled SPA code in `dist/spa` and backend handlers in the `dist/server` folders.*

### 5.2 Settings in Netlify UI
1.  **Build Command:** `npm run build:client` (Vite compiles static assets to `dist/spa`).
2.  **Publish Directory:** `dist/spa`
3.  **Functions Directory:** `netlify/functions`
4.  **Environment Variables:** Add `FIREBASE_SERVICE_ACCOUNT` (the JSON string of the Service Account certificate) to Netlify -> Site configuration -> Environment variables.
5.  Deploy the branch. Netlify will configure redirects mapping `/api/*` requests to the compiled serverless function in `netlify/functions/api.ts`.
