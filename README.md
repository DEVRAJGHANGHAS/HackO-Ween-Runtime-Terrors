# 🍱 FoodResQ AI
### Dynamic Food Redistribution Network

> **Predict Surplus. Match Demand. Deliver Before Expiry.**

[![SDG 2](https://img.shields.io/badge/SDG%202-Zero%20Hunger-orange?style=flat-square)](https://sdgs.un.org/goals/goal2)
[![SDG 12](https://img.shields.io/badge/SDG%2012-Responsible%20Consumption-green?style=flat-square)](https://sdgs.un.org/goals/goal12)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow?style=flat-square)

---

## 📌 Overview

**FoodResQ AI** is an intelligent food redistribution platform that connects restaurants, college hostels, cafeterias, food banks, NGOs, recipient organisations, and delivery partners through an AI-powered coordination engine.

The platform identifies surplus food, matches it with recipient demand, coordinates transportation, and monitors delivery progress in real time. When a delivery fails or transport conditions change, the system automatically reassesses the situation and proposes a new feasible distribution plan.

> **Mission:** Reduce avoidable food waste while ensuring available food reaches suitable recipients before its safe-use deadline.

---

## 🌍 Problem Statement

Every day, restaurants, hostels, and cafeterias discard surplus food while NGOs and recipient organisations struggle with insufficient supplies. The absence of a coordinated redistribution network results in:

- 🗑️ Preventable food waste
- ⏱️ Delayed or missed deliveries
- 📉 Inefficient use of transport resources
- 🔍 No real-time visibility into supply vs. demand

Existing manual coordination makes it difficult to compare supply with demand, prioritise urgent deliveries, and respond quickly to unexpected disruptions. **FoodResQ AI** addresses all of these challenges through intelligent matching, resource allocation, delivery monitoring, and adaptive replanning.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔮 **Surplus Prediction** | Forecasts potential food surplus using historical records and provider schedules |
| 🤝 **Intelligent Matching** | Matches food supply with recipient demand using urgency, distance, and capacity constraints |
| 🚗 **Delivery Planning** | Assigns delivery partners based on vehicle capacity, travel time, and availability |
| ♻️ **Adaptive Recovery** | Detects delivery failures and automatically proposes alternative assignments |
| 🗺️ **Live Map Tracking** | Real-time delivery tracking via Leaflet + OpenStreetMap |
| ✅ **Delivery Verification** | Timestamped proof of delivery and recipient acknowledgement |
| 📊 **Impact Dashboard** | Tracks food rescued, meals delivered, waste avoided, and KPIs |
| 🔔 **Real-time Notifications** | Live updates via Socket.IO for all stakeholders |

---

## 👥 User Roles

```
┌─────────────────────────────────────────────────────────┐
│                    FoodResQ AI Platform                 │
├──────────────┬──────────────┬──────────────┬────────────┤
│   Provider   │  Recipient   │   Driver     │   Admin    │
│  (Hostels,   │  (NGOs,      │  (Delivery   │ (Platform  │
│ Restaurants) │ Food Banks)  │  Partners)   │  Manager)  │
└──────────────┴──────────────┴──────────────┴────────────┘
                         ↕ coordinated by ↕
                    🤖 AI Coordination Agent
```

### A. Food Providers
Restaurants, hostels, and cafeterias — register surplus food, quantities, preparation details, pickup locations, and safe-use deadlines.

### B. Recipient Organisations
NGOs, food banks, and authorised organisations — submit demand, preferred delivery windows, and receiving capacity.

### C. Delivery Partners
Drivers — view assignments, accept jobs, update delivery status, and report disruptions.

### D. Administrator
Verify participating organisations, manage users, monitor operations, and review platform-wide performance.

### E. AI Coordination Agent
Analyses supply, demand, urgency, and transport constraints to recommend and revise distribution plans in real time.

---

## 🤖 Agentic AI Architecture

The AI coordination engine follows a continuous planning loop:

```
Observe → Identify → Evaluate → Plan → Validate → Execute → Monitor → Replan
   ↑                                                                      │
   └──────────────────────────────────────────────────────────────────────┘
```

**Agent-accessible tools:**
- Read available food listings and recipient demand
- Check driver availability and vehicle capacity
- Request route and travel-time estimates
- Run the food allocation algorithm
- Create or update delivery assignments
- Send notifications to stakeholders
- Record outcomes and generate impact reports

> **Safety constraint:** The agent cannot invent availability or bypass food-safety requirements. All allocations are validated against hard constraints (quantities, deadlines, capacities, conflicts).

---

## 🛠️ Technology Stack

### Frontend (Pure HTML5 / CSS3 / Vanilla JavaScript)
- **HTML5** — Semantic, responsive layout with role perspectives (Provider, Recipient, Driver, Admin)
- **Modern CSS3** — Sleek dark theme, glassmorphism cards, micro-interactions, responsive grid
- **Vanilla ES6+ JavaScript** — State management, AI matching engine, disruption simulations, countdown tickers
- **Leaflet + OpenStreetMap** — Real-time interactive routing map with custom animated markers & route polylines

### Backend (Pure Java 17 — Zero External Dependencies)
- **Java 17 (`com.sun.net.httpserver`)** — High-performance built-in REST API server & static asset host
- **Deterministic AI Allocation Engine** — Haversine distance matrix, expiry deadlines, vehicle capacity constraints
- **Adaptive Disruption Recovery** — Real-time breakdown interceptor & autonomous standby driver rerouting
- **1-Click Launchers** — `./run.sh` (macOS/Linux) and `run.bat` (Windows)

---

## 🚀 Quick Start (1-Click Run)

### Method 1: Using the Java Server (Recommended)

1. Open your terminal in VS Code:
   ```bash
   ./run.sh
   ```
   *(On Windows, simply double-click `run.bat` or run `run.bat` in Command Prompt)*

2. Your browser will automatically open: **http://localhost:8080**

### Method 2: Direct Browser Execution (Zero Setup)
Simply open `web/index.html` directly in any web browser or via VS Code "Live Server"! The app includes dual-mode architecture that runs seamlessly with client-side state when the Java backend is not active.

---

## 🎯 Hackathon Demonstration Walkthrough

1. **Observe Initial Network:**
   - 120 Portions of hot meal surplus listed from *IIT Delhi Hostel 4 Mess* with 3 hours shelf-life remaining.
   - *Asha Children Welfare Shelter* has a high-urgency demand for 100 portions.
2. **Execute AI Redistribution:**
   - Click **"⚡ Run AI Redistribution Engine"**.
   - The AI Agent calculates the optimal travel matrix (5.9 km), validates safe-use expiry (> 2.5 hrs buffer), and dispatches Driver Ravi Kumar (Van, 150 capacity).
3. **Simulate Breakdown & Adaptive Recovery:**
   - Click **"💥 Simulate Breakdown & Auto-Recover"**.
   - Vehicle transmission failure occurs mid-route. The AI Agent intercepts the incident, verifies food integrity, and autonomously re-assigns the delivery to standby backup driver with revised ETA!
4. **Inspect Decision Stream & Impact:**
   - View the live **AI Decision Stream** terminal with full mathematical reasoning and SDG 2 / SDG 12 impact meters.

---

## 🗄️ Database Collections

```
Users            → account details, roles, permissions
Organisations    → providers, NGOs, food banks, recipients
FoodListings     → type, quantity, storage requirements, deadline
DemandRequests   → requested food, urgency, receiving capacity
Drivers          → availability, location, vehicle capacity
Deliveries       → allocation, assigned driver, route, status
Incidents        → failed assignments, disruptions, recovery actions
DeliveryProofs   → confirmation, timestamps, verification
Forecasts        → historical inputs, predicted surplus, results
AuditLogs        → decisions, changes, completed actions
```

---

## 📊 Key Performance Indicators

The platform tracks and reports:

- 📦 Percentage of available food successfully delivered
- ⏰ Percentage of deliveries completed before the safe-use deadline
- 🕐 Average time from listing to delivery
- 🍽️ Total quantity of food redistributed
- 🔄 Number of failed deliveries recovered through reassignment
- 📈 Forecast accuracy for predicted surplus
- 🚚 Vehicle utilisation and average delivery distance
- ❌ Quantity of food left unallocated or expired

---

## 🗺️ Development Roadmap

```
Phase 1 ──► Planning & Design          ← Requirements, architecture, wireframes
Phase 2 ──► Frontend Development       ← Dashboards, forms, map integration
Phase 3 ──► Backend & Database         ← APIs, auth, event logging
Phase 4 ──► Intelligent Allocation     ← Matching engine, constraint validation
Phase 5 ──► Agentic AI Integration     ← Planning agent, disruption recovery
Phase 6 ──► Forecasting & Analytics    ← Surplus prediction, impact reports
Phase 7 ──► Testing & Deployment       ← End-to-end testing, demo scenario
```

---

## 🎯 Hackathon Demo Scenario

A complete end-to-end demonstration using a controlled test dataset:

1. 🏫 A college hostel registers **120 portions** of surplus food
2. 📋 Multiple NGOs submit demand with different quantities and receiving deadlines
3. 🤖 The AI agent checks demand, vehicle availability, and travel times
4. ✅ The allocation engine generates a **feasible distribution plan**
5. 🚨 One assigned delivery vehicle becomes **unavailable mid-route**
6. 🔄 The agent reassesses affected deliveries and proposes an **alternative assignment**
7. 📍 The system tracks simulated delivery results and flags any food at risk of missing its deadline
8. 📊 The dashboard displays completed deliveries, quantities redistributed, and the recovery impact

> All quantities and outcomes in the demonstration are generated from a controlled test dataset.

---

## 📂 Project Structure

```
foodresq-ai/
├── client/                   # React + Tailwind frontend
│   ├── src/
│   │   ├── components/       # Shared UI components
│   │   ├── pages/            # Role-based page views
│   │   ├── hooks/            # Custom React hooks
│   │   └── services/         # API and socket clients
│   └── public/
├── server/                   # Node.js + Express backend
│   ├── routes/               # REST API endpoints
│   ├── models/               # MongoDB schemas
│   ├── controllers/          # Business logic
│   ├── middleware/            # Auth, validation
│   ├── services/             # Allocation engine, notifications
│   └── agent/                # AI coordination agent & tools
├── ml/                       # Forecasting and optimisation
│   ├── forecasting/          # Surplus prediction model
│   └── allocation/           # Constraint-based matching algorithm
├── docs/                     # Architecture diagrams, API docs
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB ≥ 6
- Python ≥ 3.10 (for ML modules)
- An LLM API key (Gemini / OpenAI)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/foodresq-ai.git
cd foodresq-ai

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install

# Install Python ML dependencies
cd ../ml && pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in `/server`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/foodresq
JWT_SECRET=your_jwt_secret
LLM_API_KEY=your_llm_api_key
ROUTING_SERVICE_URL=http://router.project-osrm.org
```

### Running the App

```bash
# Start backend server
cd server && npm run dev

# Start frontend (new terminal)
cd client && npm run dev
```

---

## 🔮 Future Scope

- 📱 Mobile applications for delivery partners
- 🌐 Multi-city food redistribution networks
- 📡 Live traffic integration and vehicle tracking
- ❄️ Cold-chain and temperature monitoring
- 🔗 Integration with verified food-safety procedures
- 🏙️ Real restaurant and NGO network onboarding
- 🧠 Advanced demand forecasting with external data signals

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss proposed changes, then submit a pull request.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🏆 SDG Alignment

| Goal | Target |
|---|---|
| **SDG 2 — Zero Hunger** | Improve access to food for vulnerable populations through efficient redistribution |
| **SDG 12 — Responsible Consumption** | Reduce food waste at the source through predictive coordination |

---

<div align="center">

**FoodResQ AI** — Transforming food redistribution from manual coordination to an adaptive, data-driven network.

*Built for the Hackathon | Powered by Agentic AI*

</div>
