# BlackByte Cybercafe Reservation & Authentication System

A comprehensive, production-ready, full-stack cybercafe reservation and management platform. The system allows customers to securely register, manage credits, reserve standard and VIP gaming stations, upgrade their membership levels, and open support tickets. Administrators can manage workstations, bookings, support tickets, and view deep analytics.

---

## 🗄️ Database Used: Supabase PostgreSQL

The application uses **Supabase PostgreSQL** as its primary cloud relational database. The database is already configured and running in the cloud. The system connects using connection pooling (`pg.Pool`) configured with SSL security options optimized for serverless environments.

### Database Architecture
The database schema consists of the following relational tables:
- **`users`**: Manages accounts, credits, rank points, and roles (`user`/`admin`).
- **`computers`**: Tracks cybercafe workstations, hardware specifications (CPU, GPU, RAM, Monitor Hz), pricing rates, and statuses.
- **`reservations`**: Manages individual workstation booking sessions with timestamp ranges and booking statuses.
- **`tickets`**: Handles customer support tickets linked to specific workstations.

---

## 🛡️ Chosen Advanced Feature: Role-Based Access Control (RBAC) & Secure Route Guarding

The primary advanced technical feature implemented within this system is **Granular Role-Based Access Control (RBAC)** coupled with **Strict Route Guards** across both application layers:

1. **Client-Side Authorization Guards:**
   - Powered by React's global `AuthContext` state.
   - Restricts sensitive pages like `/admin` and `/dashboard` using specialized routing guards.
   - Non-admin users attempting to reach administrative endpoints are instantly redirected to safe zones using an optimized `replace: true` navigation stack layout to preserve browser history.
2. **Server-Side Authorization Middleware:**
   - Protects API endpoints at the database/API level using a two-stage middleware pipeline:
     - `token`: Decodes the HTTP-only cookie-based JWT token to authenticate and verify user identity.
     - `isAdmin`: Validates the database role of the decoded user directly against required admin privileges, returning a `403 Forbidden` response to unauthorized users.
   - Prevents bypass attempts via Postman, curl, or external scripts.

---

## ⚙️ Server Setup Instructions

Follow these steps to run the backend server locally and connect it to the cloud database.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

---

### Step 1: Clone the Repository & Install Dependencies

1. Clone the repository and navigate into the `backend` directory:
   ```bash
   git clone https://github.com/ZedDaProgrammer/finals-project.git
   cd finals-project/backend
   ```
2. Install the server-side dependencies:
   ```bash
   npm install
   ```

---

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend` root directory and fill in your configuration settings. Make sure to provide the connection URI for your cloud database:

```env
PORT=3000
DATABASE_URL=postgresql://postgres.[your-project-ref]:[your-password]@aws-0-[your-region].pooler.supabase.com:6543/postgres?sslmode=require
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

---

### Step 3: Run the Server

Start the backend server in development mode (runs Node with nodemon auto-reload):
```bash
npm run dev
```
