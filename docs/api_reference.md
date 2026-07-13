# REST API Reference Guide: MarkMe Backend API

## 1. Overview
The MarkMe Express backend serves API requests at the `/api/` path prefix. In development, it runs on port `8080` (co-hosted alongside Vite). In production, requests to `/api/*` are redirected to serverless Netlify Functions.

### Base Headers
For authenticated endpoints, ensure requests are sent with appropriate authorization parameters. For creation/modification APIs, send:
`Content-Type: application/json`

---

## 2. Admin & User Management Endpoints

### 2.1 Register User/Member
Register a new team member and insert their profile into Firebase Auth and Cloud Firestore.

*   **Endpoint:** `POST /api/admin/users`
*   **Access:** Admin Claim Required
*   **Request Body (JSON):**
    ```json
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "password": "SecurePassword123",
      "className": "B.Tech CSE",
      "rollNo": "CSE-102",
      "year": "2026",
      "phone": "+1234567890",
      "teamName": "Tech Team",
      "position": "Tech-Lead",
      "role": "leader",
      "uniqueId": "PA-JANE102"
    }
    ```
    *Note: If `uniqueId` is omitted, the server auto-generates a code prefixed with `PA-` (e.g. `PA-HX72J9`). If `email` is blank, it defaults to `<uniqueId>@attendance.local`.*

*   **Successful Response (200 OK):**
    ```json
    {
      "uid": "fXyZ9876543210abcde",
      "uniqueId": "PA-JANE102",
      "password": "SecurePassword123",
      "message": "Member registered successfully"
    }
    ```

---

### 2.2 Update User Role & Team
Update an existing user's authorization settings, group affiliation, password, and custom claims.

*   **Endpoint:** `PATCH /api/admin/users`
*   **Access:** Admin Claim Required
*   **Request Body (JSON):**
    ```json
    {
      "uid": "fXyZ9876543210abcde",
      "role": "admin",
      "teamName": "Core team",
      "position": "Head",
      "newPassword": "NewSecurePassword456"
    }
    ```

*   **Successful Response (200 OK):**
    ```json
    {
      "ok": true,
      "uid": "fXyZ9876543210abcde"
    }
    ```

---

### 2.3 Fetch User Profile
Fetch the detailed profile properties of a user by Firebase UID.

*   **Endpoint:** `GET /api/admin/users/:uid`
*   **Access:** Admin Claim Required
*   **URL Parameter:** `uid` (Firebase UID string)
*   **Successful Response (200 OK):**
    ```json
    {
      "uid": "fXyZ9876543210abcde",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "className": "B.Tech CSE",
      "rollNo": "CSE-102",
      "year": "2026",
      "teamName": "Core team",
      "position": "Head",
      "role": "admin",
      "uniqueId": "PA-JANE102",
      "joinDate": 1783920154000,
      "createdAt": 1783920154000
    }
    ```

---

### 2.4 Update User Profile details
Modify a user's standard metadata records by UID.

*   **Endpoint:** `PUT /api/admin/users/:uid`
*   **Access:** Admin Claim Required
*   **URL Parameter:** `uid` (Firebase UID string)
*   **Request Body (JSON):**
    ```json
    {
      "name": "Jane Roe",
      "className": "M.Tech CSE",
      "rollNo": "MCSE-401"
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "ok": true,
      "uid": "fXyZ9876543210abcde",
      "message": "User updated successfully"
    }
    ```

---

## 3. Team Endpoints

### 3.1 Create Team
Manually declare a new sub-team document inside Firestore.

*   **Endpoint:** `POST /api/admin/teams`
*   **Access:** Admin Claim Required
*   **Request Body (JSON):**
    ```json
    {
      "name": "Creative Design"
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "ok": true,
      "teamName": "Creative Design"
    }
    ```

---

### 3.2 List Teams
List all team documents registered in Firestore.

*   **Endpoint:** `GET /api/admin/teams`
*   **Access:** Admin Claim Required
*   **Successful Response (200 OK):**
    ```json
    [
      {
        "id": "Core team",
        "name": "Core team",
        "members": ["uid1", "uid2"]
      },
      {
        "id": "Tech Team",
        "name": "Tech Team",
        "members": ["uid3"]
      }
    ]
    ```

---

### 3.3 Clean Team Members Array
Scrub members arrays in a team document to discard deleted or unconfigured user UIDs.

*   **Endpoint:** `POST /api/admin/teams/clean-members`
*   **Access:** Admin Claim Required
*   **Request Body (JSON):**
    ```json
    {
      "teamName": "Tech Team"
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "ok": true,
      "removed": 2,
      "cleanedMembers": ["uid3"]
    }
    ```

---

## 4. Initialization & Health Checks

### 4.1 System Seed Init
Create the initial administrator user when setting up the database. Returns a conflict error (409) if an admin already exists in the Firestore database.

*   **Endpoint:** `POST /api/admin/seed`
*   **Access:** Public (Only available if 0 admins exist)
*   **Request Body (JSON):**
    ```json
    {
      "email": "superadmin@domain.com",
      "password": "FirstRootPassword123",
      "name": "Super Admin"
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "ok": true,
      "uid": "adminUid123456"
    }
    ```

---

### 4.2 Health Status check
Verify application service states for server health reporting.

*   **Endpoint:** `GET /api/health`
*   **Access:** Public
*   **Successful Response (200 OK):**
    ```json
    {
      "status": "ok",
      "timestamp": "2026-07-13T20:55:00.000Z",
      "environment": "production"
    }
    ```
