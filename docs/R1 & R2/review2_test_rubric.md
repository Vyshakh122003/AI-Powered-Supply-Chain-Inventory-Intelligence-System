# StockSense AI — Review 2 Test Rubric

> **Purpose:** End-to-end testing checklist to validate every feature before Review 2.
> **Date:** 26 March 2026 · **Reviewer:** Vyshakh Vijayan

---

## Prerequisites

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Node.js 18+ installed | ☐ |
| 2 | n8n running on `localhost:5678` | ☐ |
| 3 | ngrok tunnel active and URL noted | ☐ |
| 4 | `.env` updated with current ngrok URL in `VITE_N8N_BASE_URL` | ☐ |
| 5 | All 8 n8n workflows imported and **activated** | ☐ |
| 6 | WF-08 Execute Workflow nodes configured with correct internal IDs | ☐ |
| 7 | Supabase Realtime enabled for: Products, Stock Alerts, Reorder Suggestions, Daily Snapshots, Suppliers | ☐ |
| 8 | Twilio WhatsApp sandbox opted-in (text `join <sandbox-word>` from demo phone) | ☐ |
| 9 | `npm run dev` starts without errors on `localhost:5173` | ☐ |

---

## Phase 0 — Database Full Cleanup

> Run these steps in the **Supabase Dashboard → SQL Editor** to start from a completely clean slate.

### 0A. Nuclear Reset (Clean Everything)

Use this ONLY if you want a completely fresh start, as if the app was just deployed.

```sql
-- ⚠️ CAUTION: This deletes ALL data. Only users/auth are preserved.
BEGIN;

TRUNCATE "Stock Alerts"          CASCADE;
TRUNCATE "Reorder Suggestions"   CASCADE;
TRUNCATE "Daily Snapshots"       CASCADE;
TRUNCATE "Stock Transactions"    CASCADE;
TRUNCATE "System Logs"           CASCADE;
TRUNCATE "Products"              CASCADE;
TRUNCATE "Suppliers"             CASCADE;

-- Reset onboarding so the app shows the setup wizard again
UPDATE "Store Profiles" SET onboarding_completed = false;

COMMIT;
```

### 0B. Demo Reset (Preserve Seed Data)

Use this if you want to keep the 6 demo products and 3 demo suppliers but clear all generated data. Run `database/demo_reset.sql` in the SQL Editor.

After either reset, verify:
- [ ] `Products` table has 0 rows (nuclear) or 6 rows (demo reset)
- [ ] `Suppliers` table has 0 rows (nuclear) or 3 rows (demo reset)
- [ ] `Stock Alerts`, `Reorder Suggestions`, `Stock Transactions`, `Daily Snapshots`, `System Logs` all have 0 rows

---

## Phase 1 — Authentication & Onboarding

### TC-1.1 Landing Page

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Navigate to `localhost:5173` | Landing page loads with StockSense branding, Login & Sign Up buttons | ☐ |
| 2 | Click "Login" button | Navigates to `/login` | ☐ |
| 3 | Click "Sign Up" button | Navigates to `/signup` | ☐ |

### TC-1.2 Sign Up Flow

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Enter valid email + password (min 6 chars) + store name | Account created. Redirected to `/onboarding` | ☐ |
| 2 | Try signing up with same email | Error toast: email already registered | ☐ |
| 3 | Try signing up with password < 6 chars | Validation error shown | ☐ |

### TC-1.3 Onboarding Wizard (3 Steps)

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | **Step 1 — Store Details:** Enter store name, select store type, select city | "Next" button becomes enabled | ☐ |
| 2 | **Step 2 — Owner Details:** Enter owner name, phone, WhatsApp numbers | Can proceed to next step | ☐ |
| 3 | **Step 3 — Preferences:** Set safety factor (1.5), default lead days (3) | "Finish Setup" button visible | ☐ |
| 4 | Click "Finish Setup" | Toast: "Store setup complete!" → Redirected to `/dashboard` | ☐ |
| 5 | Revisit `/onboarding` after completion | Auto-redirected to `/dashboard` (guard works) | ☐ |

### TC-1.4 Login / Logout

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Log out (sidebar/nav) | Redirected to `/login` | ☐ |
| 2 | Log in with valid credentials | Redirected to `/dashboard` | ☐ |
| 3 | Try accessing `/dashboard` without login | Redirected to `/login` | ☐ |
| 4 | Session persists on page refresh | Dashboard still accessible, no re-login | ☐ |

### TC-1.5 Password Reset

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Click "Forgot Password" on login page | Navigates to reset page | ☐ |
| 2 | Enter registered email, click "Send Reset Link" | Success toast. Check email for magic link | ☐ |
| 3 | Click magic link in email | Opens `/reset-password` route | ☐ |
| 4 | Enter new password + confirm, submit | Password updated. Can log in with new password | ☐ |

---

## Phase 2 — Supplier Management

> Suppliers must be added BEFORE products (products reference suppliers).

### TC-2.1 Add Supplier

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Navigate to `/suppliers`. Click "Add Supplier" | Modal opens with form fields | ☐ |
| 2 | Enter: Name="Fresh Dairy Co.", Contact="Rajesh", Phone="919876543210", Delivery=4, Reliability=9/10, Price=8/10, Categories="dairy,beverages" | All fields accept input correctly | ☐ |
| 3 | Click "Add Supplier" in modal | Toast: "Supplier added". Modal closes. Supplier appears in the table | ☐ |
| 4 | Add 2 more suppliers (e.g., "Metro Wholesale", "City Distributors") | All 3 appear in table sorted by composite score | ☐ |

### TC-2.2 Supplier Table Display

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | View supplier table | Columns visible: Supplier, Grade, Score, Reliability, Price, Delivery, Categories, Actions | ☐ |
| 2 | Grade badges show (A/B/C/D) | Correct color-coded grade badges displayed | ☐ |
| 3 | Reliability/Price shown as X/10 format | e.g. "9.0/10" — not raw 0.9 | ☐ |
| 4 | Supplier Performance summary bar chart visible (top 5) | Score bars rendered with correct colors | ☐ |

### TC-2.3 Edit Supplier

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Click pencil icon on a supplier row | Row becomes editable (inline inputs for name, delivery, categories) | ☐ |
| 2 | Change delivery_time_days from 4 to 2, click checkmark | Toast: "Supplier updated". Row returns to view mode with new value | ☐ |
| 3 | Click X button during edit | Edit cancelled, original values restored | ☐ |

### TC-2.4 Delete Supplier

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Click trash icon on a supplier | Confirmation modal appears | ☐ |
| 2 | Click "Cancel" | Modal closes. Supplier still exists | ☐ |
| 3 | Click "Delete" | Toast: "Supplier deleted". Supplier removed from table | ☐ |

---

## Phase 3 — Product Management

### TC-3.1 Add Product (via Modal)

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Navigate to `/products`. Click "Add Product" | AddProductModal opens | ☐ |
| 2 | Fill: Product ID="MILK_001", Name="Milk 1L", Category="Dairy", Stock=50, Price=30, Avg Daily Sales=5, Threshold=15, Supplier=Fresh Dairy Co. | All fields accept input | ☐ |
| 3 | Submit | Toast: "Product added". Product appears in table. Modal closes | ☐ |
| 4 | Add ~5 more products with varying stock levels (some HIGH risk, some LOW) | All products appear correctly in table | ☐ |

### TC-3.2 Product Table Display

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Products table shows: Product, Category, Supplier, Stock, Threshold, Days to Stockout, Risk, Unit Price, Actions | All columns visible | ☐ |
| 2 | Risk badges show correctly (HIGH=red, MEDIUM=orange, LOW=green) | Color-coded badges displayed | ☐ |
| 3 | Unit prices displayed with ₹ symbol | INR formatting correct | ☐ |
| 4 | Table sorted by days_to_stockout (ascending) by default | Most urgent products appear first | ☐ |

### TC-3.3 Search & Filter

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Type "Milk" in search box | Only milk products shown. Count updates | ☐ |
| 2 | Select "High Risk" from risk dropdown | Only HIGH risk products shown | ☐ |
| 3 | Select a category from category dropdown | Only products in that category shown | ☐ |
| 4 | Toggle "Out of Stock Only" | Only products with stock=0 shown | ☐ |
| 5 | Clear all filters | Full product list restored | ☐ |

### TC-3.4 Inline Edit Product

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Click pencil icon on a product row | Row becomes editable | ☐ |
| 2 | Change current_stock from 50 to 5, click checkmark | Toast: "Product updated". Product webhook fires. Stock updates | ☐ |
| 3 | Verify risk level updates after pipeline processes the change | Risk badge updates (may require pipeline run) | ☐ |

### TC-3.5 Delete Product

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Click trash icon on a product | Browser confirmation dialog appears | ☐ |
| 2 | Click "OK" | Toast: "Product deleted". Product removed from table | ☐ |

### TC-3.6 CSV Import

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Click "Import CSV" button | CsvImportModal opens | ☐ |
| 2 | Upload a valid CSV file with product data | Preview table shows parsed products | ☐ |
| 3 | Click Import | Products bulk-inserted. Toast shows count | ☐ |

### TC-3.7 Pagination

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Add >20 products | Pagination controls appear (Page X of Y) | ☐ |
| 2 | Click next/previous page buttons | Correct page of products loads | ☐ |

---

## Phase 4 — Quick Stock Update

### TC-4.1 Quick Update Flow

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Navigate to `/quick-update` | Product list loads with current stock values and +/- buttons | ☐ |
| 2 | Search for a product by name | List filters correctly | ☐ |
| 3 | Use +/- buttons to change stock for 2 products | Border turns blue, "Save X Changes" button appears | ☐ |
| 4 | Type a number directly in the quantity input | Value updates correctly | ☐ |
| 5 | Click "Save X Changes" | Toast: "Updated X products". Green checkmarks flash. Stock saved to DB | ☐ |
| 6 | Click "Refresh" | Fresh data loads from database | ☐ |
| 7 | Risk badges shown next to products | HIGH/MEDIUM/LOW badges visible with correct colors | ☐ |
| 8 | Verify `Stock Transactions` table has new `manual_update` entries | Transaction logged in Supabase | ☐ |

---

## Phase 5 — Record Delivery

### TC-5.1 Delivery Recording Flow

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Navigate to `/deliveries` | Form loads with supplier dropdown, product line items, notes field | ☐ |
| 2 | Select a supplier from dropdown | Selection works correctly | ☐ |
| 3 | Select product "Milk 1L", enter quantity=100 | Line item filled | ☐ |
| 4 | Click "Add Product" to add another line item | New empty row appears | ☐ |
| 5 | Click trash icon on second line item | Row removed (only if >1 row) | ☐ |
| 6 | Add optional notes "Invoice #1234" | Notes accepted | ☐ |
| 7 | Click "Record Delivery" | Toast: "Recorded delivery for 1 product". Form resets | ☐ |
| 8 | Verify in Supabase: Product stock increased by delivery quantity | `Products.current_stock` updated | ☐ |
| 9 | Verify `Stock Transactions` has new `delivery` entry | Transaction logged with correct quantity | ☐ |
| 10 | Recent Deliveries section shows the new delivery | Product name, quantity, date, new stock level visible | ☐ |

---

## Phase 6 — AI Pipeline (WF-08)

### TC-6.1 Run Pipeline from Dashboard

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Navigate to `/dashboard`. Click "Run Pipeline" | Button shows "Running..." with spinner. Pipeline overlay appears | ☐ |
| 2 | Wait 15–20 seconds for pipeline completion | Overlay transitions to success state. Button shows "Done!" | ☐ |
| 3 | Dashboard KPI cards update in real-time | Active Alerts count, Pending Reorders count refresh | ☐ |
| 4 | Health Score updates | Score recalculated based on new risk levels | ☐ |
| 5 | "Needs Attention" table populates with HIGH risk / OOS products | Critical products listed with stock, threshold, days left, risk, supplier | ☐ |
| 6 | Verify in Supabase: `System Logs` has new entry for "WF-08 Daily Orchestrator" with status "success" | Log entry created | ☐ |

### TC-6.2 Pipeline Sub-Workflow Verification

After pipeline completes, verify these in Supabase tables:

| # | Check | Expected Result | Pass |
|---|-------|----------------|------|
| 1 | `Products.days_to_stockout` recalculated | Values updated (stock ÷ avg_daily_sales) | ☐ |
| 2 | `Products.estimated_stockout_date` updated | Date = today + days_to_stockout | ☐ |
| 3 | `Products.risk_level` classified correctly | HIGH (≤3 days), MEDIUM (≤7), LOW (>7), stock=0 → HIGH | ☐ |
| 4 | `Stock Alerts` created for products below threshold | Alert rows exist for at-risk products | ☐ |
| 5 | `Reorder Suggestions` generated by AI for HIGH/MEDIUM products | Suggestion rows with ai_generated=true, reason text, supplier_id | ☐ |
| 6 | `Daily Snapshots` has a new row for today | health_score, total_products, risk counts recorded | ☐ |
| 7 | `Suppliers` scores recalculated (composite_score, supplier_grade) | Scores and grades present | ☐ |

---

## Phase 7 — Stock Alerts

### TC-7.1 Alerts Page

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Navigate to `/alerts` | Active alerts displayed as cards with product name, stock, threshold, date, severity bar | ☐ |
| 2 | Alert count shown in header ("X active alerts") | Count matches actual data | ☐ |
| 3 | Stock severity bar shows proportional fill (red if <50% of threshold, orange otherwise) | Visual bar renders correctly | ☐ |
| 4 | Click "Dismissed" tab | Shows dismissed alerts (empty if none dismissed) | ☐ |
| 5 | Empty state shown when no alerts exist | Icon + message displayed, not blank page | ☐ |

### TC-7.2 Dismiss Alerts

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Click "Dismiss" on a single alert card | Toast: "Alert dismissed". Card disappears. Count decreases | ☐ |
| 2 | Switch to "Dismissed" tab | Dismissed alert appears here | ☐ |
| 3 | Click "Dismiss All" button | All active alerts dismissed. Active tab shows empty state | ☐ |

### TC-7.3 Realtime Updates

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Keep Alerts page open. Trigger pipeline from Settings page in another tab | New alerts appear automatically without page refresh | ☐ |

---

## Phase 8 — AI Reorder Suggestions

### TC-8.1 Suggestions Page

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Navigate to `/reorder` | Pending suggestions displayed as cards | ☐ |
| 2 | Each card shows: Product name, Supplier, Quantity, Est. Cost (₹), Date, AI badge, Reason text | All fields visible and formatted | ☐ |
| 3 | AI-generated suggestions show purple "AI" sparkle badge | Badge visible for ai_generated=true | ☐ |
| 4 | Estimated cost calculated correctly (quantity × unit_price in ₹) | Math is correct | ☐ |

### TC-8.2 Approve / Dismiss

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Click "Approve" on a suggestion | Toast: "Suggestion approved". Card disappears from Pending | ☐ |
| 2 | Switch to "Approved" tab | Approved suggestion appears with "WhatsApp Supplier" button | ☐ |
| 3 | Click "WhatsApp Supplier" | New tab opens `wa.me/<phone>?text=<pre-filled order message>` | ☐ |
| 4 | Click "Dismiss" on a suggestion | Toast: "Suggestion dismissed". Moves to Dismissed tab | ☐ |

### TC-8.3 Filter Tabs

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Switch between Pending / Approved / Dismissed tabs | Each tab shows correct filtered suggestions | ☐ |
| 2 | Empty state shown when a tab has no suggestions | Appropriate message displayed | ☐ |

---

## Phase 9 — Dashboard

### TC-9.1 Dashboard Content

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Navigate to `/dashboard` | Page loads with all sections | ☐ |
| 2 | Health Score displayed (large number, colored green/orange/red) | Score visible, color matches range | ☐ |
| 3 | 4 KPI cards: Active Alerts, Pending Reorders, High Risk, Out of Stock | All 4 cards with correct counts and icons | ☐ |
| 4 | "Needs Attention" table shows HIGH risk + OOS products | Sorted by days_to_stockout ascending. Columns: Name, Stock, Threshold, Days Left, Risk, Supplier | ☐ |
| 5 | Date shown in header (e.g., "Wednesday, 26 March 2026") | Correct today's date | ☐ |

### TC-9.2 Health Score Trend Chart

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | After running pipeline at least once, chart shows today's data point | Area chart renders with at least 1 point | ☐ |
| 2 | Hover over data point | Tooltip shows date and score | ☐ |
| 3 | If no snapshots exist, empty state shown | "Run the pipeline to start tracking" message | ☐ |

### TC-9.3 Action Buttons

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | "Run Pipeline" button works | Pipeline executes (covered in TC-6.1) | ☐ |
| 2 | "Send WhatsApp" button works | Triggers WF-07. Toast: "WhatsApp alert sent!" | ☐ |
| 3 | WhatsApp message received on demo phone | Message contains store name, product alerts, dashboard link | ☐ |

### TC-9.4 Realtime Updates

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Keep dashboard open. Record a delivery in another tab | KPI cards and Needs Attention table update without refresh | ☐ |

---

## Phase 10 — Settings

### TC-10.1 Store Profile

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Navigate to `/settings` | Form pre-filled with onboarding data | ☐ |
| 2 | Edit store name, city, safety factor | Fields accept changes | ☐ |
| 3 | Click "Save Profile" | Toast: "Profile saved" | ☐ |
| 4 | Refresh page | Saved values persist | ☐ |

### TC-10.2 Workflow Triggers

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Click "Run Full Pipeline" | Toast: "Run Full Pipeline started successfully!" | ☐ |
| 2 | Click "Send WhatsApp Alert" | Toast: "Send WhatsApp Alert started successfully!" | ☐ |

### TC-10.3 Account Info

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Account section shows email and user ID | Correct values from Supabase Auth displayed | ☐ |

---

## Phase 11 — System Logs

### TC-11.1 Logs Page

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Navigate to `/logs` | Logs table/list displayed with workflow runs | ☐ |
| 2 | After pipeline run, new log entry appears | Workflow name, status (success/error), timestamp, records processed | ☐ |
| 3 | Error entries (if any) show error_message | Error detail visible | ☐ |

---

## Phase 12 — Navigation & Responsiveness

### TC-12.1 Desktop Navigation

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | On desktop/laptop (>1024px), sidebar visible | All nav links: Dashboard, Products, Quick Update, Deliveries, Alerts, Reorder, Suppliers, Logs, Settings | ☐ |
| 2 | Active nav link highlighted | Current page link has accent style | ☐ |
| 3 | All nav links navigate correctly | Each link loads the correct page | ☐ |

### TC-12.2 Mobile Navigation

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Resize browser to <768px or test on phone | Bottom tab bar appears. Sidebar hidden | ☐ |
| 2 | All critical pages accessible from bottom tabs | Tabs navigate correctly | ☐ |

### TC-12.3 Loading & Empty States

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Every page shows spinner while loading data | Loading spinners visible on: Dashboard, Products, Alerts, Reorder, Suppliers, QuickUpdate, Deliveries, Logs | ☐ |
| 2 | Every page shows meaningful empty state when no data | Icon + descriptive text, NOT a blank white page | ☐ |

---

## Phase 13 — WhatsApp Integration

### TC-13.1 WhatsApp Alert (WF-07)

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Ensure demo phone has opted into Twilio sandbox | Text "join <word>" verified | ☐ |
| 2 | Set WhatsApp numbers in Settings and save | Numbers stored correctly | ☐ |
| 3 | Dashboard → "Send WhatsApp" or Settings → "Send WhatsApp Alert" | Message received on phone within 10 seconds | ☐ |
| 4 | Message format contains: Store name, product list with days left, dashboard link | Formatted correctly per WF-07 spec | ☐ |

### TC-13.2 Supplier WhatsApp (Click-to-Chat)

| # | Test Step | Expected Result | Pass |
|---|-----------|----------------|------|
| 1 | Approve a reorder suggestion | "WhatsApp Supplier" button appears | ☐ |
| 2 | Click "WhatsApp Supplier" | Opens `wa.me` with pre-filled order message including product name and quantity | ☐ |

---

## Scoring Summary

| Phase | Feature Area | Total Tests | Passed | Status |
|-------|-------------|-------------|--------|--------|
| 1 | Auth & Onboarding | 16 | /16 | |
| 2 | Suppliers | 13 | /13 | |
| 3 | Products | 18 | /18 | |
| 4 | Quick Update | 8 | /8 | |
| 5 | Deliveries | 10 | /10 | |
| 6 | AI Pipeline | 9 | /9 | |
| 7 | Alerts | 7 | /7 | |
| 8 | Reorder Suggestions | 9 | /9 | |
| 9 | Dashboard | 10 | /10 | |
| 10 | Settings | 5 | /5 | |
| 11 | System Logs | 3 | /3 | |
| 12 | Nav & UX | 5 | /5 | |
| 13 | WhatsApp | 6 | /6 | |
| **TOTAL** | | **119** | **/119** | |

---

## Night-Before Checklist (25 March 2026 Evening)

- [ ] Run `demo_reset.sql` in Supabase SQL Editor
- [ ] Run full pipeline (Settings → Run Full Pipeline) and verify Dashboard populates
- [ ] Test WhatsApp: opt-in to Twilio sandbox, then send alert from Dashboard
- [ ] Have a screen recording ready as absolute fallback
- [ ] Laptop fully charged + charger packed
- [ ] Print this rubric or have it open on a second device for reference
