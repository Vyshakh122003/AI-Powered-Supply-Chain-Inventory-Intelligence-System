-- =============================================================================
-- Migration 005: Fix Store ID Consistency for Single-Store Model
-- =============================================================================
-- This migration ensures all data rows have proper store_id linkage.
-- For single-store deployments, all rows without store_id will be linked to
-- the first (and only) Store Profile.
--
-- Run this AFTER a user completes onboarding/signup.

BEGIN;

-- Step 1: Get the primary store profile (should be only one for single-store)
DO $$
DECLARE
  v_store_id UUID;
  v_product_count INT;
  v_supplier_count INT;
BEGIN
  -- Find the store profile (prefer one with user_id, then any existing one)
  SELECT id INTO v_store_id
  FROM "Store Profiles"
  WHERE user_id IS NOT NULL
  ORDER BY created_at ASC
  LIMIT 1;

  -- Fallback: use the first store profile if none have user_id
  IF v_store_id IS NULL THEN
    SELECT id INTO v_store_id FROM "Store Profiles" LIMIT 1;
  END IF;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'No store profile found. Cannot backfill store_id.';
  END IF;

  RAISE NOTICE 'Backfilling data for store: %', v_store_id;

  -- Step 2: Backfill Products table
  UPDATE "Products" SET store_id = v_store_id WHERE store_id IS NULL;
  GET DIAGNOSTICS v_product_count = ROW_COUNT;
  RAISE NOTICE 'Updated % products with store_id', v_product_count;

  -- Step 3: Backfill Suppliers table
  UPDATE "Suppliers" SET store_id = v_store_id WHERE store_id IS NULL;
  GET DIAGNOSTICS v_supplier_count = ROW_COUNT;
  RAISE NOTICE 'Updated % suppliers with store_id', v_supplier_count;

  -- Step 4: Backfill Stock Alerts
  UPDATE "Stock Alerts" SET store_id = v_store_id WHERE store_id IS NULL;

  -- Step 5: Backfill Reorder Suggestions
  UPDATE "Reorder Suggestions" SET store_id = v_store_id WHERE store_id IS NULL;

  -- Step 6: Backfill Stock Transactions
  UPDATE "Stock Transactions" SET store_id = v_store_id WHERE store_id IS NULL;

  -- Step 7: Backfill Daily Snapshots
  UPDATE "Daily Snapshots" SET store_id = v_store_id WHERE store_id IS NULL;

  -- Step 8: Backfill System Logs
  UPDATE "System Logs" SET store_id = v_store_id WHERE store_id IS NULL;

END $$;

COMMIT;
