# Product Requirements Document (PRD): MarkMe Event Attendance System

## 1. Document Overview
This document specifies the product requirements for **MarkMe**, a secure, real-time, QR-based event check-in and attendance tracking application. It bridges the gap between administrators, organizational team members, and external guest attendees by providing role-based security, live event monitoring, and an anti-proxy attendance verification system.

---

## 2. Product Objectives & Vision
Traditional event check-ins (e.g., paper sign-sheets, manual ID checking) are prone to proxy attendance, bottleneck check-in queues, and manual spreadsheet synchronization errors. 

**MarkMe** resolves these challenges by introducing:
*   **Dynamic, Expiring QR Codes:** Refreshes check-in QR credentials every 60 seconds to prevent attendance fraud (sharing screenshots or video recordings of codes).
*   **Web-Based Camera Scanning:** An instant scanner built directly into the web application, eliminating the need for users to download native apps.
*   **Role-Based Security:** Fine-grained access control ranging from high-level Admins to Leads, Co-Leads, Members, and Guest users.
*   **Live Metrics & Reports:** Real-time dashboards visualizing active events, team sizes, and instantaneous CSV data downloads.

---

## 3. User Personas & Role Mapping

MarkMe maps authorization permissions to specific user roles stored in the Firebase Custom Claims database and mapped in Firestore:

| User Role | Target User Persona | Primary Access & Responsibilities |
| :--- | :--- | :--- |
| **Admin** | Organization Core Leaders, Executive Boards | Full access to user management, event lifecycle (create/edit/delete), team provisioning, real-time QR generation (both Team and Guest QRs), and complete CSV data exports. |
| **Lead / Co-Lead** | Sub-team leaders (e.g., Logistics, PR, Tech Leads) | View assigned sub-team list, view team members, download event attendance and team membership sheets as CSVs. |
| **Member** | Active volunteers and staff members | Log in using Email or a Custom Unique ID (e.g., `PA-XXXXXX`), scan live "Team QRs" to check-in for events, view their own personal profile and history. |
| **Guest** | External participants, students, or visitors | Scan the live "Guest QR" to open a registration form, enter details (Name, Class, Year, Roll No, Email) to check-in for the event, and register attendance. |

---

## 4. Functional Requirements

### 4.1 Authentication & Profile Management
*   **Dual-Identifier Sign-In:** Users can log in using their primary email address or a custom Unique ID (e.g., `PA-XXXXXX`). If a Unique ID is inputted, the client translates it to a local email structure (`identifier@attendance.local`) for Firebase compatibility.
*   **Role-Based Dashboard Redirection:** Users are shown features tailored to their roles: admins see user/event managers; members/guests see scanning, event logs, or personal profiles.
*   **Self-Service Password Updates:** Logged-in members can securely update their current password by verifying their credentials first.
*   **Admin-Initiated Creation:** Administrators can manually register team members via the user manager, automatically generating a random secure password and Unique ID.

### 4.2 Event Lifecycle Management
*   **Event Creation:** Admins can create events specifying *Title*, *Description* (max 200 words), *Date*, *Start Time*, *End Time*, and *Venue*.
*   **Event Updates & Deletion:** Admins can dynamically edit the parameters of an event or delete it entirely, deleting all dependent attendee sheets.
*   **Status Auto-Transition:** Events dynamically compute their state based on system time:
    *   **Upcoming:** Current Time < Event Start Time.
    *   **Live:** Event Start Time $\le$ Current Time $\le$ Event End Time.
    *   **Expired:** Current Time > Event End Time.

### 4.3 Anti-Proxy QR Generation & Verification
*   **Rolling Validation Code:** Live events display a dynamic QR code based on the current absolute Unix minute. The QR payload consists of `[prefix]|[eventId]|[unixMinute]`.
*   **Refreshes Every 60s:** The QR code canvas component updates its payload every minute automatically.
*   **Client Scan Processing:**
    *   The browser scanner initiates the camera stream, drawing frames onto an offscreen canvas to decode the QR via `jsQR`.
    *   If a URL is detected, the scanner redirects the user. If a text payload is detected, it processes check-in.
*   **Server/Client Timestamp Validation:** 
    *   **Team Members:** The check-in script reads the QR timestamp and compares it to the local system time. Check-ins are approved if the timestamp is within $\pm 1$ minute.
    *   **Guest Attendees:** The scanner validates the timestamp on scan, and then triggers an inline attendee form. Upon form completion, the check-in is saved.
*   **Attendance Uniqueness:** The system checks Firestore constraints to guarantee a user cannot check-in to the same event twice.

### 4.4 Team and Member Management
*   **Auto Team Creation:** When a new member is assigned to a team, the team document is automatically created if it does not already exist.
*   **Orphaned Member Cleanup:** Admins can trigger a backend cleanup utility to scrub teams of invalid user references.
*   **Data Export (CSV):** Admins and Leads can export complete attendance rosters (including guest metrics and internal team logs) with single-click downloads.

---

## 5. Non-Functional Requirements

### 5.1 Security & Access Control
*   **Claims Validation:** Crucial actions (e.g., creating members or teams) must occur via the Express Backend API. The server inspects custom claims (`role === "admin"`) injected via Firebase Admin SDK.
*   **Secure QR Payload:** The minute timestamp appended to the QR code limits the shelf-life of any captured QR image.
*   **Password Complexity:** Enforced password length of at least 6 characters on creation.

### 5.2 Performance & Scalability
*   **Real-Time Data Streaming:** Client pages bind live Firestore listeners (`onSnapshot`) to sync check-in tables without needing page reloads.
*   **Firestore Long-Polling:** Configured on the client to prevent proxy-blocking and Content Security Policy (CSP) errors.

### 5.3 Usability & Appearance
*   **Glassmorphism UI:** Translucent background blurs, animated borders, gradients, and custom responsive layouts built on TailwindCSS.
*   **Mobile-First Design:** Fully responsive templates adjusting interfaces for mobile-width QR scanning and projector-width admin views.
