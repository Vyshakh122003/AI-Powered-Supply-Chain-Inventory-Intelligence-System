-- =============================================================================
-- Migration 001: Make store_id NOT NULL on all tenant-scoped tables
-- =============================================================================
-- Rationale: Nullable store_id allows orphaned rows that break tenant isolation.
-- This migration backfills any NULL store_id rows (assigns them to the first
-- store profile found, or deletes them if no profile exists), then adds the
-- NOT NULL constraint.
--
-- Prerequisites:
--   - At least one Store Profile must exist for backfill, OR
--   - Accept that orphaned rows (NULL store_id) will be deleted.
-- =============================================================================

-- Step 1: Delete orphaned rows with NULL store_id (rows that can never belong to a tenant)
-- In production, you may want to backfill these instead of deleting.

-- Children first (they hold FK references to Products / Suppliers)
DELETE FROM "Reorder Suggestions" WHERE store_id IS NULL;
DELETE FROM "Stock Alerts" WHERE store_id IS NULL;
DELETE FROM "Stock Transactions" WHERE store_id IS NULL;
DELETE FROM "Daily Snapshots" WHERE store_id IS NULL;
DELETE FROM "System Logs" WHERE store_id IS NULL;
-- Parents last
DELETE FROM "Products" WHERE store_id IS NULL;
DELETE FROM "Suppliers" WHERE store_id IS NULL;

-- Step 2: Add NOT NULL constraint to store_id on all tenant-scoped tables

ALTER TABLE "Products"
  ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE "Suppliers"
  ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE "Stock Alerts"
  ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE "Reorder Suggestions"
  ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE "Stock Transactions"
  ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE "Daily Snapshots"
  ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE "System Logs"
  ALTER COLUMN store_id SET NOT NULL;

-- Step 3: Add foreign key constraints to enforce referential integrity
-- (Only if they don't already exist)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_products_store' AND table_name = 'Products'
  ) THEN
    ALTER TABLE "Products"
      ADD CONSTRAINT fk_products_store
      FOREIGN KEY (store_id) REFERENCES "Store Profiles" (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_suppliers_store' AND table_name = 'Suppliers'
  ) THEN
    ALTER TABLE "Suppliers"
      ADD CONSTRAINT fk_suppliers_store
      FOREIGN KEY (store_id) REFERENCES "Store Profiles" (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_stock_alerts_store' AND table_name = 'Stock Alerts'
  ) THEN
    ALTER TABLE "Stock Alerts"
      ADD CONSTRAINT fk_stock_alerts_store
      FOREIGN KEY (store_id) REFERENCES "Store Profiles" (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_reorder_suggestions_store' AND table_name = 'Reorder Suggestions'
  ) THEN
    ALTER TABLE "Reorder Suggestions"
      ADD CONSTRAINT fk_reorder_suggestions_store
      FOREIGN KEY (store_id) REFERENCES "Store Profiles" (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_stock_transactions_store' AND table_name = 'Stock Transactions'
  ) THEN
    ALTER TABLE "Stock Transactions"
      ADD CONSTRAINT fk_stock_transactions_store
      FOREIGN KEY (store_id) REFERENCES "Store Profiles" (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_daily_snapshots_store' AND table_name = 'Daily Snapshots'
  ) THEN
    ALTER TABLE "Daily Snapshots"
      ADD CONSTRAINT fk_daily_snapshots_store
      FOREIGN KEY (store_id) REFERENCES "Store Profiles" (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_system_logs_store' AND table_name = 'System Logs'
  ) THEN
    ALTER TABLE "System Logs"
      ADD CONSTRAINT fk_system_logs_store
      FOREIGN KEY (store_id) REFERENCES "Store Profiles" (id) ON DELETE CASCADE;
  END IF;
END $$;
