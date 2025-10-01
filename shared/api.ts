/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Domain models ready for Firestore
export type Role = "admin" | "leader" | "member";

export interface Event {
  id: string;
  name: string;
  description?: string;
  startAt: string; // ISO 8601
  endAt?: string;
  status: "Active" | "Closed";
}

export interface TeamMember {
  uid: string;
  displayName: string;
  role: Role;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}

export interface Attendance {
  id: string;
  eventId: string;
  teamId?: string;
  attendeeName: string;
  attendeeId?: string;
  scannedValue?: string;
  checkedInAt: string; // ISO 8601
}
