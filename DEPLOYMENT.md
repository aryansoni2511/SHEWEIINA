# SHEWWINA — Production Deployment Guide

This guide outlines the production deployment process for the **Shewwina Customer Flow & Smart Waiting Platform**.

---

## 1. Required Environment Variables

### Backend Configuration

| Variable | Required | Description | Example |
|---|---|---|---|
| `NODE_ENV` | Yes | Application environment | `production` |
| `PORT` | Yes | Server listening port | `5000` |
| `JWT_SECRET` | Yes | 64-byte hex secret for JWT signing | *(generated via crypto)* |
| `DATABASE_URL` | Yes (in prod) | Live PostgreSQL / Supabase connection URI | `postgresql://postgres.xxx:pass@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require` |
| `FRONTEND_URL` | Yes (in prod) | Exact allowed origin(s) for CORS | `https://shewwina.vercel.app` |
| `SMS_PROVIDER` | Optional | SMS gateway provider (`mock`, `twilio`, `msg91`) | `mock` |
| `WHATSAPP_PROVIDER` | Optional | WhatsApp gateway (`mock`, `meta`) | `mock` |
| `AI_PROVIDER` | Optional | AI provider for wait predictions (`mock`, `grok`) | `mock` |

### Frontend Configuration

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend API root URL | `https://shewwina-api.onrender.com` |

---

## 2. PostgreSQL / Supabase Setup & Migrations

### Step 2.1: Provision Database
Create a project on [Supabase](https://supabase.com) or any standard PostgreSQL 14+ host.

### Step 2.2: Retrieve Connection String
From your Supabase dashboard:
- Navigate to **Project Settings** → **Database**.
- Copy the **Connection URI** (Connection pooling port `6543` or direct port `5432`).
- Set this value as `DATABASE_URL` in your backend environment.

### Step 2.3: Execute Schema Migrations
Run the transactional migration runner:

```bash
npm run db:migrate
```

The runner will:
1. Connect to PostgreSQL using `DATABASE_URL`.
2. Automatically create the `schema_migrations` tracking table.
3. Discover SQL migrations in `backend/migrations/` (and `database/migrations/`).
4. Execute unapplied migrations sequentially in transactions (`BEGIN` ... `COMMIT`).
5. Track applied migration names in `schema_migrations`.

> [!NOTE]
> If `DATABASE_URL` is not set in development mode, the runner reports:
> `[MIGRATIONS] NOT EXECUTED — no live DATABASE_URL configured`

---

## 3. Backend Deployment (Render / Railway / Fly.io / VPS)

### Build & Start Commands
- **Build Command**: `npm install`
- **Pre-deploy / Release Command**: `npm run db:migrate`
- **Start Command**: `node backend/server.js`

### Health Check Endpoint
- **URL**: `GET /api/health`
- **Healthy Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Shewwina API is running",
    "data": {
      "service": "Shewwina Backend API",
      "status": "UP",
      "database": {
        "connected": true,
        "type": "PostgreSQL / Supabase",
        "database": "postgres",
        "timestamp": "2026-09-03T07:00:00.000Z",
        "message": "Active PostgreSQL pool connected successfully."
      },
      "environment": "production"
    }
  }
  ```
- **Degraded Response (HTTP 503)**:
  When database pool is disconnected in production mode.

---

## 4. Frontend Deployment (Vercel / Netlify / Cloudflare Pages)

### Build Configuration
- **Framework**: Vite / React
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: `https://your-backend-domain.com`

---

## 5. Production Verification Steps

1. **Verify Health Endpoint**:
   ```bash
   curl -i https://your-backend-domain.com/api/health
   ```
   Ensure `status: 200` and `database.connected: true`.

2. **Verify Database Migrations**:
   Ensure all 6 migrations applied cleanly without errors.

3. **Verify CORS**:
   Ensure browser fetch from `FRONTEND_URL` succeeds and arbitrary origins are rejected.

4. **Verify Realtime SSE**:
   Open `/display/:businessId` to confirm TV display connects to `/api/v1/queue/stream?businessId=...&public=true`.

5. **Verify Business & Customer Auth**:
   Register a business and customer; verify JWT creation, session persistence, and proper role-based redirects.
