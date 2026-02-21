# FleetFlow — Fleet & Logistics Management System

Production-grade fleet management system with Node.js/Express backend, PostgreSQL, Prisma ORM, JWT+RBAC auth, and a React dashboard.

## Tech Stack

| Layer    | Technology                      |
| -------- | ------------------------------- |
| Backend  | Node.js + Express               |
| Database | PostgreSQL (local)              |
| ORM      | Prisma                          |
| Auth     | JWT + Role-Based Access Control |
| Frontend | React + Vite                    |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL running locally
- Create a database called `fleetflow`

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env        # Edit DATABASE_URL if needed
npx prisma migrate dev      # Apply schema + generate client
npm run seed                 # Seed demo data
npm run dev                  # Start on port 5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev                  # Start on port 5173
```

### Demo Credentials

| Role              | Email                    | Password    |
| ----------------- | ------------------------ | ----------- |
| Fleet Manager     | admin@fleetflow.com      | password123 |
| Dispatcher        | dispatcher@fleetflow.com | password123 |
| Safety Officer    | safety@fleetflow.com     | password123 |
| Financial Analyst | finance@fleetflow.com    | password123 |

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

| Resource         | Methods                                     | Auth       |
| ---------------- | ------------------------------------------- | ---------- |
| `/auth/register` | POST                                        | Public     |
| `/auth/login`    | POST                                        | Public     |
| `/auth/me`       | GET                                         | JWT        |
| `/vehicles`      | GET, POST, PUT, PATCH, DELETE               | JWT + RBAC |
| `/drivers`       | GET, POST, PUT, PATCH                       | JWT + RBAC |
| `/trips`         | GET, POST, PATCH (dispatch/complete/cancel) | JWT + RBAC |
| `/maintenance`   | GET, POST, DELETE                           | JWT + RBAC |
| `/fuel`          | GET, POST, DELETE                           | JWT + RBAC |
| `/analytics/*`   | GET                                         | JWT        |

## Architecture

```
FleetFlow/
├── backend/
│   ├── prisma/           # Schema + seed
│   ├── src/
│   │   ├── config/       # DB + env config
│   │   ├── enums/        # Status state machines
│   │   ├── errors/       # Custom error classes
│   │   ├── middleware/    # Auth, RBAC, validation, error handler
│   │   ├── routes/       # Express route definitions
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── validators/   # Joi schemas
│   │   └── utils/        # JWT, password, catchAsync
│   └── server.js         # Entry point
├── frontend/
│   └── src/
│       ├── api/          # Axios API service
│       ├── context/      # Auth context
│       ├── components/   # Layout
│       └── pages/        # Dashboard, Vehicles, Drivers, Trips, Logs
└── README.md
```
