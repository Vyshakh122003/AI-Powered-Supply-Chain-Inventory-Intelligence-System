# StockSense AI Product Documentation

## Product Overview

StockSense AI is a web-based inventory management and intelligence system designed specifically for small Indian retail (kirana) stores. The system helps store owners prevent stockouts and overstock situations through automated monitoring, AI-powered predictions, and proactive alerts delivered via WhatsApp - the platform store owners already use daily.

**Core Value Proposition:** Never run out of stock again by leveraging enterprise-level inventory intelligence at zero cost, designed for the small store owner.

## System Architecture

- **Frontend:** React 19 SPA (JavaScript/JSX, Vite 8, Tailwind CSS v4, React Router 7)
- **Backend:** n8n workflow automation (JSON exports in `backend/`, not traditional code)
- **Database:** PostgreSQL via Supabase (schema in `database/schema.sql`)
- **AI/LLM:** Groq API (Llama 3.1 8B) invoked through n8n workflows
- **No TypeScript, no Python, no server-side code** in this repo

## User Interface & Pages

### 1. Landing Page (`/`)

**Purpose:** Introduction to StockSense AI for new visitors
**Layout:**
- Header with navigation (Sign In / Get Started buttons)
- Hero section with main value proposition: "Never run out of stock again"
- Features showcase (6 cards with icons):
  - Smart Inventory Tracking (BarChart3 icon)
  - AI-Powered Reorder Suggestions (Brain icon)
  - Proactive Stock Alerts (AlertTriangle icon)
  - Supplier Intelligence (Truck icon)
  - WhatsApp Notifications (MessageCircle icon)
  - Built for Kirana Stores (Package icon)
- Stats section showing key metrics
- "How it works" 3-step explanation:
  1. Add your products
  2. AI analyzes patterns
  3. Get actionable alerts
- Call-to-action to sign up
- Footer with project info

### 2. Authentication Pages

#### Login Page (`/login`)
**Purpose:** User sign-in
**Components:**
- Store logo and title
- Form with email/phone and password fields
- "Forgot password?" link
- Sign in button
- Link to signup page
- Social login options (if implemented)

#### Signup Page (`/signup`)
**Purpose:** New user registration
**Components:**
- Store logo and title
- Registration form:
  - Full name
  - Email/phone
  - Password
  - Confirm password
- Terms and conditions checkbox
- Create account button
- Link to login page

#### Reset Password Page (`/reset-password`)
**Purpose:** Password recovery
**Components:**
- Email/phone input
- Reset password button
- Instructions for checking email/SMS

### 3. Onboarding Flow (`/onboarding`)
**Purpose:** Initial store setup after authentication
**Layout:** Multi-step form with progress indicator
**Steps:**
1. **Store Details:**
   - Store name input
   - Store type selection (Kirana/Grocery/Pharmacy/etc.)
   - City selection dropdown
2. **Owner Details:**
   - Owner name input
   - Phone number input
   - WhatsApp numbers for alerts (comma-separated)
3. **Preferences:**
   - Safety factor slider/input (1.0-3.0, default 1.5)
   - Default lead time in days input (1-30, default 3)
**Completion:** Saves profile and redirects to dashboard

### 4. Dashboard (`/dashboard`)
**Purpose:** Main overview of store inventory health
**Layout:** Responsive grid with key metrics and visualizations

**Header Section:**
- Page title: "Dashboard"
- Current date (formatted: Friday, 14 March 2026)
- Action buttons:
  - Run Pipeline button (triggers n8n workflows)
  - Send WhatsApp Alert button

**Metrics Grid (5 cards):**
1. **Inventory Health Score** (prominent large number):
   - Color-coded (red/yellow/green based on score)
   - Label: "Inventory Health"
2. **Active Alerts** (orange accent):
   - AlertTriangle icon
   - Count of active alerts
3. **Pending Reorders** (blue accent):
   - ShoppingCart icon
   - Count of pending reorder suggestions
4. **High Risk** (red accent):
   - ShieldAlert icon
   - Count of high-risk products (stock > 0)
5. **Out of Stock** (gray accent):
   - PackageX icon
   - Count of products with zero stock

**Critical Products Table:**
- Title: "Needs Attention" (with pulsing red dot)
- Shows products that are HIGH risk or OUT OF STOCK
- Sorted by days to stockout (ascending)
- Columns: Product Name, Stock, Threshold, Days Left (color-coded pill), Risk, Supplier
- Empty state: Green checkmark with "All products are well stocked" message

**Health Trend Chart:**
- Title: "Health Score — Last 30 Days"
- Area chart showing historical health scores
- Current day highlighted
- Empty state message: "Run the pipeline to start tracking health score over time"

**Pipeline Execution Overlay:**
- Appears when pipeline is running
- Shows current step in process (5 steps):
  1. Initializing orchestration...
  2. Simulating daily stock depletion...
  3. Calculating stockout risks...
  4. AI generating reorder plans...
  5. Updating dashboard health metrics...
- Shows results when complete

### 5. Products Page (`/products`)
**Purpose:** Complete inventory management
**Layout:**
- Header: "Products" title with total count
- Action buttons: Import CSV, Add Product
- Filters bar:
  - Search input (product name)
  - Risk level dropdown (ALL/HIGH/MEDIUM/LOW)
  - Category dropdown (populated from data)
  - Out of Stock Only toggle button
- Product table with columns:
  - Product (name)
  - Category
  - Supplier (with lookup)
  - Stock (editable inline)
  - Threshold (editable inline)
  - Days to Stockout (display only)
  - Risk (color-coded badge)
  - Unit Price (formatted currency)
  - Actions (Edit/Delete inline controls)
- Pagination controls at bottom
- Modals:
  - Add Product Form (all fields)
  - CSV Import (with format instructions)

**Inline Editing:**
- Clicking on editable fields converts them to inputs
- Save (check) and Cancel (x) buttons appear
- Changes sent via webhook to n8n for processing

### 6. Alerts Page (`/alerts`)
**Purpose:** View and manage stock alerts
**Layout:**
- Header: "Stock Alerts" title with count
- Filter tabs: Active/Dismissed
- Dismiss All button (for Active alerts)
- Alert cards displayed in responsive grid:
  - Active alerts: Orange border with AlertTriangle icon
  - Dismissed alerts: Gray border with CheckCircle2 icon
  - Each card shows:
    - Product name
    - Current Stock vs Reorder Threshold (with visual progress bar)
    - Alert date
    - Alert type (if available)
    - Dismiss button (for active alerts)

### 7. Reorder Suggestions Page (`/reorder`)
**Purpose:** Review and act on AI-generated reorder recommendations
**Layout:**
- Header: "Reorder Suggestions" title with count
- Filter tabs: Pending/Approved/Dismissed
- Suggestion cards in responsive grid:
  - Pending: Blue border with RotateCcw icon
  - Approved: Green border with RotateCcw icon
  - Dismissed: Gray border
  - Each card shows:
    - Product name (with AI sparkle badge if AI-generated)
    - Supplier name
    - Suggested quantity
    - Estimated cost (formatted currency)
    - Suggestion date
    - Approval date (if approved)
    - Reason (expandable section)
    - Action buttons:
      - Pending: Approve/Dismiss buttons
      - Approved: WhatsApp Supplier button (opens WhatsApp with pre-filled message)

### 8. Suppliers Page (`/suppliers`)
**Purpose:** Manage supplier information and performance
**Layout:**
- Header: "Suppliers" title with count
- Action button: Add Supplier
- Supplier Performance section (top 5):
  - Horizontal bar charts showing composite score (0-100)
  - Color-coded by score ranges (green/yellow/orange/red)
  - Grade badge display
- Suppliers table with columns:
  - Supplier (name + contact person)
  - Grade (color-coded badge)
  - Score (0-100)
  - Reliability (/10)
  - Price (/10)
  - Delivery (days)
  - Categories (comma-separated)
  - Actions (Edit/Delete inline controls)
- Add Supplier Modal:
  - Supplier name
  - Contact person
  - Phone number
  - Email
  - Delivery time days
  - Supplies categories (comma-separated)

### 9. Quick Update Page (`/quick-update`)
**Purpose:** Rapid stock level updates
**Layout:**
- Header: "Quick Update" title
- Search/filter bar (similar to Products page)
- Table with inline editing focused on stock levels:
  - Product name
  - Category
  - Current Stock (primary editable field)
  - Reorder Threshold
  - Days to Stockout
  - Risk level
  - Supplier
- Designed for quick barcode scanner or manual entry workflows

### 10. Deliveries Page (`/deliveries`)
**Purpose:** Track incoming and outgoing deliveries
**Layout:**
- Standard table layout with delivery tracking information
- Fields likely include: delivery ID, supplier, products, quantities, expected date, actual date, status

### 11. Settings Page (`/settings`)
**Purpose:** Configure system preferences and integrations
**Layout:**
- Form-based interface for:
  - Store profile editing
  - Notification preferences (WhatsApp timing)
  - AI model settings
  - Workflow configuration
  - Data export/import options
  - Account management

### 12. System Logs Page (`/logs`)
**Purpose:** Monitor system activity and workflow executions
**Layout:**
- Table view of system logs with:
  - Timestamp
  - Workflow name
  - Status (success/failed)
  - Details/message
- Filtering and search capabilities

## Key Features Visualized

### 1. AI-Powered Intelligence
- **Dashboard Health Score:** Calculated algorithmically from product risk levels
- **Reorder Suggestions:** Generated by Llama 3.1 via Groq AI analyzing:
  - Current stock levels
  - Average daily sales rate
  - Days until stockout
  - Supplier lead times
  - Safety factor preferences
- **Reasoning Display:** Each AI suggestion includes a plain-language explanation

### 2. WhatsApp Integration
- **Automated Alerts:** Daily morning messages at user-configurable time
- **Smart Anti-Spam:** Prevents duplicate alerts for unchanged stock levels
- **Direct Supplier Contact:** One-click WhatsApp messaging to suppliers from reorder suggestions
- **Owner Notifications:** Critical alerts sent directly to owner's WhatsApp

### 3. Real-Time Monitoring
- **Live Data Updates:** Supabase real-time subscriptions keep UI synchronized
- **Automatic Refresh:** Dashboard updates when data changes in background
- **Pipeline Monitoring:** Visual indicator shows when automated workflows are running

### 4. Mobile-First Design
- **Responsive Layout:** All pages adapt to mobile screen sizes
- **Bottom Navigation:** Mobile-specific tab bar for quick access
- **Touch-Friendly Controls:** Appropriate sizing for touch interactions
- **Offline Indicator:** Visual warning when device loses connectivity

### 5. Kirana Store Optimizations
- **Simple Data Entry:** Minimal fields required to get started
- **Familiar Terminology:** Uses terms store owners understand
- **WhatsApp-Centric:** Leverages the most-used app in target demographic
- **Visual Indicators:** Color-coding and icons reduce language barriers
- **Quick Workflows:** Designed for rapid updates during store operations

## Technical Implementation Details

### State Management
- **React Context:** Used for authentication state (`AuthContext`)
- **Local State:** `useState` hooks for component-level state
- **Real-Time Subscriptions:** Supabase channels for live updates
- **URL State:** Filters and pagination preserved in query parameters

### Data Flow
1. User interacts with UI (e.g., updates stock level)
2. Change sent to Supabase via direct API or n8n webhook
3. Supabase triggers real-time subscription
4. Affected components refresh data
5. n8n workflows may be triggered for AI processing
6. Results stored back in Supabase
7. UI updates to reflect new state

### Styling System (Tailwind CSS v4)
- **Color Tokens:** `text-primary`, `bg-accent`, `text-muted`, `bg-surface`, `border-border`
- **Component Styles:**
  - Cards: `bg-white rounded-xl border border-border p-5`
  - Inputs: `w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent`
  - Buttons: `inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer`
- **Icons:** lucide-react library for consistent vector icons
- **Charts:** recharts library for health trend visualization

### Security & Privacy
- **Authentication:** Supabase Auth with email/password
- **Data Isolation:** Multi-tenant via `store_id` foreign key on all tables
- **Environment Variables:** All secrets stored in `.env` (never committed)
- **API Keys:** Supabase and n8n keys accessed only client-side

## User Journey Example

1. **Ramesh** (kirana store owner) visits StockSense AI website
2. Clicks "Get Started" on landing page
3. Creates account with email and password
4. Completes onboarding:
   - Enters store name: "Ramesh General Store"
   - Selects store type: "Kirana / General Store"
   - Chooses city: "Vijayawada"
   - Enters owner name and phone
   - Adds WhatsApp number for alerts
   - Sets safety factor to 1.5 (default)
   - Sets lead time to 3 days (default)
5. System saves profile and redirects to dashboard
6. Initially sees empty state messages prompting to add products
7. Navigates to Products page and adds initial inventory:
   - Britannia Biscuits: 50 units, threshold 20, sells 5/day
   - Local Bread: 30 units, threshold 10, sells 8/day
   - Milk Packets: 20 units, threshold 15, sells 4/day
8. Returns to dashboard - sees inventory health score based on current stock
9. Triggers pipeline manually or waits for automated daily run
10. AI analyzes sales patterns and predicts:
    - Bread will stock out in 2 days (HIGH risk)
    - Biscuits will stock out in 8 days (MEDIUM risk)
    - Milk is safe for 3 days (LOW risk)
11. Receives WhatsApp alert at 8:00 AM next morning:
    ```
    StockSense AI Alert
    ⚠️ Local Bread: 2 days left (30 units, sells 8/day)
    ⚠️ Britannia Biscuits: 8 days left (50 units, sells 5/day)
    📊 View Dashboard: [link]
    ```
12. Opens WhatsApp link, logs into dashboard
13. Views Reorder Suggestions page showing AI recommendations:
    - Order 40 units of Local Bread (explanation: covers 5 days + safety buffer)
    - Order 30 units of Britannia Biscuits (explanation: covers 6 days + safety buffer)
14. Approves suggestions and clicks "WhatsApp Supplier" to place orders
15. Receives deliveries, updates stock levels via Quick Update page
16. Continues daily cycle with automated alerts and recommendations

## Success Metrics Visualized

The system tracks and displays:
- **Inventory Health Score** (0-100): Overall store inventory efficiency
- **Stockout Prevention:** Reduction in out-of-stock incidents
- **Overstock Reduction:** Decrease in expired/wasted inventory
- **Order Accuracy:** Alignment between suggested and actual orders
- **Response Time:** Speed of acting on AI recommendations
- **WhatsApp Engagement:** Open and action rates on alerts

## Customization Points

Store owners can adjust:
- **Safety Factor:** Inventory buffer multiplier (1.0-3.0)
- **WhatsApp Alert Time:** When to receive daily notifications
- **Notification Thresholds:** How far in advance to warn about stockouts
- **AI Model Parameters:** Influence on suggestion generation (advanced)
- **Workflow Triggers:** When automated pipelines run

## Future Enhancements (Visualized in Code Structure)

The modular architecture supports:
- **Barcode Scanner Integration:** For rapid product lookup
- **Voice Input:** For hands-free data entry
- **Advanced Analytics:** Sales trends and forecasting visualizations
- **Multi-Store Management:** For owners with multiple locations
- **Supplier Portal:** For suppliers to view orders and update catalogs
- **Financial Reporting:** Profit/loss tied to inventory decisions