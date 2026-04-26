-- Migration 003: Enable Supabase Realtime publication for tenant-scoped tables
-- Depends on: 001_store_id_not_null.sql, 002_composite_unique_keys.sql
-- Date: 2026-04-26
--
-- Purpose:
--   Supabase Realtime's postgres_changes filter (used in the frontend)
--   requires the target tables to be added to the `supabase_realtime`
--   publication. Without this, the `filter: store_id=eq.<uuid>` param
--   in channel subscriptions will silently receive no events.
--
-- This migration is IDEMPOTENT — safe to re-run.

-- ── Step 1: Ensure the realtime publication exists ──────────────────
-- (Supabase creates this automatically, but be defensive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- ── Step 2: Add tables to the publication ───────────────────────────
-- Using ALTER PUBLICATION ... ADD TABLE (idempotent with IF NOT EXISTS check)

DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'Products',
    'Stock Alerts',
    'Reorder Suggestions',
    'System Logs',
    'Suppliers',
    'Stock Transactions',
    'Daily Snapshots'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    -- Check if table is already in the publication
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
      RAISE NOTICE 'Added table "%" to supabase_realtime publication', t;
    ELSE
      RAISE NOTICE 'Table "%" already in supabase_realtime publication — skipped', t;
    END IF;
  END LOOP;
END $$;

-- ── Step 3: Enable replica identity for filtered subscriptions ──────
-- Supabase Realtime needs REPLICA IDENTITY FULL on tables used with
-- the `filter` parameter, so it can evaluate the filter on UPDATE/DELETE.

DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'Products',
    'Stock Alerts',
    'Reorder Suggestions',
    'System Logs',
    'Suppliers',
    'Stock Transactions',
    'Daily Snapshots'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', t);
    RAISE NOTICE 'Set REPLICA IDENTITY FULL on "%"', t;
  END LOOP;
END $$;
