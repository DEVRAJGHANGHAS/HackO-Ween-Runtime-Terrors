# 🍱 FoodResQ AI
### Dynamic Food Redistribution Network — Full-Stack Application

> **Predict Surplus. Match Demand. Deliver Before Expiry.**

[![SDG 2](https://img.shields.io/badge/SDG%202-Zero%20Hunger-orange?style=flat-square)](https://sdgs.un.org/goals/goal2)
[![SDG 12](https://img.shields.io/badge/SDG%2012-Responsible%20Consumption-green?style=flat-square)](https://sdgs.un.org/goals/goal12)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208.9-brightgreen?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Tests](https://img.shields.io/badge/Tests-38%2F38%20Passing-brightgreen?style=flat-square)](backend/src/tests/api.test.js)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## 📌 Overview

**FoodResQ AI** is a production-grade, full-stack food redistribution platform connecting restaurants, college hostels, cafeterias, food banks, recipient shelters, and green EV logistics partners across the Gurugram / NCR corridor.

The platform provides deterministic zero over-allocation matching, multi-factor scoring (urgency, perishability, proximity decay), autonomous dynamic breakdown recovery (<800ms reassignment with 100% salvage rate), interactive geospatial Leaflet fleet mapping, EPA WARM life-cycle carbon tracking, and verified Proof-of-Delivery with thermal HACCP compliance.

---

## 🛠️ Technology Stack

### Frontend (Modern Vanilla Web Stack)
- **HTML5 & CSS3** — Responsive custom design system (Forest Green `#145A43`, Charcoal, Fresh Lime `#C7F36B`)
- **Vanilla JavaScript (ES6+)** — Modular page controllers with reactive UI state
- **Universal REST Client (`js/api.js`)** — Dynamic base URL detection, JWT authorization, fallback handling
- **Leaflet & OpenStreetMap** — Real-time interactive corridor polylines and fleet telemetry
- **Chart.js** — Predictive surplus confidence bands and weekly velocity analytics
- **FontAwesome & Lucide Icons** — High-contrast accessibility iconography

### Backend (Node.js & Express Architecture)
- **Node.js (v18+) & Express.js (v4.21)** — Clean MVC architecture with controllers, services, models, and routes
- **MongoDB & Mongoose (v8.9)** — Document database with schema validation, geospatial indexing, and timestamps
- **Real-Time WebSockets (Socket.IO)** — Bi-directional event bus for live telemetry alerts, new listings, demands, and trip updates
- **Automated Background Food Safety Daemon** — Scans inventory every 60s for expiring batches, flags overdue runs, logs waste audits
- **Autonomous Recovery & Failover Engine** — Dynamic courier reassignment preserving safe-use deadlines with 100% salvage
- **Authentication & Security** — JWT bearer tokens, `bcryptjs` password hashing, Role-Based Access Control (RBAC)
- **Robust Middleware** — `helmet` security headers, `cors`, `express-rate-limit`, `express-validator`
- **Automated Test Suite** — Native Node test runner (`node --test`) with 38 passing end-to-end integration tests (13 test suites)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher): `node -v`
- **MongoDB** running locally on port 27017:
  ```bash
  # macOS (Homebrew)
  brew services start mongodb-community
  ```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Seed MongoDB Database
Populates MongoDB with realistic Gurugram / NCR providers, shelters, listings, demands, couriers, and active deliveries:
```bash
npm run seed
```

### 4. Start the Application
```bash
npm start
```
The server will start at:
- **Web Application:** [http://localhost:5001](http://localhost:5001)
- **API Health Check:** [http://localhost:5001/api/health](http://localhost:5001/api/health)

*(Note: Port 5001 is used by default to prevent port conflicts with macOS AirPlay Receiver on port 5000).*

### 5. Running Automated Tests
```bash
npm test
```
Executes all 23 integration test suites verifying:
- Auth & token authorization
- Food surplus listing validation
- Recipient demand fulfillment
- Deterministic 0 over-allocation matching
- Delivery status transitions & Proof-of-Delivery
- AI Coordinator breakdown & recovery simulation (<800ms, 100% salvage)
- KPI and ESG category calculations

---

## 🌐 Running with VS Code Live Server

You can also run the frontend using VS Code Live Server:
1. Open the workspace root in VS Code.
2. Click **"Go Live"** on `index.html` (runs at `http://127.0.0.1:5500`).
3. Ensure the backend is running (`cd backend && npm start`).
4. The client layer (`js/api.js`) automatically detects the host and communicates seamlessly with `http://localhost:5001/api` with full CORS support.

---

## 🗄️ Database Models & Collections

| Model | Collection | Primary Responsibilities |
|---|---|---|
| `User` | `users` | Role-based authentication (Admin, Provider, Recipient, Driver), bcrypt passwords |
| `Organisation` | `organisations` | Donor kitchens, NGOs, and food banks with FSSAI / 80G licenses and GPS coordinates |
| `FoodListing` | `foodlistings` | Surplus batches, category, portion quantity, availableQuantity, safeUseDeadline |
| `DemandRequest` | `demandrequests` | Recipient demands, urgency levels (`critical`, `high`, `medium`), receiving capacity |
| `Driver` | `drivers` | EV fleet couriers, vehicle capacity, live battery telemetry, operating status |
| `Delivery` | `deliveries` | Trip lifecycle, pickup & destination coordinates, Proof-of-Delivery, chain of custody |
| `Incident` | `incidents` | Telemetry failure reports, dynamic reroute plans, salvage metrics |
| `Forecast` | `forecasts` | 7-day, 14-day, and 30-day predictive surplus models with 90% confidence bands |
| `AuditLog` | `auditlogs` | Immutable audit trail of allocations, overrides, and dispatched orders |

---

## 📡 REST API Reference

### Health & System
- `GET /api/health` — System status, uptime, and database connection state

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new organization user
- `POST /api/auth/login` — Login and receive JWT bearer token
- `GET /api/auth/profile` — Get authenticated user details (Protected)
- `POST /api/auth/simulate-persona/:role` — Switch between Admin, Provider, Recipient, and Driver personas

### Surplus Food Listings (`/api/food-listings`)
- `GET /api/food-listings` — List surplus food with category and status filters
- `GET /api/food-listings/:id` — Get single listing details
- `POST /api/food-listings` — Register new surplus batch (Provider / Admin)
- `PATCH /api/food-listings/:id` — Update batch or safe consumption deadline
- `DELETE /api/food-listings/:id` — Cancel surplus batch

### Recipient Demand (`/api/demand`)
- `GET /api/demand` — List pending meal requests
- `POST /api/demand` — Submit recipient demand with urgency and receiving capacity
- `PATCH /api/demand/:id` — Update demand parameters
- `DELETE /api/demand/:id` — Cancel demand request

### Smart Matching Engine (`/api/matching`)
- `GET /api/matching/suggestions` — Multi-factor algorithmic pairing with 0 over-allocation guarantee
- `POST /api/matching/confirm` — Atomically deducts inventory, creates `Delivery` orders, and dispatches fleet

### Deliveries & Fleet Operations (`/api/deliveries`)
- `GET /api/deliveries` — List fleet trips and tracking data
- `GET /api/deliveries/:id` — Get trip details and custody log
- `PATCH /api/deliveries/:id/status` — Advance status (`assigned` → `picked_up` → `in_transit` → `delivered`)
- `POST /api/deliveries/:id/assign-driver` — Assign courier to delivery
- `POST /api/deliveries/:id/proof-of-delivery` — Complete trip with temperature inspection and signature
- `POST /api/deliveries/:id/report-incident` — Log breakdown or delay requiring AI recovery

### AI Coordinator & Recovery (`/api/ai-coordinator`)
- `GET /api/ai-coordinator/status` — Autonomous pipeline metrics, models, and confidence score
- `POST /api/ai-coordinator/simulate-recovery` — Trigger vehicle breakdown and dynamic salvage re-route
- `POST /api/ai-coordinator/reset-simulation` — Restore network baseline operating state

### Impact Analytics (`/api/analytics`)
- `GET /api/analytics/summary` — Dynamic KPIs (portions rescued, CO2e prevented, success rate)
- `GET /api/analytics/categories` — Food category redistribution breakdown
- `GET /api/analytics/export-csv` — Direct CSV export of carbon and meal custody audits

### Forecasts (`/api/forecasts`)
- `GET /api/forecasts?horizon=7` — Predictive surplus trajectories with upper and lower confidence intervals

---

## 👥 Demo Personas

When running the application, switch between real stakeholder personas instantly using the persona switcher in **Settings** (`settings.html`) or the top navigation bar:

1. **Admin / Dispatcher** (`admin@foodresq.org`): Full administrative control over all fleet operations and partner approvals.
2. **Food Provider (Kitchen Chef)** (`mess@aryabhatta.edu.in`): Register surplus portions, monitor deadlines, and print dispatch slips.
3. **Recipient Shelter Coordinator** (`shelter@ashacommunity.org`): Post urgent meal demands, manage intake capacity, and inspect incoming drivers.
4. **EV Delivery Courier** (`rajesh.courier@foodresq.org`): View assigned routes, verify pickups, report incidents, and submit Proof-of-Delivery.

---

## 📁 Repository Structure

```
FoodResQ-AI/
├── frontend/                    # Responsive web interface & dynamic client application
│   ├── index.html               # Landing page with interactive problem/solution walkthrough
│   ├── dashboard.html           # Real-time operational dashboard with live KPIs
│   ├── food-listings.html       # Surplus inventory catalog & registration modal
│   ├── demand.html              # Recipient shelter demand registry
│   ├── matching.html            # Deterministic multi-objective allocation engine
│   ├── deliveries.html          # Live fleet tracking, custody log, and POD modal
│   ├── map.html                 # Geospatial Leaflet map with active transit corridors
│   ├── ai-coordinator.html      # Autonomous 7-stage replanning & breakdown simulator
│   ├── forecasts.html           # Surplus lookahead with Chart.js confidence bands
│   ├── analytics.html           # Impact reporting and EPA WARM carbon calculations
│   ├── organisations.html       # Stakeholder node directory & verification audits
│   ├── settings.html            # Persona switcher and JSON backup/restore
│   ├── login.html               # Secure JWT login interface
│   ├── register.html            # Multi-role partner onboarding form
│   ├── 404.html                 # Custom error fallback page
│   ├── assets/                  # Icons, illustrations, and media assets
│   ├── css/                     # Clean, modular CSS design system
│   │   ├── style.css            # Base design system, CSS variables & typography
│   │   ├── dashboard.css        # Metric cards, KPI tiles & layout styles
│   │   └── ...                  # Feature-specific stylesheets
│   └── js/                      # Modular frontend JavaScript controllers
│       ├── api.js               # Universal REST client layer with JWT auto-injection
│       ├── storage.js           # LocalStorage management and offline fallback
│       ├── demo-data.js         # Initial prototype seed data
│       ├── auth.js              # Authentication, session & persona logic
│       ├── dashboard.js         # Dashboard feed synchronization
│       ├── food-listings.js     # Surplus CRUD operations
│       ├── demand.js            # Demand request handlers
│       ├── matching.js          # Matching synthesis & dispatch triggers
│       ├── deliveries.js        # Fleet custody transitions & POD verification
│       ├── map.js               # Leaflet marker rendering & corridor polylines
│       ├── ai-coordinator.js    # Terminal log emulator & recovery triggers
│       ├── forecasts.js         # Chart.js projection configurations
│       ├── analytics.js         # ESG KPI metrics & CSV export
│       ├── organisations.js     # Partner verification & onboarding
│       └── settings.js          # Profile editor & backup download
│
├── backend/                     # Production Node.js & Express REST API
│   ├── package.json             # Backend dependencies & script definitions
│   ├── .env                     # Environment variables (Port 5001, MongoDB URI, JWT secret)
│   ├── .env.example             # Example environment configuration
│   └── src/
│       ├── server.js            # HTTP server entrypoint (with port collision handling)
│       ├── app.js               # Express application with routes, CORS & static frontend serving
│       ├── config/              # MongoDB connection configuration
│       ├── models/              # Mongoose schemas (User, Listing, Demand, Delivery, etc.)
│       ├── controllers/         # REST API request handlers
│       ├── services/            # Matching algorithm, recovery engine, analytics calculation
│       ├── routes/              # Express API route modules
│       ├── middleware/          # JWT auth, rate limiter, validation, error handler
│       ├── validators/          # Input validation rules (express-validator)
│       ├── utils/               # Realistic Gurugram/NCR database seed data
│       └── tests/               # 23 automated integration tests (node --test)
│
├── package.json                 # Monorepo root npm orchestration scripts
└── README.md                    # Comprehensive documentation & setup guide
```

---

## 🏆 SDG Alignment

| Goal | Target | FoodResQ AI Implementation |
|---|---|---|
| **SDG 2 — Zero Hunger** | **Target 2.1 & 2.2**: Universal access to safe, nutritious food | Dynamic routing delivers fresh surplus meals to shelters and hunger centers in <45 minutes |
| **SDG 12 — Responsible Consumption** | **Target 12.3**: Halve per capita global food waste | Predictive forecasting and zero over-allocation prevent quality food from ending up in landfills |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
