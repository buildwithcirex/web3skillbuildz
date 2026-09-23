# Project Overview

## Objective
To build a streamlined web platform where event attendees can register and submit their project deliverables, while providing organizers with a centralized dashboard to manage submissions.

## User Flows

### 1. Participant Flow
- **Registration:** Users sign up with Name, Email, Phone Number, and Password. Role selection is explicitly omitted; all new users default to `participant`.
- **Dashboard:** Upon login, participants are routed to a dashboard containing a submission form.
- **Submission:** Participants upload a project screenshot, enter a short description, and provide a deploy link. Once submitted, they can view their submission details.

### 2. Admin Flow
- **Initialization:** The system automatically grants the `admin` role to a predefined email address configured in the environment variables.
- **Dashboard:** Admins are routed to an exclusive dashboard displaying all registered participants.
- **Management:** 
  - Search participants by name, email, or phone.
  - Edit or delete participant records and submissions.
  - Upgrade a participant's role to `admin`.