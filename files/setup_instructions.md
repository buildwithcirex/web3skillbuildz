# Local Development Setup

## 1. Prerequisites
- Node.js (v18.x or later)
- npm, yarn, or pnpm
- A Supabase account and project

## 2. Installation
Initialize the Next.js project and install dependencies:
```bash
npx create-next-app@latest event-platform
cd event-platform
npm install @supabase/supabase-js @supabase/ssr lucide-react
```

## 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ADMIN_EMAIL=admin_user@yourdomain.com
```

## 4. Run the Development Server
```bash
npm run dev
```
Access the application at `http://localhost:3000`.