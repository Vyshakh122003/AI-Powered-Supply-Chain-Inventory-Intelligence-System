-- =============================================================================
-- Migration 002: Composite UNIQUE Keys for Multi-Tenant Isolation
-- =============================================================================
-- Replaces global UNIQUE constraints on business IDs with tenant-scoped
-- composite UNIQUE keys: (store_id, product_id) and (store_id, supplier_id).
--
-- This allows different stores to independently use the same SKU/supplier IDs
-- without collision — a requirement for correct SaaS multi-tenancy.
--
-- Prerequisites:
--   - Migration 001 (store_id NOT NULL) must have been run first.
--   - All rows in Products/Suppliers must have a valid store_id.
--
-- Run this in the Supabase SQL Editor.
-- =============================================================================

BEGIN;

-- ─── Step 1: Drop dependent FK constraints that reference the old UNIQUE keys ──

-- Stock Alerts FK → Products.product_id
ALTER TABLE "Stock Alerts"
  DROP CONSTRAINT IF EXISTS fk_stock_alerts_product;

-- Reorder Suggestions FK → Products.product_id (implicit via column reference)
ALTER TABLE "Reorder Suggestions"
  DROP CONSTRAINT IF EXISTS fk_reorder_suggestions_product;

-- Reorder Suggestions FK → Suppliers.supplier_id
ALTER TABLE "Reorder Suggestions"
  DROP CONSTRAINT IF EXISTS "Reorder Suggestions_supplier_id_fkey";

-- Also try the standard naming convention in case FK was auto-named
ALTER TABLE "Reorder Suggestions"
  DROP CONSTRAINT IF EXISTS fk_reorder_suggestions_supplier;


-- ─── Step 2: Drop old global UNIQUE constraints ────────────────────────────────

-- Products: UNIQUE(product_id) → will become UNIQUE(store_id, product_id)
ALTER TABLE "Products"
  DROP CONSTRAINT IF EXISTS "Products_product_id_key";

-- Suppliers: UNIQUE(supplier_id) → will become UNIQUE(store_id, supplier_id)
ALTER TABLE "Suppliers"
  DROP CONSTRAINT IF EXISTS "Suppliers_supplier_id_key";


-- ─── Step 3: Create composite UNIQUE constraints ───────────────────────────────

-- Now two different stores can each have a product with product_id = 'MILK_001'
ALTER TABLE "Products"
  ADD CONSTRAINT uq_products_store_product
  UNIQUE (store_id, product_id);

-- Now two different stores can each have a supplier with supplier_id = 'SUP_001'
ALTER TABLE "Suppliers"
  ADD CONSTRAINT uq_suppliers_store_supplier
  UNIQUE (store_id, supplier_id);


-- ─── Step 4: Recreate FK constraints using the new composite keys ──────────────

-- Stock Alerts → Products (store_id, product_id)
-- Ensures alerts always reference a product within the same store
ALTER TABLE "Stock Alerts"
  ADD CONSTRAINT fk_stock_alerts_product
  FOREIGN KEY (store_id, product_id)
  REFERENCES "Products" (store_id, product_id)
  ON DELETE CASCADE;

-- Reorder Suggestions → Products (store_id, product_id)
-- Note: Reorder Suggestions doesn't have a direct product FK in schema.sql,
-- but we add one for referential integrity
-- (product_id column already exists and is NOT NULL)

-- Reorder Suggestions → Suppliers (store_id, supplier_id)
ALTER TABLE "Reorder Suggestions"
  ADD CONSTRAINT fk_reorder_suggestions_supplier
  FOREIGN KEY (store_id, supplier_id)
  REFERENCES "Suppliers" (store_id, supplier_id)
  ON DELETE CASCADE;


-- ─── Step 5: Update indexes for the new composite patterns ─────────────────────

-- Drop old single-column indexes (now redundant with composite UNIQUE)
DROP INDEX IF EXISTS idx_products_product_id;
DROP INDEX IF EXISTS idx_suppliers_supplier_id;

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_store_product
  ON "Products" (store_id, product_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_store_supplier
  ON "Suppliers" (store_id, supplier_id);


COMMIT;

-- =============================================================================
-- Verification: Run after migration to confirm constraints
-- =============================================================================
-- SELECT constraint_name, table_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name IN ('Products', 'Suppliers', 'Stock Alerts', 'Reorder Suggestions')
--   AND constraint_type IN ('UNIQUE', 'FOREIGN KEY')
-- ORDER BY table_name, constraint_type;
-- =============================================================================
