# 🏥 HealthPilot ERP

A full-stack hospital pharmacy supply chain ERP system tracking the complete lifecycle of pharmaceutical stock: branch requisitions, purchase orders, goods receipts with damage/shortage handling and audit-trail corrections, supplier invoice 3-way matching, inter-location stock transfers, and patient dispensing — with full traceability from request to sale.

**Live Link:** [https://healthpilot-erp.vercel.app](https://healthpilot-erp.vercel.app)

---

## 📚 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Design Patterns Used](#-design-patterns-used)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Database Migrations & Seeding](#-database-migrations--seeding)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Assumptions, Scope & AI Tool Usage](#-assumptions-scope--ai-tool-usage)
- [Development Notes](#-development-notes)
- [License](#-license)

---

## 🎯 Features

- 📋 **Branch Stock Requisitions** — internal stock request workflow from pharmacy branches to central distribution with role-based approval/rejection and location validation
- 🛒 **Purchase Order Issuance** — automated PO generation linked to requisitions, supporting multi-line item ordering, unit price calculation, and tax percent computations
- 📦 **Goods Receipts & Quality Inspection** — physical receipt logging with accepted, damaged, and missing quantity split, batch creation, and automatic stock ledger ledgering
- 🔄 **Append-Only GRN Quality Corrections** — post-receipt physical inspection adjustments that maintain full audit trail history (never mutates or deletes original receipt lines)
- 🧾 **3-Way Invoice Reconciliation** — automated 3-way financial matching comparing PO ordered prices, GRN accepted quantities, and supplier billed amounts with credit note generation for discrepancies
- 🚚 **Inter-Location Stock Transfers** — dispatch and receipt workflow between central warehouse and pharmacy branches with location-scoped receiving permissions and usable stock checks
- 💊 **Point-of-Sale Dispensing** — patient prescription dispensing with payment method tracking, automatic stock deduction, and real-time inventory balance updates
- 📊 **Perpetual Stock Ledger & Positions** — immutable double-entry movement log tracking receipts, transfers, sales, corrections, damaged, and missing stock per batch and location
- 🔎 **End-to-End Audit Trail Traceability** — document chain visualizer linking Requisitions → POs → GRNs → Quality Corrections → Supplier Invoices → 3-Way Reconciliation → Stock Transfers → POS Sales
- 👤 **Interactive Persona Switcher** — header persona selector ("Acting as:") enabling real-time role and location context switching across Branch Users, Purchasing Officers, Warehouse Officers, and Finance Officers
- 🔗 **URL State Persistence** — filter tabs, search terms, selected active personas (`?actingAs=<id>`), and pagination parameters persisted in URL query strings for shareable state
- 🎨 **Centralized CSS Design System** — consistent visual tokens using custom CSS variables, glassmorphism cards, status badges, and smooth micro-animations

---

## ⚙️ Tech Stack

### Core Framework & Application

| Technology | Version | Description |
|---|---|---|
| Next.js | 16.3.4 | Full-stack React framework (App Router & API Routes) |
| React | 19.2.8 | UI library |
| React DOM | 19.2.8 | DOM rendering engine |
| TypeScript | 5.x | Strictly typed JavaScript |

### Data Layer & Database

| Technology | Version | Description |
|---|---|---|
| Drizzle ORM | 0.45.2 | TypeScript ORM for PostgreSQL |
| Drizzle Kit | 0.31.10 | Schema migration & DDL management CLI |
| postgres | 3.4.9 | Native PostgreSQL client driver |
| Supabase | Cloud | Hosted PostgreSQL database engine |

### State, Forms & Data Fetching

| Technology | Version | Description |
|---|---|---|
| TanStack React Query | 5.102.8 | Server state management & caching |
| React Hook Form | 7.87.0 | Form state management |
| @hookform/resolvers | 5.9.1 | Form validation adapter |
| Zod | 4.5.4 | Schema validation |

### UI & Styling

| Technology | Version | Description |
|---|---|---|
| Tailwind CSS | 4.x | Utility-first styling framework |
| Lucide React | 1.41.0 | Icon collection |
| clsx | 2.1.1 | Conditional class joiner |

### Tooling & Environment

| Tool | Version | Description |
|---|---|---|
| Package Manager | npm | Node Package Manager |
| IDE | Antigravity | Development environment |
| Deployment | Vercel | Next.js serverless app hosting |

---

## 🧩 Design Patterns Used

Design patterns were applied strictly where they solved architectural challenges in managing complex supply chain workflows:

| Pattern | Where | Why |
|---|---|---|
| **Repository Pattern** | `src/repositories/` | Isolates all database access logic (Drizzle ORM queries) from business rules, enabling clean data access abstraction across 18 specialized repository modules |
| **Service Layer Pattern** | `src/services/` | Encapsulates domain logic (3-way matching math, append-only correction deltas, usable stock balance calculations) away from Next.js API route handlers |
| **Singleton Pattern** | `src/db/index.ts` | Maintains a single shared PostgreSQL database connection pool instance across serverless execution contexts |

Architectural patterns like CQRS or Event Sourcing were evaluated but intentionally **not** implemented, as an append-only stock movement ledger provided the required audit immutability without unnecessary system complexity.

---

## 📁 Project Structure

```text
healthpilot-erp/
│
├── drizzle/                     # Generated Drizzle ORM SQL migration files
├── public/                      # Static assets and icons
├── src/
│   ├── app/                     # Next.js App Router pages and API routes
│   │   ├── api/                 # REST API route handlers
│   │   │   ├── batches/         # Batches endpoints
│   │   │   ├── employees/       # Employee personas endpoint
│   │   │   ├── goods-receipts/  # GRN & correction endpoints
│   │   │   ├── invoices/        # Supplier invoices & 3-way match endpoints
│   │   │   ├── locations/       # Master locations endpoint
│   │   │   ├── products/        # Master medication products endpoint
│   │   │   ├── purchase-orders/ # Purchase orders endpoints
│   │   │   ├── requisitions/    # Stock requisitions & approval endpoints
│   │   │   ├── sales/           # Pharmacy POS sales endpoint
│   │   │   ├── stock-ledger/    # Stock ledger audit & position summary endpoints
│   │   │   ├── stock-transfers/ # Inter-location transfers endpoints
│   │   │   ├── suppliers/       # Master suppliers endpoint
│   │   │   └── traceability/    # Supply chain audit trail endpoint
│   │   ├── goods-receipts/      # Goods Receipts page
│   │   ├── invoices/            # Invoices & 3-Way Matching page
│   │   ├── purchase-orders/     # Purchase Orders page
│   │   ├── requisitions/        # Stock Requisitions page
│   │   ├── sales/               # Pharmacy POS Sales page
│   │   ├── stock-ledger/        # Stock Ledger & Positions page
│   │   ├── stock-transfers/     # Stock Transfers page
│   │   ├── traceability/        # Traceability & Audit Trail page
│   │   ├── globals.css          # CSS design tokens and theme variables
│   │   ├── layout.tsx           # App root layout with Navigation Sidebar & Header
│   │   ├── page.tsx             # Executive ERP Overview Dashboard
│   │   └── providers.tsx        # React Query & Context providers wrapper
│   ├── components/              # UI Component library
│   │   ├── ui/                  # Reusable primitives (Card, Table, Modal, CustomSelect, Badge, Button, Loader)
│   │   ├── EmployeeSelector.tsx # Active persona topbar switcher component
│   │   ├── Navbar.tsx           # Top navigation bar
│   │   └── Sidebar.tsx          # Navigation sidebar
│   ├── context/                 # React Contexts (ActiveEmployeeContext, ToastContext)
│   ├── db/                      # Database configuration, Drizzle schema, seed script
│   │   ├── index.ts             # Database client connection (Singleton)
│   │   ├── schema.ts            # Drizzle relational PostgreSQL database schema
│   │   └── seed.ts              # Idempotent database seed script
│   ├── hooks/                   # Custom React hooks (useEmployees, useRequisitions, etc.)
│   ├── lib/                     # Utility functions (currency formatter, date formatter, clsx helper)
│   ├── repositories/            # Data access layer (18 repository modules)
│   ├── services/                # Business logic layer (9 service modules)
│   ├── styles/                  # Custom theme and component stylesheets
│   ├── types/                   # Shared TypeScript domain models & interfaces
│   └── validators/              # Zod validation schemas
├── drizzle.config.ts            # Drizzle Kit migration configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # TypeScript configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Supabase PostgreSQL Database (or local Postgres) | — |

### Clone the Repository

```bash
git clone https://github.com/Vishwanathangit/Healthpilot-ERP.git
cd Healthpilot-ERP
```

### Install Dependencies

```bash
npm install
```

---

## 🌍 Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Transaction Pooled Connection (port 6543) for runtime queries
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (port 5432) for Drizzle Kit migrations & DDL
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Transaction pooled connection string used by the application at runtime |
| `DIRECT_URL` | Direct database connection string required for executing Drizzle Kit DDL migrations |

---

## ▶️ Running the Application

```bash
npm run dev        # Start Next.js development server with Turbopack
npm run build      # Compile production build
npm run start      # Start production server
npm run lint       # Run ESLint check
```

The application runs locally on: `http://localhost:3000`

---

## 🗄️ Database Migrations & Seeding

### Execute Migrations & Seed Data

```bash
# Generate SQL migration files from schema definition
npm run db:generate

# Apply migrations to PostgreSQL database
npm run db:migrate

# Seed master locations, products, suppliers, and employee personas
npm run db:seed

# (Optional) Open Drizzle Studio visual database inspector
npm run db:studio
```

---

## 📡 API Endpoints

### Base URL

- **Local development:** `http://localhost:3000/api`
- **Production:** `https://<your-deployed-domain>.vercel.app/api`

### Core Supply Chain Routes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/requisitions` | Fetch internal stock requisitions (supports optional `locationId` filter) |
| `POST` | `/api/requisitions` | Create a new branch stock requisition |
| `POST` | `/api/requisitions/:id/approve` | Approve a pending stock requisition (Purchasing Officer) |
| `POST` | `/api/requisitions/:id/reject` | Reject a pending stock requisition (Purchasing Officer) |
| `GET` | `/api/purchase-orders` | Fetch purchase orders with status filtering |
| `POST` | `/api/purchase-orders` | Generate a new supplier purchase order from approved requisitions |
| `GET` | `/api/goods-receipts` | Fetch Goods Receipt Notes (GRNs) |
| `POST` | `/api/goods-receipts` | Record physical goods receipt with accepted/damaged/missing breakdown |
| `POST` | `/api/goods-receipts/corrections` | Record an append-only quality audit correction for a GRN line |
| `GET` | `/api/invoices` | Fetch supplier invoices and 3-way match reconciliation results |
| `POST` | `/api/invoices` | Record a supplier invoice and perform automated 3-way matching |
| `GET` | `/api/stock-transfers` | Fetch inter-location stock transfers |
| `POST` | `/api/stock-transfers` | Dispatch inventory transfer from warehouse or branch |
| `POST` | `/api/stock-transfers/:id/receive` | Receive stock transfer into destination branch inventory |
| `GET` | `/api/sales` | Fetch pharmacy point-of-sale dispensing records |
| `POST` | `/api/sales` | Dispense medication to patient and deduct stock ledger |
| `GET` | `/api/stock-ledger` | Fetch paginated perpetual stock movement audit log |
| `GET` | `/api/stock-ledger/summary` | Fetch live usable inventory balances grouped by location and batch |
| `GET` | `/api/stock-ledger/position` | Fetch system-wide stock position summary (usable, damaged, missing, sales) |
| `GET` | `/api/traceability/:reqId` | Fetch full end-to-end audit trail tree for a specific requisition |

### Master Data Routes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/locations` | Fetch master pharmacy branch and warehouse locations |
| `GET` | `/api/products` | Fetch master medication products catalog |
| `GET` | `/api/suppliers` | Fetch master pharmaceutical suppliers list |
| `GET` | `/api/batches` | Fetch master drug batch records |
| `GET` | `/api/employees` | Fetch active employee personas for switching context |

---

## ☁️ Deployment

HealthPilot ERP is deployed as a single unified Next.js application on **Vercel** backed by a **Supabase PostgreSQL** database instance.

### Deployment Architecture

- **Application & API**: Next.js serverless app hosting on Vercel, deploying both React pages and serverless API route handlers under a single domain.
- **Database Engine**: Hosted PostgreSQL instance on Supabase utilizing connection pooling (`DATABASE_URL`) for runtime queries and direct connections (`DIRECT_URL`) for DDL schema migrations.

---

## 📝 Assumptions, Scope & AI Tool Usage

### System Scope & Architectural Assumptions

1. **Global Data Visibility across Branches**:
   - Master data, inventory positions, and document records are visible enterprise-wide to allow seamless cross-branch stock transfers, audit inspection, and supply chain tracking. Role-based restrictions are applied strictly to **business write actions** (e.g., requisition approvals are restricted to Purchasing Officers, transfer receipts are restricted to destination branch staff), rather than artificially obscuring read access between locations.
2. **Append-Only Quality Audit Corrections**:
   - Physical inspection discrepancies discovered after GRN entry do not overwrite historical receipt records. Instead, corrections are logged as append-only linked entries (`goods_receipt_corrections`), ensuring compliance with DSCSA and FDA audit trail guidelines.
3. **Persona-Based Context Switcher**:
   - In accordance with project scope (which prioritizes supply chain domain mechanics over auth infrastructure), authentication is handled via a topbar employee persona selector rather than a traditional username/password login wall.

### AI Tooling & Third-Party Libraries

- **AI Assistants**: Claude (for domain model planning, workflow architecture, and prompts) paired with **Antigravity IDE** (for autonomous code execution, file edits, and browser-subagent verification).
- **Core Libraries**: Supabase (Postgres database hosting), Drizzle ORM (database driver and migrations), TanStack React Query (server state management), Zod (schema validation), Lucide React (icons), and Tailwind CSS (styling).

### Scope Exclusions & Trade-Offs

- **Production Authentication Hardening**: OAuth/JWT login walls were excluded in favor of instant persona switching (`?actingAs=<id>`), focusing effort on complex supply chain mechanics (3-way matching, double-entry stock ledgering, quality correction deltas).
- **PO Cancellations**: Purchase order lifecycle focuses on active procurement (`open` → `partially_received` → `completed`).

### References & Domain Standards

- Modeled after standard hospital pharmacy ERP procurement lifecycles (**Requisition → Purchase Order → Goods Receipt Note → 3-Way Match & Supplier Invoice → Inter-Branch Transfer → Point-of-Sale Dispensing**).

---

## 🛠️ Development Notes

- **Append-Only Audit Immutability**: Historical records in `goods_receipt_lines` are never deleted or modified when quality inspection discrepancies are detected. Instead, new correction delta records are appended to `goods_receipt_corrections`, and current net accepted stock is computed dynamically.
- **Perpetual Double-Entry Stock Ledger**: All inventory movements write transactional ledger entries (`receipt`, `correction`, `transfer_out`, `transfer_in`, `sale`, `damaged`, `missing`). Current usable stock is calculated dynamically via `stockLedgerService.getUsableStock()`.
- **Server State Management with TanStack Query**: Server state caching and revalidation are managed with TanStack React Query, keeping client-side state minimal and avoiding heavy global state stores.
- **URL Query String Synchronization**: Active persona IDs (`?actingAs=1`) and page filter parameters are synchronized directly with the URL query string, enabling deep linking and persistent page refreshes.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

```text
MIT License

Copyright (c) 2026 Vishwanathan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
