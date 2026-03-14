-- =============================================================================
-- StockSense AI — Demo Reset Script
-- =============================================================================
-- Resets the database to a clean demo-ready state before presentations.
-- Run this in Supabase Dashboard > SQL Editor before every demo.
--
-- What this does:
--   1. Clears all generated/transient data (alerts, suggestions, snapshots,
--      transactions, system logs)
--   2. Resets product stock levels and risk data to realistic demo values
--   3. Preserves the 3 demo suppliers with their scores
--   4. Does NOT touch Store Profiles or auth.users
--
-- After running this script, trigger WF-08 (Daily Orchestrator) from the
-- Settings page to regenerate alerts, suggestions, and snapshots.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Clear all generated data
-- ─────────────────────────────────────────────────────────────────────────────
TRUNCATE "Stock Alerts"          CASCADE;
TRUNCATE "Reorder Suggestions"   CASCADE;
TRUNCATE "Daily Snapshots"       CASCADE;
TRUNCATE "Stock Transactions"    CASCADE;
TRUNCATE "System Logs"           CASCADE;


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Reset product stock levels to demo values
-- ─────────────────────────────────────────────────────────────────────────────
-- These values create a realistic spread of risk levels:
--   2 products critically low (HIGH risk)
--   2 products low but not zero (HIGH risk)
--   1 product below threshold (MEDIUM risk)
--   1 product healthy (LOW risk)

UPDATE "Products" SET
    current_stock = 0,
    days_to_stockout = 0,
    estimated_stockout_date = CURRENT_DATE,
    risk_level = 'HIGH',
    last_restock_date = '2026-02-06'
WHERE product_id = 'MILK_001';

UPDATE "Products" SET
    current_stock = 2,
    days_to_stockout = 0,
    estimated_stockout_date = CURRENT_DATE,
    risk_level = 'HIGH',
    last_restock_date = NULL
WHERE product_id = 'TEA_001';

UPDATE "Products" SET
    current_stock = 3,
    days_to_stockout = 0,
    estimated_stockout_date = CURRENT_DATE,
    risk_level = 'HIGH',
    last_restock_date = '2026-02-06'
WHERE product_id = 'BIS_010';

UPDATE "Products" SET
    current_stock = 10,
    days_to_stockout = 2,
    estimated_stockout_date = CURRENT_DATE + 2,
    risk_level = 'HIGH',
    last_restock_date = NULL
WHERE product_id = 'BREAD_001';

UPDATE "Products" SET
    current_stock = 13,
    days_to_stockout = 6,
    estimated_stockout_date = CURRENT_DATE + 6,
    risk_level = 'MEDIUM',
    last_restock_date = NULL
WHERE product_id = 'CAKE_001';

UPDATE "Products" SET
    current_stock = 47,
    days_to_stockout = 15,
    estimated_stockout_date = CURRENT_DATE + 15,
    risk_level = 'LOW',
    last_restock_date = '2026-02-06'
WHERE product_id = 'RICE_005';


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Reset supplier scores to demo values
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE "Suppliers" SET
    reliability_score = 0.9,
    price_score = 0.8,
    composite_score = 89,
    supplier_grade = 'A',
    score_breakdown = 'Reliability: 36pts | Price: 28pts | Speed: 25pts'
WHERE supplier_id = 'SUP_001';

UPDATE "Suppliers" SET
    reliability_score = 0.75,
    price_score = 0.9,
    composite_score = 74,
    supplier_grade = 'B',
    score_breakdown = 'Reliability: 30pts | Price: 32pts | Speed: 13pts'
WHERE supplier_id = 'SUP_002';

UPDATE "Suppliers" SET
    reliability_score = 0.65,
    price_score = 0.7,
    composite_score = 50.5,
    supplier_grade = 'C',
    score_breakdown = 'Reliability: 26pts | Price: 25pts | Speed: 0pts'
WHERE supplier_id = 'SUP_003';

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4: Post-reset instructions
-- ─────────────────────────────────────────────────────────────────────────────
-- After running this script:
--   1. Open the StockSense AI app
--   2. Go to Settings page
--   3. Click "Run Full Pipeline" (triggers WF-08 Daily Orchestrator)
--   4. Wait ~15 seconds for all workflows to complete
--   5. The dashboard will now show fresh alerts, suggestions, and health scores
-- ─────────────────────────────────────────────────────────────────────────────
