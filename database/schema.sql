-- =============================================================================
-- StockSense AI — Complete Database Schema
-- =============================================================================
-- Supabase / PostgreSQL schema for the AI-Powered Supply Chain Inventory
-- Intelligence System. Designed for small Indian kirana (grocery) stores.
--
-- Run this file on a fresh Supabase project to recreate the entire database.
-- Prerequisite: Supabase auth.users table must exist (auto-created by Supabase).
--
-- Table naming convention: PascalCase with spaces (Supabase default).
-- All tables use UUID primary keys with gen_random_uuid().
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- 1. Store Profiles
-- =============================================================================
-- One row per registered store. Links to auth.users via user_id.
-- Created during signup; expanded during onboarding.
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Store Profiles" (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),     -- Internal row ID
    created_at      TIMESTAMPTZ NOT NULL    DEFAULT now(),                 -- Row creation timestamp
    user_id         UUID        UNIQUE,                                   -- FK to auth.users.id (nullable until linked)
    store_name      TEXT        NOT NULL,                                  -- Display name of the kirana store
    owner_name      TEXT        NOT NULL,                                  -- Store owner's full name
    whatsapp_numbers TEXT,                                                 -- Comma-separated WhatsApp numbers for alerts
    city            TEXT,                                                  -- City where the store is located
    store_type      TEXT        DEFAULT 'Kirana',                          -- Type: Kirana, Supermarket, Wholesale, etc.
    safety_factor   NUMERIC     DEFAULT 1.2,                              -- Multiplier for reorder quantity buffer (1.0–2.0)
    alert_time      TIME        DEFAULT '08:00:00',                       -- Preferred daily alert delivery time (local)
    timezone        TEXT        NOT NULL DEFAULT 'Asia/Kolkata',           -- IANA timezone for scheduling
    onboarding_complete BOOLEAN DEFAULT false                             -- Whether the store has completed onboarding flow
);

COMMENT ON TABLE "Store Profiles" IS 'Registered store profiles linked to Supabase auth users. One store per user.';


-- =============================================================================
-- 2. Products
-- =============================================================================
-- Master product catalog. Each row is a unique SKU tracked by the store.
-- Updated by WF-01 (ingestion), WF-02 (stockout calc), WF-04 (risk classification).
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Products" (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),     -- Internal row ID
    created_at              TIMESTAMPTZ NOT NULL    DEFAULT now(),                 -- Row creation timestamp
    product_id              TEXT        NOT NULL UNIQUE,                           -- Business key (e.g. MILK_001, TEA_001)
    product_name            TEXT        NOT NULL,                                  -- Human-readable product name
    category                TEXT,                                                  -- Product category (Dairy, Beverages, etc.)
    current_stock           INTEGER     NOT NULL DEFAULT 0,                        -- Current units in stock
    avg_daily_sales         NUMERIC     NOT NULL DEFAULT 0,                        -- Rolling average daily units sold
    reorder_threshold       INTEGER     NOT NULL DEFAULT 0,                        -- Stock level that triggers reorder alert
    unit_price              NUMERIC     NOT NULL DEFAULT 0,                        -- Price per unit in INR
    last_restock_date       DATE,                                                  -- Date of most recent restocking
    days_to_stockout        INTEGER,                                               -- Calculated: current_stock / avg_daily_sales
    estimated_stockout_date DATE,                                                  -- Calculated: today + days_to_stockout
    risk_level              TEXT        DEFAULT 'UNKNOWN',                          -- Classification: HIGH, MEDIUM, LOW, UNKNOWN
    store_id                UUID,                                                  -- FK to "Store Profiles".id (for multi-tenancy)
    unit                    TEXT        DEFAULT 'Pieces',                           -- Unit of measurement (Pieces, Kg, Litres)
    preferred_supplier_id   TEXT,                                                  -- Preferred supplier_id for this product
    safety_factor           NUMERIC     DEFAULT 1.2,                               -- Product-level safety factor override
    expiry_days             INTEGER,                                                -- Shelf life in days (NULL = non-perishable)
    is_seasonal             BOOLEAN     DEFAULT false,                              -- Whether demand is seasonal
    peak_season_months      TEXT,                                                   -- Comma-separated months (e.g. "10,11,12")
    last_manual_update      TIMESTAMPTZ                                            -- Timestamp of last manual stock update
);

COMMENT ON TABLE "Products" IS 'Master product catalog with stock levels, sales velocity, risk classification, and stockout projections.';

-- Indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_products_product_id   ON "Products" (product_id);
CREATE INDEX IF NOT EXISTS idx_products_risk_level   ON "Products" (risk_level);
CREATE INDEX IF NOT EXISTS idx_products_category     ON "Products" (category);
CREATE INDEX IF NOT EXISTS idx_products_store_id     ON "Products" (store_id);


-- =============================================================================
-- 3. Suppliers
-- =============================================================================
-- Supplier directory with scoring. Scores computed by WF-06 (Supplier Scoring).
-- Composite score = weighted sum of reliability, price, and delivery speed.
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Suppliers" (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),     -- Internal row ID
    created_at          TIMESTAMPTZ NOT NULL    DEFAULT now(),                 -- Row creation timestamp
    supplier_id         TEXT        NOT NULL UNIQUE,                           -- Business key (e.g. SUP_001)
    supplier_name       TEXT        NOT NULL,                                  -- Supplier company name
    contact_person      TEXT,                                                  -- Primary contact name
    phone_number        TEXT,                                                  -- Contact phone (with country code)
    email               TEXT,                                                  -- Contact email
    address             TEXT,                                                  -- Supplier address
    delivery_time_days  INTEGER     NOT NULL DEFAULT 3,                        -- Average delivery lead time in days
    reliability_score   NUMERIC     NOT NULL DEFAULT 0.5,                      -- Reliability rating 0.0–1.0 (display as /10)
    price_score         NUMERIC     NOT NULL DEFAULT 0.5,                      -- Price competitiveness 0.0–1.0 (display as /10)
    composite_score     NUMERIC,                                               -- Weighted composite 0–100 (WF-06 output)
    supplier_grade      TEXT,                                                  -- Letter grade: A (>=80), B (>=60), C (>=40), D (<40)
    score_breakdown     TEXT,                                                  -- Human-readable score explanation from WF-06
    supplies_categories TEXT,                                                  -- JSON array string of categories supplied
    store_id            UUID                                                   -- FK to "Store Profiles".id (for multi-tenancy)
);

COMMENT ON TABLE "Suppliers" IS 'Supplier directory with reliability/price scoring and grade classification.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_id    ON "Suppliers" (supplier_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_grade          ON "Suppliers" (supplier_grade);
CREATE INDEX IF NOT EXISTS idx_suppliers_store_id       ON "Suppliers" (store_id);


-- =============================================================================
-- 4. Stock Alerts
-- =============================================================================
-- Generated by WF-03 (Inventory Processing) when current_stock <= reorder_threshold.
-- Each alert is per-product per pipeline run. Users can dismiss alerts in the UI.
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Stock Alerts" (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),     -- Internal row ID
    created_at          TIMESTAMPTZ NOT NULL    DEFAULT now(),                 -- Row creation timestamp
    product_id          TEXT        NOT NULL,                                  -- FK to "Products".product_id
    product_name        TEXT        NOT NULL,                                  -- Denormalized for display performance
    alert_name          TEXT        NOT NULL,                                  -- Human-readable alert title
    alert_date          TIMESTAMPTZ NOT NULL,                                 -- When the alert condition was detected
    current_stock       INTEGER,                                               -- Stock level at time of alert
    reorder_threshold   INTEGER     NOT NULL,                                 -- Threshold that was breached
    alert_status        TEXT        NOT NULL DEFAULT 'Active',                -- Active | Dismissed
    store_id            UUID,                                                  -- FK to "Store Profiles".id
    last_alerted_at     TIMESTAMPTZ,                                          -- Last time a WhatsApp notification was sent

    CONSTRAINT fk_stock_alerts_product
        FOREIGN KEY (product_id) REFERENCES "Products" (product_id)
        ON DELETE CASCADE
);

COMMENT ON TABLE "Stock Alerts" IS 'Low stock alerts generated by the inventory processing pipeline (WF-03).';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product_id    ON "Stock Alerts" (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_status        ON "Stock Alerts" (alert_status);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_store_id      ON "Stock Alerts" (store_id);


-- =============================================================================
-- 5. Reorder Suggestions
-- =============================================================================
-- AI-generated reorder recommendations from WF-05 (AI Reorder Intelligence).
-- Each suggestion recommends a quantity and supplier for a specific product.
-- Users can approve or dismiss suggestions in the UI.
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Reorder Suggestions" (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),     -- Internal row ID
    created_at          TIMESTAMPTZ NOT NULL    DEFAULT now(),                 -- Row creation timestamp
    product_id          TEXT        NOT NULL,                                  -- FK to "Products".product_id
    supplier_id         TEXT        NOT NULL,                                  -- FK to "Suppliers".supplier_id
    suggested_quantity  INTEGER     NOT NULL,                                  -- Recommended order quantity in units
    reason              TEXT        NOT NULL,                                  -- AI-generated explanation for the suggestion
    status              TEXT        NOT NULL DEFAULT 'Pending',               -- Pending | Approved | Dismissed
    suggestion_date     TIMESTAMPTZ NOT NULL,                                 -- When the suggestion was generated
    store_id            UUID,                                                  -- FK to "Store Profiles".id
    ai_generated        BOOLEAN     DEFAULT true,                             -- Whether this was AI-generated or manual
    approved_at         TIMESTAMPTZ,                                          -- Timestamp when approved by user

    CONSTRAINT fk_reorder_suggestions_supplier
        FOREIGN KEY (supplier_id) REFERENCES "Suppliers" (supplier_id)
        ON DELETE CASCADE
);

COMMENT ON TABLE "Reorder Suggestions" IS 'AI-generated reorder recommendations with supplier matching (WF-05).';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reorder_product_id  ON "Reorder Suggestions" (product_id);
CREATE INDEX IF NOT EXISTS idx_reorder_status       ON "Reorder Suggestions" (status);
CREATE INDEX IF NOT EXISTS idx_reorder_store_id     ON "Reorder Suggestions" (store_id);


-- =============================================================================
-- 6. Stock Transactions
-- =============================================================================
-- Immutable ledger of all stock changes. Populated by WF-08 (Daily Orchestrator),
-- Quick Update page, and Record Delivery page. Enables audit trail and analytics.
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Stock Transactions" (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),     -- Internal row ID
    created_at          TIMESTAMPTZ NOT NULL    DEFAULT now(),                 -- Row creation timestamp
    store_id            UUID,                                                  -- FK to "Store Profiles".id
    product_id          TEXT,                                                  -- FK to "Products".product_id
    product_name        TEXT        NOT NULL,                                  -- Denormalized for display
    transaction_type    TEXT        NOT NULL,                                  -- sale | restock | adjustment | delivery | manual_update
    quantity_change     INTEGER     NOT NULL,                                  -- Positive = stock in, negative = stock out
    new_stock_level     INTEGER     NOT NULL,                                  -- Stock level after this transaction
    notes               TEXT                                                   -- Optional notes (e.g. "Daily pipeline deduction")
);

COMMENT ON TABLE "Stock Transactions" IS 'Immutable audit log of all stock level changes for traceability.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_txn_product_id  ON "Stock Transactions" (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_txn_type         ON "Stock Transactions" (transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_txn_store_id     ON "Stock Transactions" (store_id);
CREATE INDEX IF NOT EXISTS idx_stock_txn_created_at   ON "Stock Transactions" (created_at);


-- =============================================================================
-- 7. Daily Snapshots
-- =============================================================================
-- One row per day per store. Written by WF-08 (Daily Orchestrator) after the
-- full pipeline completes. Powers the Reports page health score chart.
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Daily Snapshots" (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),     -- Internal row ID
    created_at          TIMESTAMPTZ NOT NULL    DEFAULT now(),                 -- Row creation timestamp
    store_id            UUID,                                                  -- FK to "Store Profiles".id
    snapshot_date       DATE        NOT NULL,                                  -- The date this snapshot represents
    health_score        NUMERIC     NOT NULL,                                  -- Inventory health score 0–100
    total_products      INTEGER     NOT NULL DEFAULT 0,                       -- Total SKUs tracked
    oos_count           INTEGER     NOT NULL DEFAULT 0,                       -- Out-of-stock products (stock = 0)
    high_count          INTEGER     NOT NULL DEFAULT 0,                       -- HIGH risk product count
    medium_count        INTEGER     NOT NULL DEFAULT 0,                       -- MEDIUM risk product count
    low_count           INTEGER     NOT NULL DEFAULT 0,                       -- LOW risk product count
    alerts_active       INTEGER     NOT NULL DEFAULT 0,                       -- Active alerts at snapshot time
    suggestions_pending INTEGER     NOT NULL DEFAULT 0                        -- Pending suggestions at snapshot time
);

COMMENT ON TABLE "Daily Snapshots" IS 'Daily inventory health snapshots for trend analysis and reporting.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_snapshots_date      ON "Daily Snapshots" (snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_store_id  ON "Daily Snapshots" (store_id);


-- =============================================================================
-- 8. System Logs
-- =============================================================================
-- Workflow execution log. Each n8n workflow run logs its status here.
-- Used for debugging, monitoring, and the System Logs display page.
-- =============================================================================
CREATE TABLE IF NOT EXISTS "System Logs" (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),     -- Internal row ID
    created_at          TIMESTAMPTZ NOT NULL    DEFAULT now(),                 -- Row creation timestamp
    store_id            UUID,                                                  -- FK to "Store Profiles".id
    workflow_name       TEXT        NOT NULL,                                  -- Workflow identifier (e.g. "WF-08 Daily Orchestrator")
    status              TEXT        NOT NULL,                                  -- success | error | warning
    records_processed   INTEGER,                                               -- Number of records processed in this run
    error_message       TEXT,                                                  -- Error details if status = error
    ran_at              TIMESTAMPTZ NOT NULL DEFAULT now()                     -- Actual execution timestamp
);

COMMENT ON TABLE "System Logs" IS 'Execution log for all n8n workflow runs for monitoring and debugging.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_logs_workflow  ON "System Logs" (workflow_name);
CREATE INDEX IF NOT EXISTS idx_system_logs_status    ON "System Logs" (status);
CREATE INDEX IF NOT EXISTS idx_system_logs_store_id  ON "System Logs" (store_id);


-- =============================================================================
-- Supabase Realtime
-- =============================================================================
-- Enable realtime subscriptions on tables the frontend listens to.
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE "Products";
ALTER PUBLICATION supabase_realtime ADD TABLE "Stock Alerts";
ALTER PUBLICATION supabase_realtime ADD TABLE "Reorder Suggestions";
ALTER PUBLICATION supabase_realtime ADD TABLE "Daily Snapshots";
ALTER PUBLICATION supabase_realtime ADD TABLE "Suppliers";
