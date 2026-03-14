# StockSense AI

AI-powered inventory intelligence and supplier decision support system for small Indian retail (kirana) stores.

**Senior Design Project** — VIT-AP University | Vyshakh Vijayan

---

## Overview

StockSense AI automates the entire inventory management pipeline — from tracking stock levels and predicting stockouts, to generating AI-powered reorder suggestions and scoring suppliers. It runs on **n8n workflow automation** with **Groq LLM** for intelligence, **Supabase** for the database, and a **React** frontend.

### Key Capabilities

- **Real-time inventory tracking** with risk classification (HIGH / MEDIUM / LOW)
- **Stockout date prediction** based on average daily sales
- **AI reorder suggestions** powered by Groq (Llama 3.1 8B)
- **Supplier scoring** with reliability and price metrics
- **WhatsApp alerts** via Twilio for critical stock warnings
- **Automated daily pipeline** (WF-08) that orchestrates all workflows at 8 AM IST
- **CSV bulk import** for rapid product onboarding
- **Quick Update** page for fast stock adjustments
- **Delivery recording** with transaction logging

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React/Vite)                     │
│  Landing ─ Login ─ Onboarding ─ Dashboard ─ Products ─ Alerts   │
│  Reorder ─ Suppliers ─ Reports ─ Quick Update ─ Deliveries      │
│  Settings ─ System Logs ─ Reset Password                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST / Webhooks
┌──────────────────────────▼──────────────────────────────────────┐
│                      n8n Workflow Engine                         │
│  WF-01  Product & Sales Ingestion        (webhook)              │
│  WF-02  Stockout Date Calculator         (API trigger)          │
│  WF-03  Inventory Processing & Alerts    (API trigger)          │
│  WF-04  Stock Risk Classification        (API trigger)          │
│  WF-05  AI Reorder Intelligence (Groq)   (API trigger)          │
│  WF-06  Supplier Scoring                 (API trigger)          │
│  WF-07  WhatsApp Alert Sender (Twilio)   (webhook)              │
│  WF-08  Daily Orchestrator               (8 AM IST schedule)    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ SQL
┌──────────────────────────▼──────────────────────────────────────┐
│                    Supabase (PostgreSQL)                         │
│  Products ─ Suppliers ─ Stock Alerts ─ Reorder Suggestions      │
│  Stock Transactions ─ Daily Snapshots ─ Store Profiles          │
│  System Logs                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer        | Technology                                          |
|-------------|-----------------------------------------------------|
| Frontend    | React 19, Vite 8, Tailwind CSS v4, React Router 7  |
| Backend     | n8n (self-hosted), 8 automated workflows            |
| Database    | Supabase (PostgreSQL), Realtime subscriptions       |
| AI/LLM      | Groq API — Llama 3.1 8B Instant                    |
| Messaging   | Twilio WhatsApp Business API                        |
| Tunneling   | ngrok (for local n8n → public webhook access)       |
| Charts      | Recharts                                            |
| Icons       | Lucide React                                        |

---

## Project Structure

```
├── frontend/                   React SPA
│   ├── src/
│   │   ├── components/         Reusable UI components
│   │   │   ├── Layout.jsx      Sidebar + bottom nav + top bar
│   │   │   ├── ProtectedRoute.jsx  Auth gate + onboarding redirect
│   │   │   ├── AddProductModal.jsx
│   │   │   ├── AddSupplierModal.jsx
│   │   │   ├── CsvImportModal.jsx  CSV parsing and bulk import
│   │   │   ├── EmptyState.jsx
│   │   │   ├── KPICard.jsx
│   │   │   ├── RiskBadge.jsx
│   │   │   └── GradeBadge.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx     Public marketing page
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── ResetPassword.jsx  Supabase auth password reset
│   │   │   ├── Onboarding.jsx  3-step store setup wizard
│   │   │   ├── Dashboard.jsx   KPIs + charts
│   │   │   ├── Products.jsx    CRUD + inline edit + CSV import
│   │   │   ├── QuickUpdate.jsx Batch stock adjustment
│   │   │   ├── Deliveries.jsx  Record incoming deliveries
│   │   │   ├── Alerts.jsx      Stock alerts feed
│   │   │   ├── Reorder.jsx     AI reorder suggestions
│   │   │   ├── Suppliers.jsx   Supplier table with scoring
│   │   │   ├── Reports.jsx     Charts and analytics
│   │   │   ├── Logs.jsx        System logs viewer
│   │   │   └── Settings.jsx    Store profile + workflow triggers
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx  Auth state, session, store profile
│   │   ├── lib/
│   │   │   ├── config.js       n8n webhook/API helpers
│   │   │   ├── helpers.js      Formatting utilities
│   │   │   └── supabase.js     Supabase client
│   │   ├── App.jsx             Route definitions
│   │   └── index.css           Tailwind v4 theme
│   ├── .env.example            Environment variable template
│   ├── package.json
│   └── vite.config.js          Dev server + proxy config
│
├── backend/                    n8n workflow JSON exports
│   ├── WF-01-product-sales-ingestion.json
│   ├── WF-02-stockout-date-calculator.json
│   ├── WF-03-inventory-processing.json
│   ├── WF-04-stock-risk-classification.json
│   ├── WF-05-ai-reorder-intelligence.json
│   ├── WF-06-supplier-scoring.json
│   ├── WF-07-whatsapp-alert-sender.json
│   └── WF-08-daily-orchestrator.json
│
├── database/                   Database documentation
│   ├── schema.sql              Complete CREATE TABLE statements
│   ├── seed.sql                Demo data (6 products, 3 suppliers)
│   ├── demo_reset.sql          Reset script for presentations
│   ├── migrations/             Migration convention docs
│   └── README.md               Schema documentation with ERD
│
└── README.md                   This file
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **n8n** self-hosted instance (Docker or npm)
- **Supabase** project (free tier works)
- **ngrok** for tunneling n8n webhooks (or deploy n8n publicly)
- **Groq API key** for LLM features
- **Twilio** account with WhatsApp sandbox (optional, for alerts)

### 1. Clone and install

```bash
git clone https://github.com/your-repo/AI-Powered-Supply-Chain-Inventory-Intelligence-System.git
cd AI-Powered-Supply-Chain-Inventory-Intelligence-System/frontend
npm install --legacy-peer-deps
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase and n8n credentials
```

Required variables:
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_N8N_BASE_URL` | n8n base URL (ngrok tunnel) |
| `VITE_N8N_API_KEY` | n8n API key for workflow triggers |

### 3. Set up the database

Run `database/schema.sql` in the Supabase SQL Editor to create all tables. Optionally run `database/seed.sql` for demo data.

### 4. Import n8n workflows

Import each JSON file from `backend/` into your n8n instance. Activate all 8 workflows.

### 5. Start development

```bash
npm run dev
```

The app runs at `http://localhost:5173` (strict port).

### 6. Build for production

```bash
npm run build
```

Output goes to `frontend/dist/`.

---

## Workflow Pipeline

The daily pipeline (WF-08) orchestrates the following sequence every morning at 8 AM IST:

```
WF-08 Daily Orchestrator
  ├── WF-02  Calculate stockout dates for all products
  ├── WF-04  Classify risk levels (HIGH/MEDIUM/LOW)
  ├── WF-03  Generate stock alerts for at-risk items
  ├── WF-05  Run AI analysis for reorder suggestions (Groq LLM)
  ├── WF-06  Score all suppliers
  └── WF-07  Send WhatsApp alerts for critical items
```

Individual workflows can also be triggered manually from the Settings page.

---

## Database Schema

8 tables in Supabase PostgreSQL:

| Table | Purpose |
|---|---|
| **Products** | Inventory items with stock levels, pricing, sales data |
| **Suppliers** | Supplier profiles with reliability/price scores |
| **Stock Alerts** | Generated alerts for low-stock items |
| **Reorder Suggestions** | AI-generated reorder recommendations |
| **Stock Transactions** | Delivery and adjustment audit log |
| **Daily Snapshots** | Historical daily stock snapshots |
| **Store Profiles** | Multi-tenant store configuration |
| **System Logs** | Pipeline execution logs |

See `database/README.md` for full schema documentation.

---

## Pages

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page with features and CTA |
| `/login` | Public | Sign in with email/password |
| `/signup` | Public | Create account + store profile |
| `/reset-password` | Public | Password reset via email |
| `/onboarding` | Auth | 3-step store setup wizard |
| `/dashboard` | Auth | KPI cards, stock charts, pipeline health |
| `/products` | Auth | Product CRUD, inline edit, CSV import |
| `/quick-update` | Auth | Batch stock level adjustments |
| `/deliveries` | Auth | Record incoming deliveries |
| `/alerts` | Auth | Stock alert feed with severity |
| `/reorder` | Auth | AI reorder suggestions |
| `/suppliers` | Auth | Supplier table with scoring |
| `/reports` | Auth | Charts and analytics |
| `/logs` | Auth | System log viewer |
| `/settings` | Auth | Store profile, preferences, workflow triggers |

---

## Design System

The UI uses a consistent Tailwind v4 theme defined in `frontend/src/index.css`:

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#1E3A5F` | Sidebar, navbar, primary actions |
| `--color-accent` | `#2563EB` | Buttons, links, active states |
| `--color-success` | `#059669` | Success toasts, LOW risk |
| `--color-warning` | `#D97706` | MEDIUM risk, caution states |
| `--color-danger` | `#DC2626` | HIGH risk, errors, destructive |
| `--color-surface` | `#F8FAFC` | Page background |
| `--color-text` | `#1E293B` | Primary text |
| `--color-muted` | `#64748B` | Secondary text |
| `--color-border` | `#E2E8F0` | Borders, dividers |

Mobile-responsive: sidebar on desktop (lg+), bottom tab bar on mobile.

---

## License

This project is developed as a Senior Design Project at VIT-AP University. All rights reserved.
