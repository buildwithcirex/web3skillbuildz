# API & Data Fetching Strategy

The application relies on Next.js Server Actions and the Supabase Client rather than traditional REST API endpoints. 

## 1. Data Retrieval (Server Components)
Data fetching for dashboards occurs server-side to guarantee security and minimize client bundle size.
- **Admin Query:** Fetches all rows from `profiles`.
- **Participant Query:** Fetches a single row matching `auth.uid()`.

## 2. Mutations (Server Actions)
Operations that modify data are structured as Next.js Server Actions:
- `submitProject(formData)`: Uploads screenshot to storage, updates `profiles` with description, link, and image URL.
- `updateParticipant(userId, data)`: Admin action to modify participant fields.
- `deleteParticipant(userId)`: Admin action to remove a user record.
- `promoteToAdmin(userId)`: Admin action to change a user's role to 'admin'.

## 3. File Uploads
Images are uploaded directly to Supabase Storage via the client using `@supabase/supabase-js`, returning a public URL that is then passed to the `submitProject` Server Action.