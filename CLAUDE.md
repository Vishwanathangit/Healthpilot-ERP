# HealthPilot ERP — Developer & AI Assistant Context

## Project Overview
HealthPilot ERP is a full-stack hospital pharmacy supply chain ERP system built to manage and trace the complete lifecycle of pharmaceutical stock. It tracks branch requisitions, purchase orders, goods receipts (with damage/shortage handling and append-only audit corrections), 3-way invoice matching, inter-location stock transfers, and patient dispensing—providing end-to-end audit trail traceability from requisition to POS sale.

## Tech Stack
- **Framework & Language**: Next.js 16 (App Router) with React 19 & TypeScript (Strict Mode).
- **Database & ORM**: PostgreSQL (Supabase) via Drizzle ORM.
- **State Management**: TanStack Query (`@tanstack/react-query`) for server state caching/mutations; React Context (`EmployeeContext`) for the single piece of global client state (`activeEmployee`).
- **Styling & UI**: Tailwind CSS v4 using CSS-variable design tokens defined in `src/styles/globals.css` / `src/app/globals.css` (no hardcoded color hexes). UI primitives built on top of Radix UI / shadcn design patterns located in `src/components/ui/`.

## Architecture & Layering Rules
The codebase strictly adheres to a three-tier architecture within Next.js App Router:
1. **Route Handlers (`src/app/api/*`)**: Thin API entry points. Perform request parameter parsing/serialization and return HTTP responses. **MUST NOT contain business logic or direct database queries.**
2. **Services (`src/services/*`)**: Business logic, workflow rules, calculations (e.g., tax calculation, 3-way invoice discrepancy matching, correction deltas, COGS). **All business logic lives here.**
3. **Repositories (`src/repositories/*`)**: Data access layer using Drizzle ORM. Handles database reads, writes, joins, and raw queries. **MUST NOT contain business logic.**
4. **Database Schema (`src/db/schema.ts`)**: Authoritative Drizzle table, relation, and enum definitions.

## Key Domain Concepts & Architectural Invariants

### 1. Append-Only Goods Receipts & Corrections
- `goods_receipt_lines` is **APPEND-ONLY**. Never UPDATE or DELETE records in `goods_receipt_lines`.
- Corrections are created as new linked records in `goods_receipt_corrections` referencing `goodsReceiptLineId`.
- The current effective usable/damaged/missing quantities for any GRN line are resolved dynamically from the **LATEST correction record** if present; otherwise, the original GRN line quantities apply.

### 2. Append-Only Stock Ledger
- `stock_ledger` is **APPEND-ONLY** and serves as the single source of truth for all location-specific batch inventory balances.
- Stock balances are **NEVER** calculated by directly summing transaction tables in the UI. Always query inventory balances via `stockLedgerService` / `/api/stock-ledger/summary`.

### 3. "Acting As" Employee Context vs. Security & RBAC
- The **"Acting As" (Active Employee)** selector stored in React Context and passed via URL query params (`?employeeId=...`) is **NOT an authentication system**.
- Data visibility is **GLOBAL** — all active employees can view all requisitions, POs, inventory, and transfers regardless of branch location (deliberate requirement for cross-facility transparency).
- Action execution is **RBAC-gated** based on the active employee's role and location:
  - Requisition approval/rejection requires the `purchasing` role.
  - Receiving stock transfers requires `activeEmployee.locationId === transfer.destinationLocationId`.

### 4. URL-Driven Filter & Employee State
- All filter tab selections, pagination states, and active employee context are persisted directly in URL search parameters (`useSearchParams`, `router.replace` from `next/navigation`) to allow direct URL sharing and reload persistence without `localStorage`.

## Coding Conventions
- **No Hardcoded Hex Colors**: Always consume CSS variables (e.g., `var(--color-surface)`, `var(--color-primary)`) or Tailwind utility classes tied to theme tokens.
- **Inline Validation Errors**: Forms must display clear, styled inline error messages under input fields (e.g., via Zod validation schemas). **DO NOT** use browser native HTML `required` tooltips.
- **Reusable Components**: Shared UI primitives (buttons, dialogs, badges, inputs, custom selects) live in `src/components/ui/`. Reuse existing primitives; do not duplicate page-specific styled components.
- **TypeScript Strictness**: Maintain strict typing throughout the project. Avoid using `any`.

## Development Setup & Workflow
1. **Dependencies**: `npm install`
2. **Environment Variables**: Create `.env.local` with Supabase connection URIs:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   ```
3. **Database Setup**:
   - `npm run db:migrate` (runs Drizzle migrations)
   - `npm run db:seed` (populates master products, suppliers, locations, employees, and initial stock)
4. **Development Server**: `npm run dev` (runs Next.js on `http://localhost:3000`)

## Prohibited Patterns & Anti-Goals
- **DO NOT** add a traditional user login / password authentication system (out of scope; active employee switcher is intentional).
- **DO NOT** restrict data visibility or filter table rows by branch location (visibility is deliberately global).
- **DO NOT** build a Purchase Order cancellation feature unless explicitly instructed.
- **DO NOT** bypass service or repository layers by querying Drizzle directly inside `src/app/api/*` or UI components.
