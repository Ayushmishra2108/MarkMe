# Firebase Data Model for Admin Features

## Collections

### events
- id: string (auto-generated)
- name: string
- description: string
- date: string (ISO format)
- time: string
- venue: string
- teamName: string (event management team)
- createdBy: string (admin id)
- createdAt: timestamp

### teams
- id: string (auto-generated)
- name: string
- members: array of member ids
- createdAt: timestamp

### members
- id: string (unique, can be email or custom id)
- name: string
- rollNo: string
- class: string
- year: string
- teamName: string
- position: string
- email: string
- password: string (hashed)
- joinDate: timestamp
- lastUpdated: timestamp

## Relationships
- When an event is created with a teamName, if the team does not exist, create it.
- When a member is added to a team, update the team's members array.
- Members can update their email, unique id, and password after login.
