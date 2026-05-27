# HLS Admin

Next.js admin panel with react-admin dashboard, user management, video uploads with HLS playback, cron job scheduling, and real-time WebSocket events.

## Stack

- **Next.js 16** (App Router)
- **React Admin v5** (admin dashboard)
- **NextAuth v5** (credentials auth, JWT sessions, role-based access)
- **Drizzle ORM + PostgreSQL** (database)
- **WebSocket** (`ws`) with JWT auth for real-time events
- **node-cron** for scheduled jobs
- **hls.js** for video playback

## How to run

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Configure environment

Create `.env.local`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nextstream
AUTH_SECRET=your-secret-here
WS_PORT=3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up the database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

This creates the schema and seeds an admin user.

### 5. Start the dev server

```bash
npm run dev
```

- App: http://localhost:3000
- Admin dashboard: http://localhost:3000/dashboard
- WebSocket server: ws://localhost:3001

## Features

- **User management** -- CRUD with soft delete, role-based access (admin/user), online status
- **Video uploads** -- Upload video files, HLS streaming playback
- **Cron jobs** -- Schedule tasks with cron expressions, optional JS script uploads
- **Real-time events** -- WebSocket broadcast of user.created, user.updated, user.deleted events with toast notifications
- **Deleted users** -- Separate view for soft-deleted users with restore and hard delete
- **Events page** -- Broadcast custom events to all admins, live event feed
