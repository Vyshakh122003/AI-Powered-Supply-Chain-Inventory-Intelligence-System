# GStack User Manual for StockSense AI
**A Non-Technical Guide to Using GStack to Complete Your Project Successfully**

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [What is GStack? (Simple Explanation)](#what-is-gstack-simple-explanation)
3. [Why Use GStack for StockSense AI?](#why-use-gstack-for-stocksense-ai)
4. [The AI Team Concept](#the-ai-team-concept)
5. [How to Use GStack: Step-by-Step Tutorials](#how-to-use-gstack-step-by-step-tutorials)
6. [GStack Skills Explained in Plain English](#gstack-skills-explained-in-plain-english)
7. [Real-World Workflows for Your Project](#real-world-workflows-for-your-project)
8. [Troubleshooting & Common Issues](#troubleshooting--common-issues)
9. [Next Steps & Recommendations](#next-steps--recommendations)

---

## Quick Start

If you just want to get going without reading everything:

### 1. You Already Have GStack Installed
GStack is already in `~/gstack/` on your system. Great! It's ready to use.

### 2. Basic Command Format
In Claude Code or any AI agent with gstack, you'll run commands like:
```
/skill-name
```

For example:
```
/office-hours
```

That's it. The AI agent handles the rest.

### 3. First Thing to Try
Try this in Claude Code:
```
Load gstack. Run /office-hours
```

GStack will ask you 6 smart questions to rethink your current task. Expect it to take 5-10 minutes and output a design document.

---

## What is GStack? (Simple Explanation)

### The One-Sentence Version
**GStack is an AI engineering team in a box** — it gives Claude (or other AI agents) 23+ specialized "skills" to write better code, design better products, catch bugs, and ship to production.

### Think of It Like This

Imagine you're building StockSense AI and you need:
- Someone to think through the product ideas before coding
- A designer to audit your UI and suggest fixes
- An engineer to review your code for bugs
- A QA tester to click through and find problems
- A deployment engineer to ship it safely
- A project manager to keep track of what was done

Normally, you'd hire 6+ people. **GStack is a one-command way to get AI to do all those jobs**, one after another, in the right order.

### The Key Innovation: Persistent Browser

GStack includes a **persistent headless browser** — basically, a Chrome window that runs in the background, controlled by AI. When GStack needs to test your website, it opens the site, clicks buttons, fills forms, takes screenshots, and reports what it finds.

This is huge because:
- The AI can see your actual website running
- It's not just reading code — it's testing real behavior
- It can catch bugs that code review would miss

---

## Why Use GStack for StockSense AI?

### Your Project Status Right Now

StockSense AI is:
- ✅ Frontend: Fully built (React, 14 routes, all UI components done)
- ✅ Backend: 8 n8n workflows designed (product intelligence, reorder AI, alerts, etc.)
- ✅ Database: Schema complete (8 tables, multi-tenant ready)
- ✅ Features: Inventory tracking, stock alerts, AI suggestions, WhatsApp notifications

**But what's missing:**
- ❌ No testing framework (tests are critical for deployment)
- ❌ No security audit (multi-tenant systems need rock-solid isolation)
- ❌ No end-to-end testing (you don't know if the full workflow works)
- ❌ No deployment automation (shipping to production is manual)
- ❌ No performance benchmarking (you don't know if it's fast enough)
- ❌ No documentation for how to operate it
- ❌ No systematic way to catch bugs before users find them

### How GStack Fixes This

| Problem | GStack Skill | What It Does |
|---------|--------------|-------------|
| Product wasn't thought through fully | `/office-hours` | Questions to make sure you're building the right thing |
| Architecture could be wrong | `/plan-eng-review` | Locks down the technical design, finds edge cases |
| UI might have problems | `/design-review` | Audits your React components, suggests fixes |
| Code might have bugs | `/review` | Reads your code like a senior engineer, catches obvious bugs |
| You don't know if it actually works | `/qa` | Tests your app in a real browser, finds bugs, makes tests |
| Deployment is scary | `/ship` | Automates PR creation and testing |
| After shipping, things might break | `/canary` | Watches for errors after you deploy |
| Docs get outdated | `/document-release` | Auto-updates docs to match what shipped |

### The Bottom Line

With GStack, you get **professional engineering rigor** (code review, QA, security audit, deployment) **from AI**, in **1-2 hours**, instead of taking **weeks** to hire and onboard humans.

---

## The AI Team Concept

GStack works by organizing AI work like a real engineering team. Here's the "team" you get:

### Your Virtual Team (Available via GStack)

1. **CEO** (`/office-hours` + `/plan-ceo-review`)
   - Role: Product thinker
   - What they do: Asks 6 hard questions before you code to make sure you're building the right thing
   - Time: 10-15 minutes
   - Output: Design document with decisions

2. **Engineering Manager** (`/plan-eng-review`)
   - Role: Architecture lockdown
   - What they do: Forces you to explain data flow, edge cases, failure modes, test plan
   - Time: 15-20 minutes
   - Output: Architecture diagram + test matrix

3. **Senior Designer** (`/plan-design-review` + `/design-review`)
   - Role: UX/UI audit
   - What they do: Rates your UI on 10 dimensions (spacing, color contrast, mobile, accessibility), finds gotchas
   - Time: 15-25 minutes per phase
   - Output: Design audit report + fixes

4. **Staff Engineer** (`/review`)
   - Role: Code reviewer
   - What they do: Reads your code looking for bugs that tests miss (race conditions, missing error handling, etc.)
   - Time: 5-10 minutes
   - Output: Bug report + some auto-fixes

5. **QA Lead** (`/qa`)
   - Role: Tester
   - What they do: Clicks through your app in a real browser, finds bugs, generates regression tests
   - Time: 20-30 minutes
   - Output: Bug report + test code

6. **Release Engineer** (`/ship` + `/land-and-deploy`)
   - Role: Deployment
   - What they do: Creates PR, runs tests, merges, deploys, verifies health
   - Time: 10-15 minutes
   - Output: Feature shipped to production

7. **SRE** (`/canary`)
   - Role: Post-deployment monitoring
   - What they do: Watches for console errors, performance drops, crashes in the first hour post-ship
   - Time: 5-10 minutes of monitoring
   - Output: Health report or alert

8. **Chief Security Officer** (`/cso`)
   - Role: Security
   - What they do: OWASP security audit, finds injection bugs, auth flaws, data isolation issues
   - Time: 10-15 minutes
   - Output: Threats + fixes

9. **Technical Writer** (`/document-release`)
   - Role: Documentation
   - What they do: Updates README, API docs, architecture docs to match what shipped
   - Time: 5 minutes
   - Output: Docs that match reality

### The Process (In Order)

```
THINK → PLAN → BUILD → REVIEW → TEST → SHIP → MONITOR → REFLECT
```

Real teams do this. GStack automates your side of the conversation.

---

## How to Use GStack: Step-by-Step Tutorials

### Tutorial 1: The Five-Minute Brain Dump

**Goal:** Get GStack to think through a feature before you code it

**Steps:**

1. Open Claude Code
2. Paste this:
   ```
   Load gstack. Run /office-hours
   ```
3. GStack will ask you 6 questions like:
   - What problem are you solving?
   - Who is this for?
   - What would a 10/10 solution look like?
   - What constraints matter most?
   - What could go wrong?
   - What are you not building?

4. Answer each question (2-3 sentences each)
5. GStack outputs a design document
6. Save this document in your project somewhere (shows your thinking)

**Time:** 10 minutes  
**When to use:** Before coding ANY new feature

---

### Tutorial 2: Design a New Dashboard Widget

**Goal:** Have GStack design a new UI component for StockSense AI

**Scenario:** You want to add a "quick health check" widget to the Dashboard that shows current problems.

**Steps:**

1. In Claude Code, run:
   ```
   Load gstack. Run /design-consultation
   ```

2. GStack asks:
   - What's the widget for?
   - Who looks at it? (store owner, manager, etc.)
   - What data should it show?
   - How should problems look? (colors, icons, alerts?)

3. Answer the questions
4. GStack outputs:
   - Design principles
   - Color scheme
   - Layout proposal
   - Accessibility considerations

5. Approve or ask for changes
6. Run:
   ```
   Load gstack. Run /design-html
   ```

7. GStack generates production React code for the widget
8. Copy the component into your `frontend/src/components/` folder

**Time:** 30-40 minutes  
**Output:** A fully designed, accessible, production-ready React component

---

### Tutorial 3: Code Review Before You Know You Need One

**Goal:** Have GStack find bugs in your code before they reach users

**Steps:**

1. You just finished coding a new feature (e.g., the new Dashboard widget)
2. In Claude Code, run:
   ```
   Load gstack. Run /review
   ```

3. GStack reads your code and looks for:
   - Missing error handling (what if the API fails?)
   - Race conditions (what if data changes while loading?)
   - Missing validation (what if bad data comes in?)
   - Accessibility gaps
   - Performance issues

4. GStack outputs a report:
   - Bugs it found
   - Bugs it auto-fixed
   - Bugs it flagged for you to decide on

5. You review each finding and approve fixes

**Time:** 5-10 minutes  
**Benefit:** Catches bugs before QA, before users, before production

---

### Tutorial 4: Test Your App in a Real Browser

**Goal:** Have GStack click through your app and find bugs

**Prerequisites:**
- Your React app is running locally (`npm run dev`)
- Or you have a staging URL deployed somewhere

**Steps:**

1. Start your app:
   ```bash
   cd frontend
   npm run dev
   ```
   (Your app now runs on http://localhost:5173)

2. In Claude Code, run:
   ```
   Load gstack. Run /qa http://localhost:5173
   ```

3. GStack:
   - Opens your app in a real Chrome browser
   - Clicks through different flows (login, add product, view alerts, etc.)
   - Takes screenshots
   - Compares what it sees to what should happen
   - Finds bugs (button didn't work, page didn't load, etc.)

4. For each bug found, GStack:
   - Describes what went wrong
   - Writes a test case so it doesn't break again
   - Offers to fix it

5. You approve fixes or ask for changes

**Time:** 20-30 minutes for a full app test  
**Output:** 
- List of bugs found
- Test code to prevent regression
- Option to auto-fix bugs

---

### Tutorial 5: Deploy Your Feature (The Safe Way)

**Goal:** Get your code to production without the panic

**Prerequisites:**
- Your code is committed to git
- Your feature is reviewed and tested
- You're confident it works

**Steps:**

1. In Claude Code, run:
   ```
   Load gstack. Run /ship
   ```

2. GStack:
   - Syncs your code with main branch
   - Runs all your tests (to make sure nothing broke)
   - Creates a PR on GitHub
   - Adds a summary of what's new

3. You review the PR in GitHub
4. Click "Merge" if it looks good
5. Back in Claude Code, run:
   ```
   Load gstack. Run /land-and-deploy
   ```

6. GStack:
   - Waits for automated tests to finish
   - Deploys to production
   - Checks that your app is healthy (loads, no errors, fast enough)
   - Confirms: "Deployed ✓"

7. Run:
   ```
   Load gstack. Run /canary
   ```

8. GStack watches your app for 5-10 minutes after deployment:
   - Looks for console errors
   - Checks page load time
   - Looks for crashes

**Time:** 15-20 minutes  
**Benefit:** Professional deployment with safety checks

---

## GStack Skills Explained in Plain English

### Skills for THINKING Phase
*Before you code, make sure you're building the right thing*

#### `/office-hours` — The 6 Hard Questions
- **What it does:** Asks 6 forcing questions to make sure you're not building the wrong thing
- **Questions like:**
  - What problem are you actually solving?
  - Who is this for?
  - What would a 10/10 solution look like?
  - What's NOT in scope?
  - What assumptions might be wrong?
- **Time:** 10 minutes
- **When to use:** Before starting ANY new feature
- **Example output:** A one-page design doc with decisions

#### `/plan-ceo-review` — The Product Rethink
- **What it does:** CEO-mode thinking — "What are we actually building here?"
- **Example:** You say "add upload button" → CEO says "you're actually building a seller rating system where product photos matter"
- **Modes:** Scope Expansion, Hold Scope, Reduce Scope
- **Time:** 15 minutes
- **When to use:** After `/office-hours` to validate direction
- **Output:** Expanded design doc with product decisions

---

### Skills for PLANNING Phase
*Architecture, design, testing plan, before you code*

#### `/plan-eng-review` — Architecture Lockdown
- **What it does:** Engineering manager mode — forces you to explain:
  - How data flows through your system
  - What happens if things break (failure modes)
  - Edge cases (timezone changes, simultaneous requests, etc.)
  - What to test
- **Time:** 20 minutes
- **Example:** You build "send WhatsApp alert" → Engineer asks: "What if Twilio is down? What if the store owner's number changed? What if they already got the alert 2 minutes ago?"
- **Output:** Architecture doc + test plan
- **When to use:** After `/office-hours` before you code

#### `/plan-design-review` — UI/UX Audit (Before You Design)
- **What it does:** Senior designer audits your PLAN for UX gotchas
- **Looks for:**
  - Spacing issues (too cramped? too big?)
  - Color contrast (readable for color-blind users?)
  - Mobile (will this work on small screens?)
  - Accessibility (keyboard navigation, screen readers?)
  - Affordances (is it obvious what to click?)
- **Time:** 20 minutes
- **Rates things 0-10:** "Your proposed layout is 3/10. Here's what 8 looks like..."
- **When to use:** Before you design
- **Output:** Design feedback + suggestions

#### `/plan-devex-review` — Developer Experience Audit
- **What it does:** Audit how easy it is to set up and use your project
- **Questions:** How long until a new dev can build their first feature? Where do they get stuck? What docs are missing?
- **Time:** 20-30 minutes
- **Output:** DX roadmap, missing docs, setup friction points
- **When to use:** When onboarding new team members or before open-sourcing

#### `/autoplan` — All Planning Skills at Once
- **What it does:** Runs `/office-hours` + `/plan-ceo-review` + `/plan-eng-review` automatically
- **Time:** 40-45 minutes for full plan
- **When to use:** Starting a major feature
- **Output:** Complete product + engineering plan

---

### Skills for DESIGN Phase
*Make your UI beautiful and usable*

#### `/design-consultation` — Design System from Scratch
- **What it does:** AI designs a complete design system for you
- **Includes:**
  - Color palette (primary, accent, error, warning, success)
  - Typography scale (headings, body, small)
  - Component styles (buttons, cards, inputs)
  - Spacing rules
  - Responsive breakpoints
- **Time:** 30 minutes
- **Output:** DESIGN.md file + CSS/Tailwind code
- **When to use:** Starting a new visual project or redesigning

#### `/design-shotgun` — Generate 4-6 UI Variants
- **What it does:** AI generates 4-6 different design options, opens comparison board
- **Workflow:**
  1. You describe what you want ("Dashboard widget showing inventory health")
  2. GStack generates 4 variants with AI image generation
  3. Opens browser, shows all 4 side-by-side
  4. You pick your favorite
  5. Leave feedback ("I like the green but make the text bigger")
  6. GStack learns your taste and generates 4 more, better variants
  7. Repeat until you love it
- **Time:** 20-30 minutes
- **When to use:** Designing anything visual
- **Output:** Your favorite design variant (approved by you)

#### `/design-html` — Convert Mockup to Production Code
- **What it does:** Takes the design you approved and outputs production React code
- **Magic:** 
  - Auto-detects if you use React/Vue/Svelte
  - Generates responsive HTML (text reflows, layouts adjust to screen size)
  - Zero JavaScript dependencies
  - ~30KB overhead
  - Ready to ship
- **Time:** 10 minutes
- **Output:** React component in `frontend/src/components/`
- **When to use:** After you approve a design

#### `/design-review` — Audit Live Website
- **What it does:** Audits your actual live website (or localhost) against 80-point design checklist
- **Checks:**
  - Contrast (readable?)
  - Spacing (consistent?)
  - Typography (hierarchy obvious?)
  - Mobile (works on small screens?)
  - Accessibility (keyboard usable? screen reader friendly?)
  - Color (intentional or accidental?)
- **Time:** 20 minutes
- **Output:** 
  - Design audit report
  - Auto-fixes applied (as git commits)
  - Before/after screenshots
- **When to use:** Before shipping a feature

---

### Skills for BUILD Phase
*No GStack skill here — you code normally. Next phase audits it.*

Your job: write the React code, the n8n workflows, the database queries.

GStack gets involved AFTER you build.

---

### Skills for REVIEW Phase
*Code review, bug hunting*

#### `/review` — Staff Engineer Code Review
- **What it does:** AI reads your code like a senior engineer looking for production bugs
- **Finds:**
  - Missing error handling (what if API fails?)
  - Race conditions (what if data changes while loading?)
  - Unvalidated inputs (could someone break this with bad data?)
  - Memory leaks (are you cleaning up?)
  - Security issues (authentication checks in place?)
  - Performance (unnecessary re-renders? N+1 queries?)
- **Time:** 5-10 minutes
- **Output:**
  - Bugs found (with explanations)
  - Auto-fixes suggested for obvious ones
  - Requires your approval for judgment calls
- **When to use:** Before `/qa`, after you write code
- **Bonus:** Can auto-fix formatting, simple logic errors

#### `/investigate` — Root Cause Detective
- **What it does:** AI systematically debugs a problem you describe
- **Methodology:**
  - Form hypothesis
  - Test hypothesis
  - If wrong, form new hypothesis
  - Repeat 3 times max (then recommend escalation)
- **Time:** 15-30 minutes
- **When to use:** "Something is broken but I don't know why"
- **Example:** "After I restock an item, the dashboard doesn't show the new quantity"
- **Output:** Root cause identified + fix suggestion

#### `/codex` — Second Opinion from Different AI
- **What it does:** OpenAI's Codex AI reads your code independently from Claude
- **Modes:**
  - Pass/Fail gate (does it work? yes/no)
  - Adversarial (try to break it)
  - Consultation (general feedback)
- **Time:** 10 minutes
- **When to use:** For critical code, or when you disagree with Claude
- **Benefit:** Two AI brains are better than one

---

### Skills for TEST Phase
*Make sure it actually works*

#### `/qa` — Full QA Cycle in a Real Browser
- **What it does:**
  1. Opens your app in Chrome
  2. Tests main workflows (login, add product, view dashboard, create alert, etc.)
  3. Takes screenshots
  4. Finds bugs
  5. For each bug: creates a test case so it doesn't break again
  6. Offers to auto-fix bugs
- **Time:** 20-40 minutes (depending on app size)
- **Output:**
  - Bug report with screenshots
  - Test code (Jest, Vitest, or Cypress)
  - Option to auto-fix
- **When to use:** Before deployment, after code changes
- **Example:** GStack tests that clicking "Add Product" opens modal, filling form works, submit sends API request
- **Bonus:** Auto-generates regression tests (tests that the same bug doesn't come back)

#### `/qa-only` — Bug Report Without Fixes
- **What it does:** Same as `/qa` but stops at "reporting bugs"
- **Doesn't auto-fix**
- **Time:** 20-40 minutes
- **When to use:** When you want to review bugs before approving fixes

#### `/benchmark` — Performance Testing
- **What it does:**
  - Measures page load time
  - Core Web Vitals (how fast does content show? how smooth is interaction?)
  - Bundle size (is your JS too big?)
  - Compares before/after
- **Time:** 10 minutes
- **Output:** Performance report + trends over time
- **When to use:** Before shipping, if performance matters

---

### Skills for SHIP Phase
*Get to production safely*

#### `/ship` — Create PR + Run Tests
- **What it does:**
  1. Makes sure your code is committed
  2. Syncs with main branch (handles conflicts)
  3. Runs tests (makes sure nothing broke)
  4. Creates PR on GitHub
  5. Adds description, links design doc/architecture
- **Time:** 10 minutes
- **Output:** PR ready for your review on GitHub
- **When to use:** Feature is done, reviewed, tested

#### `/land-and-deploy` — Merge + Deploy to Production
- **What it does:**
  1. You merge PR on GitHub
  2. GStack detects merge
  3. Runs all tests (automated CI)
  4. Deploys to production
  5. Verifies: is it online? Is it fast? Any errors?
  6. Reports: "Deployed ✓"
- **Time:** 10-15 minutes
- **Output:** Feature live in production
- **When to use:** PR is merged, ready to ship

---

### Skills for MONITOR Phase
*Watch for problems after shipping*

#### `/canary` — Post-Deployment Monitoring
- **What it does:** Watches your app for 5-10 minutes after deploy
- **Looks for:**
  - Console errors (did shipping break something?)
  - Performance drops (is it slower now?)
  - Crashes (did the server die?)
  - Failures (can users still access it?)
- **Time:** 5-10 minutes of monitoring
- **Output:** Health report or alert if something's wrong
- **When to use:** Right after `/land-and-deploy`

---

### Skills for DOCUMENT Phase
*Keep docs in sync with reality*

#### `/document-release` — Auto-Update Documentation
- **What it does:**
  - Reads what you just shipped
  - Finds all documentation (README, API docs, ARCHITECTURE, etc.)
  - Updates docs to match reality
  - Catches stale/outdated sections
- **Time:** 5 minutes
- **Output:** Docs that match your code
- **When to use:** After every feature ships

---

### Skills for REFLECT Phase
*Learn and improve*

#### `/retro` — Weekly Retrospective
- **What it does:**
  - Tracks shipping metrics (features shipped, bugs found, test coverage)
  - Identifies patterns (what's working? what's not?)
  - Gives recommendations for next week
- **Time:** 10 minutes
- **Output:** Retro report + suggestions
- **When to use:** End of each week

---

### Skills for SECURITY Phase
*Find vulnerabilities before hackers*

#### `/cso` — Chief Security Officer
- **What it does:** OWASP security audit
- **Checks:**
  - Injection bugs (can someone break your queries with special characters?)
  - Authentication (do you check that users are who they claim?)
  - Authorization (does store A see store B's data? CRITICAL for multi-tenant!)
  - Crypto (are secrets actually secret?)
  - API security (can anyone call your n8n webhooks?)
- **Time:** 15 minutes
- **Output:** Security audit + fixes
- **When to use:** After major features, before production launch, whenever you add auth/data access
- **Why it matters for StockSense:** You have 8 stores sharing one database. If you mess up isolation, store A could see store B's inventory. This is CRITICAL.

---

### Skills for BROWSER CONTROL
*Give AI eyes and hands*

#### `/browse` — Control a Real Browser
- **What it does:** 50+ commands to control a persistent Chrome browser
- **Commands like:**
  - `navigate https://example.com` — Go to a URL
  - `text` — Read all text on page
  - `click @e3` — Click element 3
  - `fill @e5 "new password"` — Type text in form field
  - `screenshot` — Take screenshot
  - `screenshot -d` — Screenshot + show differences from last screenshot
- **Time:** ~100-200ms per command
- **When to use:** When you want AI to see/click your app
- **Benefit:** AI can test real workflows, not just read code

#### `/open-gstack-browser` — Headed Browser with Sidebar AI
- **What it does:** Opens a real Chrome window you can see, with AI sidebar
- **Workflow:**
  - You ask AI a question
  - AI can type in browser, take screenshots, read page
  - AI sidebar shows thinking + results
  - You can see exactly what AI is doing
- **When to use:** Debugging, understanding what AI sees
- **Benefit:** Transparency — you watch AI work in real-time

---

### Skills for UTILITY
*Odds and ends that make workflows smoother*

#### `/setup-browser-cookies` — Import Browser Session
- **What it does:** Imports your browser cookies to GStack browser
- **Why:** So you don't have to log in again every time
- **Steps:**
  1. Log into your app in your real Chrome browser
  2. Run `/setup-browser-cookies`
  3. GStack browser now has your session
- **When to use:** Before running `/qa` on authenticated pages

#### `/learn` — Memory Management
- **What it does:** GStack learns patterns across sessions
- **Learns:**
  - Your code style preferences
  - Bugs you've had before (prevents repeats)
  - Architecture patterns you like
  - Your taste in design
- **Commands:**
  - `review` — See what I learned
  - `forget X` — Forget that preference
  - `export` — Save learnings to file
- **When to use:** Over time, as you use GStack more
- **Benefit:** Future AI work gets better, faster

#### `/careful` — Safety Guardrails
- **What it does:** Warns before destructive commands
- **Examples:** `rm -rf`, `DROP TABLE`, `force-push`
- **You can:** Override any warning if you're sure
- **When to use:** Default behavior (always on)

#### `/freeze` — Lock Files During Debugging
- **What it does:** Restricts AI edits to one directory
- **Example:** "Only edit `/frontend/src/pages/Dashboard.jsx` while we debug this"
- **Benefit:** Prevents accidental changes to unrelated code
- **When to use:** Debugging a complex issue

#### `/pair-agent` — Share Browser with Another AI
- **What it does:** Multiple AI agents control same browser
- **Example:** Claude Code + OpenClaw working together on same project
- **Each agent:** Gets its own tab, can't interfere
- **When to use:** Complex projects needing multiple perspectives

---

## Real-World Workflows for Your Project

### Workflow 1: Add a New Feature (The Professional Way)

**Scenario:** You want to add "Seasonal Demand Tracker" to StockSense AI to help store owners plan for peak seasons.

**Steps:**

```
WEEK 1: PLAN (Mon 9am - Tue 12pm)
```

1. **Monday 9 AM** — Ask GStack to think:
   ```
   Load gstack. Run /office-hours
   ```
   - GStack asks: Who uses this? What data do they need? When? Why is it important?
   - You answer (spend 10 min)
   - Output: Design doc with product decisions

2. **Monday 10 AM** — Get CEO rethink:
   ```
   Load gstack. Run /plan-ceo-review SCOPE EXPANSION
   ```
   - GStack suggests: Maybe this isn't just "seasonal demand" — maybe it's "predictive inventory planning"
   - Output: Expanded scope doc

3. **Monday 11 AM** — Lock down engineering:
   ```
   Load gstack. Run /plan-eng-review
   ```
   - GStack forces you to explain:
     - Where does seasonal data come from? (n8n workflow? manual input? external API?)
     - What if you have no historical data yet?
     - How do you handle timezone differences?
     - What could break?
   - Output: Architecture doc + test plan

4. **Monday 2 PM** — Design the UI:
   ```
   Load gstack. Run /plan-design-review
   ```
   - GStack audits your design idea: "Your 'season picker' is only 2/10. Here's what 8 looks like — color-coded timeline with drag handles"
   - Output: Design feedback

5. **Tuesday 9 AM** — Full design:
   ```
   Load gstack. Run /design-shotgun
   ```
   - GStack generates 4 mockups
   - Browser opens side-by-side
   - You pick favorite: "I like variant 2 but make it more compact"
   - GStack learns and generates 4 more
   - Repeat until you love it

6. **Tuesday 11 AM** — Convert to code:
   ```
   Load gstack. Run /design-html
   ```
   - GStack generates production React component
   - Output: `frontend/src/components/SeasonalDemandTracker.jsx`

```
WEEK 2: BUILD (Tue 2pm - Wed 6pm)
```

7. **Tuesday 2 PM** — You code:
   - Integrate component into `/reports` page
   - Add n8n workflow to calculate seasonal patterns
   - Wire up Supabase queries

8. **Wednesday 2 PM** — Code review:
   ```
   Load gstack. Run /review
   ```
   - GStack finds: "You fetch seasonal data on every page load, but never cache it. That's slow. Let me fix it."
   - Approves auto-fix or review manually
   - Output: 3-5 bugs fixed

9. **Wednesday 3 PM** — UI audit:
   ```
   Load gstack. Run /design-review https://localhost:5173/reports
   ```
   - GStack opens your live page
   - Audits: spacing, contrast, mobile, accessibility
   - Finds: "Title on mobile is cut off, season boxes don't wrap"
   - Output: Auto-fixes applied

10. **Wednesday 4 PM** — Full QA test:
    ```
    Load gstack. Run /qa https://localhost:5173
    ```
    - GStack clicks through your app
    - Tests: Can I add a product? View seasonal trends? Edit seasonal data?
    - Finds: "When I try to drag a season, it doesn't work on mobile"
    - Output: Bug report + test code to prevent repeat

11. **Wednesday 5 PM** — You fix bugs, then:
    ```
    Load gstack. Run /review
    ```
    (Round 2 — make sure your fixes didn't break anything)

```
WEEK 3: SHIP (Thu 9am - Thu 4pm)
```

12. **Thursday 9 AM** — Create PR:
    ```
    Load gstack. Run /ship
    ```
    - GStack syncs code, runs tests, creates PR
    - Output: PR on GitHub ready for review

13. **Thursday 11 AM** — You + team review on GitHub

14. **Thursday 1 PM** — Deploy:
    ```
    Load gstack. Run /land-and-deploy
    ```
    - GStack merges, deploys, verifies
    - Output: "Seasonal Demand Tracker live in production ✓"

15. **Thursday 2 PM** — Monitor:
    ```
    Load gstack. Run /canary
    ```
    - GStack watches for errors for 10 minutes
    - Output: "All systems normal ✓"

16. **Thursday 3 PM** — Update docs:
    ```
    Load gstack. Run /document-release
    ```
    - GStack updates README, API docs, architecture doc
    - Output: Docs match what shipped ✓

17. **Thursday 4 PM** — Weekly retro:
    ```
    Load gstack. Run /retro
    ```
    - GStack summarizes: "Seasonal feature shipped in 5 days. 4 bugs found in QA, all fixed. Test coverage: 78% → 82%"
    - Output: Metrics + recommendations for next week

**Total time for full feature:** ~2 days of actual work  
**Quality level:** Professional — code review, design audit, QA test, security check, deployed safely  
**Confidence level:** Very high — everything was checked multiple times

---

### Workflow 2: Security Audit Before Launch

**Scenario:** StockSense AI is ready for your first real store customer, but you're nervous about data security.

**Steps:**

```
HOUR 1: Security Audit
```

1. **Start:**
   ```
   Load gstack. Run /cso
   ```

2. GStack checks:
   - Can unauthenticated users call your n8n webhooks? ❌ (Would be bad)
   - Do you validate all API inputs? ❌ (Could get SQL injection)
   - Does your multi-tenant isolation work? ❌ (Store A could see Store B's data)
   - Are passwords hashed? ✅ (Supabase handles this)
   - Is your session secure? ⚠️ (Needs HTTPS + secure cookies)

3. GStack output:
   - 7 vulnerabilities found
   - Exploit scenarios for each
   - Recommended fixes

4. **Hour 2-3: You implement fixes**
   - Add API key authentication to n8n webhooks
   - Add SQL injection prevention (Supabase already does this)
   - Add multi-tenant row-level security (RLS) in Supabase
   - Set secure cookie flags

5. **Hour 4: Re-audit:**
   ```
   Load gstack. Run /cso
   ```
   - GStack rechecks
   - All 7 vulnerabilities now fixed ✅

6. **Result:** You have a security audit to show regulators/customers

---

### Workflow 3: Bug Hunt

**Scenario:** Users report: "When I bulk import products, sometimes quantities don't match what I imported."

**Steps:**

1. **Investigate systematically:**
   ```
   Load gstack. Run /investigate
   ```

2. You describe: "Bulk import seems to lose quantity data sometimes"

3. GStack forms hypothesis: "Maybe n8n workflow gets duplicate webhook calls?"
   - Checks n8n logs: "Yes, WF-01 was called 3 times for same import"
   - Root cause: Your frontend was retrying on timeout

4. GStack offers fix: "Add idempotency key to webhook, dedup in n8n"
   - You approve
   - Implements fix

5. Test:
   ```
   Load gstack. Run /qa https://localhost:5173
   ```
   - Tests bulk import 10 times
   - All quantities correct now ✅

---

### Workflow 4: Prepare for a Demo

**Scenario:** You're demoing StockSense AI to potential investors. You want everything perfect.

**Steps:**

```
Before Demo (1 hour)
```

1. **Full QA test** (find demo-breaking bugs):
   ```
   Load gstack. Run /qa https://staging.stocksense.app
   ```
   - Tests login flow, add product, view dashboard, check alerts
   - Finds: Dashboard chart doesn't load if you add product with special characters
   - Finds: QuickUpdate modal doesn't close after submitting
   - Output: 3 bugs, all fixed ✅

2. **Design review** (make sure UI is polished):
   ```
   Load gstack. Run /design-review https://staging.stocksense.app
   ```
   - Audits colors, spacing, typography, mobile
   - Finds: "Button text on mobile is too small (11px), should be 14px"
   - Auto-fixes all spacing issues

3. **Performance check:**
   ```
   Load gstack. Run /benchmark
   ```
   - Measures dashboard load time: 2.3s (good)
   - Core Web Vitals: all green ✅
   - JavaScript bundle: 156KB (reasonable for React app)

4. **You demo with confidence** — you know it's been tested thoroughly

---

## Troubleshooting & Common Issues

### Issue 1: "GStack command didn't work"

**Symptoms:** You run `/qa` and it seems to hang, then fails

**Causes:**
- Your app isn't actually running locally
- GStack browser couldn't connect to localhost:5173
- You have a firewall blocking localhost connections

**Solution:**
1. Make sure React app is running:
   ```bash
   cd frontend
   npm run dev
   ```
   You should see: "Local: http://localhost:5173"

2. In another terminal, try:
   ```bash
   curl http://localhost:5173
   ```
   You should get HTML back (your app's HTML)

3. Try GStack command again:
   ```
   Load gstack. Run /qa http://localhost:5173
   ```

---

### Issue 2: "GStack found bugs but I don't think they're real bugs"

**Symptoms:** `/review` or `/qa` reports a bug, but you think it's wrong

**What to do:**
1. Read GStack's explanation carefully
2. If you disagree: "I reviewed this bug — it's not actually a problem because [reason]"
3. GStack learns from feedback and gets better
4. You can always override and approve/dismiss bugs

---

### Issue 3: "My n8n workflows aren't running"

**Symptoms:** GStack tries to test, but n8n webhooks don't fire

**Causes:**
- n8n instance isn't running
- Webhook URL is wrong (ngrok tunnel changed)
- API key is expired

**Solution:**
1. Check n8n is running:
   ```bash
   # If you used Docker:
   docker ps | grep n8n
   
   # You should see a running n8n container
   ```

2. Check ngrok tunnel is active:
   ```bash
   ps aux | grep ngrok
   ```
   You should see ngrok running. If not, restart it.

3. Check `VITE_N8N_BASE_URL` is correct in `frontend/.env`
   ```
   VITE_N8N_BASE_URL=https://your-ngrok-url.ngrok.io
   ```

4. Check n8n workflows are activated (toggle "active" in n8n UI)

---

### Issue 4: "Multi-tenant data isolation test fails"

**Symptoms:** `/cso` audit finds that Store A can see Store B's products

**Why this is critical:** You're leaking customer data. This is a production blocker.

**Solution:**
1. Go to Supabase dashboard
2. Enable Row-Level Security (RLS) on every table
3. Add policies like:
   ```sql
   -- Users can only see their own store's data
   CREATE POLICY store_isolation ON "Products"
   USING (store_id = auth.uid())
   ```
4. Re-run `/cso`:
   ```
   Load gstack. Run /cso
   ```
   Multi-tenant isolation should now pass ✓

---

### Issue 5: "I want to use GStack but I'm not in Claude Code"

**Options:**

1. **If you have access to Claude Code:** Perfect, use it there

2. **If you have a different AI agent** (Cursor, OpenCode, Codex, etc.):
   - GStack is installed in their skill directories
   - Run the same commands
   - GStack adapts to your host

3. **If you have none of the above:**
   - Get Claude Code access (https://claude.ai)
   - Sign in with your Anthropic account
   - Click "Code" in sidebar
   - Paste `Load gstack. Run /office-hours` 
   - Done

---

## Next Steps & Recommendations

### Immediate (This Week)

1. **Try `/office-hours` on one small feature**
   - Get comfortable with how GStack thinks
   - See the output (design doc)
   - Estimate how much time it saves

2. **Try `/qa` on your app**
   - See what bugs it finds
   - Review the test code it generates
   - Get confidence that it actually works

3. **Try `/cso` security audit**
   - Find your multi-tenant isolation bugs
   - Fix them before they become security incidents
   - This is CRITICAL for StockSense AI

### Short Term (Weeks 2-4)

1. **Set up testing framework**
   - GStack can generate tests, but you need a test runner
   - Recommendation: Install Vitest (JavaScript testing framework)
   ```bash
   cd frontend
   npm install --save-dev vitest
   ```
   - Once installed, GStack can generate Vitest tests

2. **Set up CI/CD pipeline**
   - GitHub Actions to run tests on every PR
   - GStack will use this automatically
   - Simple template to start:
   ```yaml
   # .github/workflows/test.yml
   name: Tests
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: oven-sh/setup-bun@v1
         - run: npm install --legacy-peer-deps
         - run: npm run lint
         - run: npm run build
   ```

3. **Create deployment environment**
   - Where will StockSense AI live? (Vercel? Netlify? Your own server?)
   - GStack can help automate deployment once it's set up
   - Recommendation: Vercel (free tier, integrates with GitHub)

### Medium Term (Month 2)

1. **Run `/autoplan` on remaining major features**
   - Seasonal demand tracker
   - Multi-store management (if applicable)
   - Advanced analytics

2. **Establish weekly `/retro` cadence**
   - Every Friday 5 PM, run `/retro`
   - See metrics: features shipped, bugs found, test coverage
   - Use insights to improve next week

3. **Document all decisions**
   - Save design docs from `/office-hours`
   - Save architecture docs from `/plan-eng-review`
   - Build up a "decision library" for future features

### Long Term (Month 3+)

1. **Open source StockSense AI**
   - Other developers want to help
   - GStack can auto-generate open-source docs
   - Run `/document-release` before each public release

2. **Build a team**
   - Onboard other developers
   - Use `/plan-devex-review` to make onboarding smooth
   - Each new dev runs `/office-hours` to understand the product

3. **Continuous improvement**
   - Monthly `/retro global` to see trends
   - Quarterly design audits with `/design-review`
   - Ongoing security with `/cso` before every major release

---

## Summary: Your Path Forward

### The Big Picture

You have a solid product (StockSense AI) and a powerful toolkit (GStack). Your job is to:

1. **Think** — `/office-hours` before you code
2. **Plan** — `/plan-eng-review` + `/plan-design-review` to lock down decisions
3. **Build** — Write code (your job)
4. **Review** — `/review` to catch bugs before QA
5. **Test** — `/qa` to find real problems
6. **Ship** — `/ship` + `/land-and-deploy` to go live safely
7. **Monitor** — `/canary` to watch for issues
8. **Reflect** — `/retro` to learn and improve

### Expected Outcomes

**Within 1 month of using GStack systematically:**
- ✅ Zero security bugs (fixed by `/cso`)
- ✅ 80%+ test coverage (GStack auto-generates tests)
- ✅ 3-5 major features shipped (speed increases)
- ✅ Zero production incidents (caught by `/qa` before shipping)
- ✅ Documentation up to date (auto-updated by `/document-release`)
- ✅ Team is confident in code quality (transparent audits)

### Success Metrics

Track these over time:
- Time per feature (should decrease)
- Bugs found in QA vs in production (should shift toward QA)
- Test coverage % (should increase to 80%+)
- Shipping velocity (features per week, should increase)
- User satisfaction (ask your customers)

---

## Questions You Might Have

### Q: Does GStack cost money?

**A:** GStack itself is free (open source, MIT license). But running Claude Code or other AI agents might cost money (pay-per-API-call model). Typical cost: $1-5 per feature for all the AI work.

### Q: Can I use GStack with my existing project?

**A:** Yes! GStack works with any project:
- React, Vue, Svelte, etc.
- Node, Python, Go, etc.
- Any database
- Any framework

You just describe your tech stack when you install.

### Q: What if GStack makes a mistake?

**A:** It's very conservative — it rarely auto-fixes without asking you first. Always review GStack's suggestions. If it's wrong, tell it why, and it learns.

### Q: Do I need to know how GStack works internally?

**A:** No! You just know:
- Commands like `/office-hours`, `/qa`, `/ship`
- What they do (thinking, testing, deploying)
- When to use them (before coding, after coding, before shipping)

### Q: Can I customize GStack?

**A:** Yes! As you use it more, you can:
- Skip skills you don't need
- Run skills in different order
- Adjust settings per project

Advanced users can even modify skills, but you don't need to for basic usage.

---

## Final Advice

**Start small.** Don't try to run the entire workflow on day 1. Pick one skill:
- `/office-hours` if you want help thinking
- `/qa` if you want help testing
- `/review` if you want help finding bugs

Use it once. See if it helps. Build confidence. Expand from there.

Within a month, you'll be running the full workflow and shipping features 2-3× faster than traditional development.

Welcome to the future of software engineering. You've got this.

---

**Last updated:** April 23, 2026  
**For:** StockSense AI Project (Vyshakh Vijayan)  
**Status:** Ready to use!

