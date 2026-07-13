# MVP Definition & Scope: MarkMe Event Attendance System

## 1. Document Overview
This document defines the scope of the Minimum Viable Product (MVP) of **MarkMe** that has been successfully deployed. It details the implemented features and differentiates them from future roadmapped enhancements.

---

## 2. Implemented MVP Features (In Scope)

### 2.1 Core Authentication
*   **Dual-Login Support:** Login using standard email or uniquely formatted system IDs (e.g., `PA-XXXXXX`), auto-mapping to virtual email aliases (`*@attendance.local`).
*   **Password Self-Reset:** Support for sending email-based reset links using Firebase Auth.
*   **Persistent Auth State:** React context listening to `onAuthStateChanged` keeping sessions alive.

### 2.2 Dynamic Check-In & Anti-Proxy Validation
*   **Expiring QR Codes:** Displays QR codes dynamically generated from the current minute unix stamp. Refreshes every 60 seconds.
*   **Dual QR Channels:** 
    *   *Team QR* for organizational member check-ins.
    *   *Guest QR* for public attendees.
*   **Web-Based Scanning:** Integrated camera decoder using client-side JavaScript (`jsQR`) drawing frames on a `<canvas>` element.
*   **Manual Fallback Input:** Allow manual entry of decrypted QR strings if camera permissions are blocked.
*   **Validation Tolerance:** Check-in validation with a $\pm 1$ minute tolerance threshold.

### 2.3 Role-Based Interactive Dashboard
*   **Dynamic Metrics:** Counters tracking *Total Events*, *Total Teams*, and *Total Members* registered.
*   **Event Feed:** Live card feed displaying events, auto-calculating status labels (`Upcoming`, `Live`, `Expired`) on the fly.
*   **Quick Action Scanner:** Immediate button linking to the scanner route (`/qr-scan`) from any role profile.

### 2.4 Admin Management Panel
*   **Event Control:** Dialog menu allowing creation of event names, descriptions, venues, dates, and times.
*   **User Registration:** Administrative form allowing user creation with designated roles (`admin`, `leader`, `member`), unique system IDs, and manual or auto-generated passwords.
*   **Member Profile Updates:** View and modify credentials, team affiliations, and access settings.
*   **CSV Exporter:** Exports event-based attendee logs and team compositions into formatted CSV files.
*   **Database Cleanup Utilities:** REST endpoint executing orphaned reference sweeps on Firestore teams.

---

## 3. Deferred Features (Out of Scope for MVP)

These features represent advanced enhancements deferred to future development cycles:

### 3.1 Advanced Analytics & Charting
*   **Attendance Heatmaps:** Visual calendars showing peak attendance hours and event-by-event check-in counts.
*   **Member Engagement Scores:** Tracking volunteer attendance percentages over long durations to rank participation.

### 3.2 Automated Certification & Integrations
*   **Certificate Builder:** Automatic PDF generator mailing "Participation Certificates" to guest attendees upon verified check-in.
*   **Calendar Syncer:** Integration pushing created events to Google Calendar or Outlook calendars of registered members.

### 3.3 Native Applications
*   **Mobile Apps:** Deploying dedicated iOS and Android apps to utilize native camera APIs and support offline local scanning (caching scans until network reconnects).

### 3.4 Multi-Tenant Support
*   **Organizational Isolation:** Restructuring the backend database to host multiple separate schools or organizations under isolated namespaces.
