-- =============================================================================
-- StockSense AI — Seed Data
-- =============================================================================
-- Demo data representing a typical small kirana store in India.
-- Run AFTER schema.sql on a fresh database.
--
-- Contains:
--   6 products across 5 categories (Dairy, Beverages, Snacks, Bakery, Essentials)
--   3 suppliers with pre-computed scores
--
-- Note: Stock Alerts and Reorder Suggestions are generated dynamically by
-- the n8n pipeline (WF-03 and WF-05) and are NOT seeded here.
-- =============================================================================


-- =============================================================================
-- Products (6 SKUs)
-- =============================================================================
-- These represent a realistic small-store inventory with varying stock levels,
-- sales velocities, and risk profiles for demonstration purposes.
-- =============================================================================
INSERT INTO "Products" (
    product_id, product_name, category, current_stock, avg_daily_sales,
    reorder_threshold, unit_price, last_restock_date, days_to_stockout,
    estimated_stockout_date, risk_level, unit, preferred_supplier_id,
    safety_factor, is_seasonal
) VALUES
    -- HIGH risk: Out of stock or critically low
    ('MILK_001',  'Milk 1L',           'Dairy',      0,  5, 15, 30,  '2026-02-06', 0,  '2026-03-14', 'HIGH',   'Pieces', 'SUP_001', 1.2, false),
    ('TEA_001',   'Premium Tea Bags',  'Beverages',  2,  3, 10, 50,  NULL,          0,  '2026-03-14', 'HIGH',   'Pieces', 'SUP_001', 1.2, false),
    ('BIS_010',   'Biscuits Pack',     'Snacks',     3,  5, 12, 10,  '2026-02-06', 0,  '2026-03-14', 'HIGH',   'Pieces', 'SUP_002', 1.2, false),
    ('BREAD_001', 'Brown Bread',       'Bakery',     10, 5, 10, 40,  NULL,          2,  '2026-03-16', 'HIGH',   'Pieces', 'SUP_002', 1.2, false),
    -- MEDIUM risk: Below threshold but not critical
    ('CAKE_001',  'Plum Cake',         'Bakery',     13, 2, 15, 30,  NULL,          6,  '2026-03-20', 'MEDIUM', 'Pieces', 'SUP_002', 1.2, false),
    -- LOW risk: Healthy stock levels
    ('RICE_005',  'Rice 5kg',          'Essentials', 47, 3, 20, 320, '2026-02-06', 15, '2026-03-29', 'LOW',    'Pieces', 'SUP_003', 1.2, false)
ON CONFLICT (product_id) DO NOTHING;


-- =============================================================================
-- Suppliers (3)
-- =============================================================================
-- Pre-scored by WF-06. Composite = (reliability * 0.4 * 100) + (price * 0.35 * 100)
-- + (speed_component). Grades: A >= 80, B >= 60, C >= 40, D < 40.
-- =============================================================================
INSERT INTO "Suppliers" (
    supplier_id, supplier_name, contact_person, phone_number,
    delivery_time_days, reliability_score, price_score,
    composite_score, supplier_grade, score_breakdown, supplies_categories
) VALUES
    (
        'SUP_001', 'Fresh Dairy Co.', 'Rajesh Kumar', '919876543210',
        4, 0.9, 0.8,
        89, 'A', 'Reliability: 36pts | Price: 28pts | Speed: 25pts',
        '["dairy","beverages","essentials"]'
    ),
    (
        'SUP_002', 'Metro Wholesale', 'Suresh Reddy', '919845123456',
        2, 0.75, 0.9,
        74, 'B', 'Reliability: 30pts | Price: 32pts | Speed: 13pts',
        '["snacks","bakery","essentials"]'
    ),
    (
        'SUP_003', 'City Distributors', 'Anil Sharma', '919823456789',
        3, 0.65, 0.7,
        50.5, 'C', 'Reliability: 26pts | Price: 25pts | Speed: 0pts',
        '["beverages","snacks","dairy","essentials","bakery"]'
    )
ON CONFLICT (supplier_id) DO NOTHING;
