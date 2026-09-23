# Application Architecture

## 1. Framework
The application utilizes the **Next.js App Router** (`/app` directory) for server-rendered components, optimized routing, and integrated API handling.

## 2. Route Structure
- `/` - Landing page containing the Auth UI (Login/Register).
- `/dashboard` - Protected route. Renders the participant project submission form and preview.
- `/admin` - Protected admin route. Renders the data table, search bar, and CRUD modals.
- `/auth/callback` - Route handler for Supabase authentication redirects.

## 3. State Management & Data Fetching
- **Server Components:** Used for fetching initial profile data and verifying roles securely on the server before rendering dashboards.
- **Client Components:** Used for interactive elements (forms, search bar, file uploads, modals).
- **Server Actions:** Handle form submissions and database mutations directly from the client components to ensure secure server-side execution.

## 4. UI Components
Constructed using React and Tailwind CSS. Modals and drawers will be used for admin edit operations to keep the user context within the data table.