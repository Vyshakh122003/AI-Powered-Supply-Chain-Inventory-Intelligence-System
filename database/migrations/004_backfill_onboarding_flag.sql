-- 004_backfill_onboarding_flag.sql
-- Backfill onboarding_complete for all existing profiles with real data

UPDATE "Store Profiles"
SET onboarding_complete = true
WHERE store_name IS NOT NULL
  AND store_name != ''
  AND (onboarding_complete IS NULL OR onboarding_complete = false);
