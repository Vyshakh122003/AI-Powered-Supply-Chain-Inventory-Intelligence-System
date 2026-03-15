# AGENTS.md — StockSense AI

> Guidance for AI coding agents operating in this repository.

## Project Overview

StockSense AI is an inventory intelligence system for small Indian retail (kirana) stores.
- **Frontend:** React 19 SPA (JavaScript/JSX, Vite 8, Tailwind CSS v4, React Router 7)
- **Backend:** n8n workflow automation (JSON exports in `backend/`, not traditional code)
- **Database:** PostgreSQL via Supabase (schema in `database/schema.sql`)
- **AI/LLM:** Groq API (Llama 3.1 8B) invoked through n8n workflows
- **No TypeScript, no Python, no server-side code** in this repo

## Repository Layout

```
frontend/          React SPA — all frontend source code
  src/
    components/    Reusable UI components (modals, badges, cards, layout)
    contexts/      React Context providers (AuthContext)
    lib/           Utility modules (supabase client, config, helpers)
    pages/         Route-level page components
  public/          Static assets
backend/           n8n workflow JSON exports (WF-01 through WF-08)
database/          SQL schema, seed data, migrations
docs/              Project proposal and review documents
```

## Build / Lint / Test Commands

All commands run from the `frontend/` directory:

```sh
npm install --legacy-peer-deps   # Install dependencies (legacy flag required)
npm run dev                      # Start Vite dev server on http://localhost:5173
npm run build                    # Production build to frontend/dist/
npm run lint                     # Run ESLint (flat config, ESLint 9)
npm run preview                  # Preview production build locally
```

**There is no test framework configured.** No test runner, no test files, no test commands
exist. If you need to add tests, Vitest is the recommended choice (already Vite-based).

## Environment Variables

Copy `frontend/.env.example` to `frontend/.env` and fill in values:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_N8N_BASE_URL` | n8n instance URL (ngrok or direct) |
| `VITE_N8N_API_KEY` | n8n API key for workflow triggers |

All are prefixed `VITE_` for Vite client-side access. Never commit `.env` files.

## ESLint Configuration

Flat config in `frontend/eslint.config.js` (ESLint 9):
- Extends: `js.configs.recommended`, `reactHooks`, `reactRefresh`
- `no-unused-vars` set to `error` but ignores vars matching `^[A-Z_]`
- Targets `**/*.{js,jsx}`, ignores `dist/`
- No Prettier — no auto-formatting tool is configured

## Code Style Guidelines

### File & Component Structure

- **All components are functional** with default exports: `export default function Name() {}`
- **No class components**, no named exports for components
- Component/page files use **PascalCase**: `Dashboard.jsx`, `AddProductModal.jsx`
- Utility/lib files use **camelCase**: `config.js`, `helpers.js`, `supabase.js`
- One component per file

### Import Ordering

Follow this consistent order (no blank lines between groups):
1. React hooks (`useState`, `useEffect`, `useRef`, `useMemo`)
2. React Router (`Navigate`, `NavLink`, `useNavigate`, `useLocation`)
3. Internal contexts/hooks (`useAuth` from `../contexts/AuthContext`)
4. Internal libs (`supabase`, `config`, `helpers`)
5. Internal components (`KPICard`, `EmptyState`, `RiskBadge`)
6. Third-party libraries (`react-hot-toast`, `@tremor/react`, `recharts`)
7. Icons from `lucide-react` (always last, single destructured import)

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Components | PascalCase | `AddProductModal`, `KPICard` |
| State variables | camelCase | `showAddModal`, `editData` |
| Event handlers | `handle` prefix | `handleSubmit`, `handleChange` |
| Data fetchers | `fetch` prefix | `fetchProducts`, `fetchAlerts` |
| Boolean state | descriptive | `loading`, `saving`, `isOffline` |
| DB columns | snake_case | `product_id`, `avg_daily_sales` |
| DB table names | PascalCase with spaces | `"Store Profiles"`, `"Stock Alerts"` |

### State Management

- **React Context** for auth (`AuthContext.jsx` providing `useAuth()` hook)
- **Local `useState`** for page-level state — no Redux/Zustand
- **Supabase Realtime** subscriptions for live updates; always clean up:
  ```jsx
  useEffect(() => {
    const channel = supabase
      .channel('channel-name')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Table' }, () => fetchData())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])
  ```

### Error Handling

- **try/catch with toast** for all async operations:
  ```jsx
  try {
    const { data, error } = await supabase.from('Products').select('*')
    if (error) throw error
    setProducts(data || [])
  } catch {
    toast.error('Failed to load products')
  } finally {
    setLoading(false)
  }
  ```
- Use empty `catch {}` (no error variable) when the message is not needed
- Use `catch (err)` with `err.message` when error details are displayed
- No error boundaries — errors are handled at the function level
- Use `console.error` sparingly (only for auth/critical flows)

### Styling (Tailwind CSS v4)

- Tailwind v4 with `@tailwindcss/vite` plugin — no `tailwind.config.js`
- Custom theme tokens in `src/index.css` via `@theme` directive
- Use project tokens: `text-primary`, `bg-accent`, `text-muted`, `bg-surface`, `border-border`
- Standard card: `bg-white rounded-xl border border-border p-5`
- Standard input: `w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent`
- Standard button: `inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer`
- All styling is inline Tailwind classes — no CSS extraction or CSS modules

### Modal Pattern

All modals follow this structure:
- Props: `isOpen`, `onClose`, `onSuccess`
- Guard: `if (!isOpen) return null`
- Overlay: `fixed inset-0 bg-black/50` with centered container
- Header with title + X close button, form body with `space-y-4`, footer with Cancel + Submit

### Data Access

- Direct Supabase client calls from page components (no service/repository layer)
- Table names in queries use PascalCase with spaces: `supabase.from('Stock Alerts')`
- n8n webhooks via `triggerWebhook()` / `postWebhook()` from `lib/config.js`
- n8n API triggers via `apiTriggerWorkflow(workflowId)` from `lib/config.js`

### Database Conventions

- Table names: PascalCase with spaces (`"Products"`, `"Reorder Suggestions"`)
- Column names: snake_case (`days_to_stockout`, `estimated_stockout_date`)
- Primary keys: UUID via `gen_random_uuid()`
- Multi-tenancy: all data tables include `store_id` (UUID FK to `"Store Profiles"`)
- Migrations: sequential numbering `001_description.sql` (in `database/migrations/`)

## Git Conventions

- Branch: `main` (single branch)
- Commit style: Conventional Commits — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Keep messages concise and descriptive of the "why"
- **Always commit and push after every change** — GitHub must stay up to date at all times.
  Stage all relevant files, commit with a proper message, and `git push` to `origin/main`
  immediately. Never leave changes uncommitted or unpushed.

## Vite Dev Server

- Strict port 5173
- Proxies `/webhook/*` and `/api/v1/*` to `VITE_N8N_BASE_URL` (avoids CORS in dev)
- Production builds must handle n8n URLs directly via env vars
