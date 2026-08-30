# Shewwina — India's Smart Waiting Platform

**Vision:** Build the Operating System for Customer Flow.  
**Initial Target:** Salons and Clinics.

---

## Technical Stack (Phase 1 Foundation)

- **Frontend:** React 18, Vite 5, Tailwind CSS, React Router DOM v6
- **Backend:** Node.js, Express 4, CORS, Dotenv
- **Database Architecture:** PostgreSQL / Supabase PostgreSQL Strategy
- **Testing:** Node.js Native Test Runner (`node:test`)

---

## Quick Start & Local Setup

### 1. Installation

Install all required dependencies:

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Environment variables:
- `PORT`: Express server port (default: `5000`)
- `FRONTEND_URL`: Client URL for CORS policy (default: `http://localhost:5173`)
- `VITE_API_BASE_URL`: Backend API URL for client requests (default: `http://localhost:5000`)
- `DATABASE_URL`: PostgreSQL / Supabase connection URL

### 3. Running Development Servers

#### Start Frontend (Vite)
```bash
npm run dev
```
App runs at `http://localhost:5173/`

#### Start Backend API (Express)
```bash
npm run dev:backend
```
API runs at `http://localhost:5000/`

---

## Application Routes

| Path | Description | Status |
| :--- | :--- | :--- |
| `/` | Landing Page (Preserved 12 visual sections) | ✅ Active |
| `/join/:businessId` | Customer Queue Entry Screen | 🟡 Phase 1 Placeholder |
| `/token/:tokenId` | Customer Live Token Tracker | 🟡 Phase 1 Placeholder |
| `/dashboard` | Business Queue Management Portal | 🟡 Phase 1 Placeholder |

---

## Backend API Endpoints

| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service Health & Database Connection Check | ✅ Active (HTTP 200) |

---

## Build & Testing Verification

### Run Tests
```bash
npm run test
```

### Build Production Bundle
```bash
npm run build
```
