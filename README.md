# Finals Project - Full-Stack Reservation & Authentication System

A robust, full-stack web application designed for managing user registrations, secure authentication, and system reservations. Built using a modern JavaScript stack with Node.js and Express on the backend, React on the frontend, and backed by a relational database management system.

##  Project Description
This system provides a seamless user flow from authentication to reservation management. It includes custom route guarding on both the client and server sides to differentiate between regular users and administrative roles. Regular users can seamlessly navigate their dashboards and check reservations, while administrators have elevated permissions to review analytics and maintain complete system management capability.

---

##  Tech Stack & Database Used

### Frontend
- **Framework:** React.js (Vite workflow)
- **Routing & State:** React Router DOM (with custom Client-side Client guards) & React Context API for global state management.

### Backend
- **Runtime Environment:** Node.js
- **Framework:** Express.js (v5 workflow)
- **Security & Utilities:** `bcryptjs` for secure password hashing, `jsonwebtoken` (JWT) & `cookie-parser` for handling HTTP-only cookie authentication tokens, and `express-validator` for input sanitation.

### Database Used
- **Database Engine:** **PostgreSQL**
- **Connection Driver:** `pg` (Node-Postgres via Connection Pooling)
- **Production Enhancements:** Configured with dynamic SSL connection handshakes (`rejectUnauthorized: false`) optimized for secure cloud execution environments.

---

##  Chosen Advanced Feature: Role-Based Access Control (RBAC) & Secure Route Guarding

The primary advanced technical feature implemented within this system is **Granular Role-Based Access Control (RBAC)** coupled with **Strict Route Guards** across both application layers:

1. **Client-Side Authorization Guards:** Utilizes the React `useEffect` ecosystem to actively analyze the global authentication state. Non-admin users attempting to reach administrative endpoints are instantly neutralized and routed cleanly to safe zones using an optimized `replace: true` navigation stack layout to preserve pristine browser history.
2. **Server-Side Authorization Middleware:** Protects endpoints at the database/API level. Before any controller logic executes, server-side middleware decodes HTTP-only JWT cookies and cross-checks the user's role criteria directly against database privileges, preventing unauthorized API queries (e.g., via Postman or malicious scripts).

=