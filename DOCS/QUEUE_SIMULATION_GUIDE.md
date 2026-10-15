# Shewwina — Interactive Queue Simulation & Project Guide

> **College CSE Mini-Project**: Shewwina Smart Waiting Platform<br>
> **Topic**: Digital Queue Management & State Machine Orchestration<br>
> **Student Guide & Presentation Script**

---

## 1. What Shewwina Does

**Shewwina** is a digital waiting platform built to eliminate physical waiting lines in everyday service businesses—such as hair salons, medical clinics, dining restaurants, and retail service centers.

### The Problem It Solves
- Physical waiting areas get congested, noisy, and stressful.
- Customers have no clear visibility into how long they need to wait.
- Paper tokens get misplaced, and customers walk away without staff knowing.

### How Shewwina Solves It
1. **Virtual Check-in**: Customers scan a QR code at the entrance or visit the web link to take a digital token.
2. **Live Turn Tracking**: The customer’s phone displays their exact token number, position in line (e.g., `#2 in line`), and estimated wait time (e.g., `~10 mins`).
3. **Staff Control**: Staff use a clean dashboard to call the next customer, mark services completed, or skip absent tokens.

---

## 2. What Queue Simulation Means

In production, queue tokens are stored in a PostgreSQL database and updated through REST API calls and SSE (Server-Sent Events).

However, during a **college presentation or viva evaluation**, presenting live databases carries risks:
- You might lack a stable Wi-Fi connection.
- You might unintentionally alter or corrupt testing records in the database.
- Resetting and re-running test cases takes too much time in front of an examiner.

**Queue Simulation** provides a sandboxed, in-memory React playground (`/demo`) that models the exact lifecycle of customer queues with 5 pre-loaded sample customers. It lets you demonstrate token progression, status transitions, and wait-time algorithms instantly, safely, and repeatedly.

---

## 3. How the Simulation State Changes

The simulation operates as a deterministic **finite-state machine**:

```
[ New Customer ] ──> WAITING ──(Call Next)──> SERVING ──(Mark Served)──> SERVED
                        │
                        └──(Optional: Skip)──> SKIPPED
```

### State Definitions:
1. **`WAITING`**: The customer has taken a token and is in line. They have a position number (`#1`, `#2`, `#3`...) and a calculated estimated wait time.
2. **`SERVING`**: The customer was called to the counter. Only **one** customer can be actively served at a single counter at any given time.
3. **`SERVED`**: Service is complete. The token is archived and no longer contributes to the waiting count or waiting time.

### State Transitions:
- When the user clicks **Call Next**:
  - The currently serving customer (if any) transitions to `SERVED`.
  - The first eligible customer with status `WAITING` transitions to `SERVING`.
  - All subsequent waiting customers move up by 1 position (e.g., `#2` becomes `#1`).
- When the user clicks **Mark Served**:
  - The customer with status `SERVING` transitions to `SERVED`.
  - The counter becomes idle until **Call Next** is triggered.
- When the user clicks **Add Demo Customer**:
  - A new customer is appended with status `WAITING` and the next sequential token (e.g., `D-106`).
- When the user clicks **Reset Demo**:
  - The local state resets to the initial 5 sample customers: `D-101` (Serving) and `D-102` through `D-105` (Waiting).

---

## 4. How Token Ordering Works

Shewwina uses a strict **First-In, First-Out (FIFO)** queuing discipline:

1. **Sequential Identification**: Each token receives a sequential identifier:
   - Live Mode: Prefix + sequence (e.g., `S-101`, `S-102`)
   - Demo Mode: `D-101`, `D-102`, `D-103`, `D-104`, `D-105`...
2. **Queue Priority**:
   - The queue index is determined by token creation order.
   - The customer with the lowest waiting token number is always at position `#1` and is called first when staff triggers **Call Next**.
3. **No Queue Jumping**: Customers cannot manipulate their position; tokens are generated sequentially by the server/state engine.

---

## 5. How Estimated Waiting Time is Calculated

Waiting time is an **estimate**, not a guaranteed countdown, calculated using the standard service duration model:

$$\text{Estimated Wait (minutes)} = \text{Customers Ahead} \times \text{Average Service Duration}$$

### Example:
- **Average Duration**: 5 minutes per customer (configurable in the UI to 3, 5, 10, or 15 mins).
- If Priya Mehta is token `#D-102` and Rahul Sharma (`D-101`) is currently being served:
  - Priya is `#1` in the waiting line (0 customers ahead of her in the waiting pool).
  - Estimated wait for Priya = $1 \times 5 = 5\text{ minutes}$.
- If Sneha Patel is token `#D-104`:
  - 2 customers are waiting ahead of her (`D-102`, `D-103`).
  - Estimated wait for Sneha = $(2 + 1) \times 5 = 15\text{ minutes}$.

> [!NOTE]
> In production (`backend/routes/queueRoutes.js`), Shewwina enhances this baseline formula with an AI-adjusted heuristic that factors in peak hour congestion and service complexity. In Demo Mode, the transparent linear formula is displayed so that students can easily explain it on the whiteboard.

---

## 6. How Demo Mode Differs from Live Mode

| Attribute | Live Mode (`/join/:id`, `/dashboard`) | Demo Mode (`/demo`) |
| :--- | :--- | :--- |
| **Data Storage** | PostgreSQL database via Express API | Local React state (`useState`) |
| **Network Requests** | Real HTTP REST calls (`fetch`) | Zero backend API calls |
| **Token Prefix** | Configurable (e.g., `S-`, `C-`) | Clearly designated `D-` (Demo) |
| **Banner Notice** | Normal operational UI | Visible green banner: *“You're in Demo Mode”* |
| **Safety** | Modifies real business queues | **100% safe** — cannot alter real records |
| **Reset Capability** | Requires database truncate/seed script | Instant 1-click **Reset Demo** button |
| **Auto-Progression** | Driven by actual staff actions | Built-in timer for automated walkthroughs |

---

## 7. Technologies Used & Architecture

1. **React 18**: Frontend UI library used for component state management, reactive re-rendering, and declarative UI.
2. **Vite**: Modern development and build tool that bundles JavaScript modules with fast Hot Module Replacement (HMR).
3. **Tailwind CSS**: Utility-first CSS framework configured with Shewwina’s fresh green theme (`#166534`, `#22C55E`, `#DCFCE7`).
4. **React Router v6**: Client-side routing connecting the Landing Page (`/`), Queue Simulation (`/demo`), Customer Queue (`/join/:businessId`), Token Pass (`/token/:id`), and Business Dashboard (`/dashboard`).
5. **Node.js & Express**: Backend REST API server handling authentication (JWT), input validation, rate limiting, and business logic.
6. **PostgreSQL / Supabase**: Relational database storing tenants, services, staff users, and token history.

---

## 8. Step-by-Step Script for Demonstrating to Your Teacher

When presenting this project to your college evaluator, follow this 4-minute demonstration script:

### Step 1: Introduction (30 seconds)
> *"Good morning, sir/ma'am. My project is Shewwina — a Smart Waiting Platform. It is designed to replace crowded physical waiting rooms in salons and clinics with a live virtual queue that customers can monitor on their smartphone."*

### Step 2: Show the Landing Page & Green UI (45 seconds)
1. Open the homepage (`http://localhost:5173/`).
2. Point out:
   - The headline: *"Your Time Matters. Waiting Doesn't Have To."*
   - The 3 simple steps in **How It Works**: *1. Choose Service, 2. Get Token, 3. Track Turn*.
   - The 4 supported industry verticals: *Salons, Clinics, Restaurants, Service Centres*.
   - The illustrative preview card with sample token `#S-104`.

### Step 3: Launch the Queue Playground (`/demo`) (90 seconds)
1. Click **Try Demo** in the navigation bar.
2. Highlight the prominent banner:
   > *"Notice the banner at the top: 'You're in Demo Mode'. This playground operates entirely in client-side React memory, so we can safely test queue logic without touching live database records."*
3. Show the initial state:
   - Token `#D-101` (Rahul Sharma) is currently **Serving**.
   - 4 customers (`D-102` to `D-105`) are **Waiting**.
   - Total estimated wait time is 20 minutes (4 waiting $\times$ 5 min average).
4. Click **Call Next**:
   - Point out how `#D-101` moves to **Served** and `#D-102` (Priya Mehta) is now **Serving**.
   - Show that the waiting count automatically drops from 4 to 3, and estimated wait drops to 15 minutes.
5. Click **+ Add Customer**:
   - Type `"Ananya Roy"` and select `"Doctor Consultation"`.
   - Click submit and show that she gets sequential token `#D-106` at the end of the line.
6. Click **Reset Demo**:
   - Demonstrate that the playground instantly returns to its clean initial state.

### Step 4: Show Real Backend & Customer Flow (45 seconds)
1. Click **Test Live Join Flow** or navigate to `/join/demo`.
2. Show that real customers can enter their name and 10-digit mobile number to generate an actual database token pass (`/token/:tokenId`).
3. Explain the architecture:
   > *"The backend is built with Node.js, Express, and PostgreSQL with full JWT security and 279 automated unit tests verifying input validation, rate limiting, and role isolation."*

### Step 5: Conclusion (15 seconds)
> *"In conclusion, Shewwina demonstrates full-stack software architecture, predictable FIFO state transitions, and accessible UI design to solve real-world waiting room congestion. Thank you!"*

---

*Document compiled for Shewwina CSE Academic Mini-Project Evaluation.*
