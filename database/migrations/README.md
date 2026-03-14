# Database Migrations

This folder contains incremental schema changes applied after the initial `schema.sql`.

## Convention

Each migration file is named with a sequential number and a short description:

```
001_add_system_logs_table.sql
002_add_store_type_column.sql
003_add_rls_policies.sql
```

## How to Apply Migrations

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file you want to apply
4. Copy the contents and paste into the SQL editor
5. Click **Run** to execute

Migrations should be applied **in order** and **only once**. Each migration file should be idempotent where possible (using `IF NOT EXISTS`, `IF EXISTS` guards).

## Current Migrations

No migrations have been applied yet. The database was created from `schema.sql` directly.

## Writing New Migrations

When making schema changes:

1. **Never modify `schema.sql` retroactively** for a change that's already deployed
2. Create a new migration file in this folder
3. Include both the forward migration and a rollback comment
4. Test on a development branch before applying to production

### Template

```sql
-- Migration: 00X_description
-- Date: YYYY-MM-DD
-- Author: [name]
-- Description: [what this migration does and why]

BEGIN;

-- Forward migration
ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS new_column TEXT;

-- Rollback (do not run — kept for reference):
-- ALTER TABLE "Products" DROP COLUMN IF EXISTS new_column;

COMMIT;
```
