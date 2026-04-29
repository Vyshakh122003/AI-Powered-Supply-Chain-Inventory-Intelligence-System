# GStack Skills Roadmap for Fixing StockSense AI

## Overview
This document maps the 8 critical issues to specific gstack skills that will be used to fix them.

---

## ISSUE #1: Multi-Tenant Isolation Broken (No RLS)

### What needs fixing:
- Enable Row-Level Security in Supabase
- Write SQL policies to restrict data access by store_id

### GStack Skills Used:

**1. `/investigate`** (5 minutes)
- Understand current Supabase RLS status
- Check what policies exist (if any)
- Identify which tables need protection
- Output: List of exact SQL commands needed

**2. `/review`** (10 minutes)
- Review the proposed RLS policy SQL
- Check for syntax errors
- Verify policies actually solve the problem
- Output: Approved SQL ready to execute

### Timeline: 15 minutes
### Effort: Low
### Complexity: SQL is straightforward

---

## ISSUE #2: Frontend Queries Leak Data (No store_id Filter)

### What needs fixing:
- Add `.eq('store_id', storeProfile.id)` to 20+ Supabase queries
- Check Dashboard.jsx, Products.jsx, Reorder.jsx, Alerts.jsx, Suppliers.jsx, Deliveries.jsx, Reports.jsx

### GStack Skills Used:

**1. `/investigate`** (10 minutes)
- Find ALL places where queries happen
- List which queries are missing the filter
- Show exact line numbers
- Output: Complete list of locations to fix

**2. `/review`** (15 minutes)
- Review the proposed query changes
- Check for SQL injection vulnerabilities
- Verify filter logic is correct
- Output: Approved code changes

**3. `/qa`** (30 minutes) - OPTIONAL but recommended
- Run app locally
- Test that Dashboard only shows current store's data
- Manually add product to store A, verify store B doesn't see it
- Output: Confirmation that data isolation works

### Timeline: 55 minutes
### Effort: Medium
### Complexity: Systematic search/replace with validation

---

## ISSUE #3: Destructive Deletes (Data Loss)

### What needs fixing:
- Fix WF-03 delete query (currently deletes ALL alerts)
- Fix WF-05 delete query (similar issue)
- Replace with conditional delete logic

### GStack Skills Used:

**1. `/investigate`** (15 minutes)
- Understand current WF-03 and WF-05 logic
- Trace the data flow and why deletes are destructive
- Identify what SHOULD be deleted vs what SHOULDN'T
- Output: Root cause analysis + proposed fix

**2. `/review`** (15 minutes)
- Review proposed new delete queries
- Check SQL correctness
- Verify it only deletes appropriate records
- Output: Approved SQL

**3. `/qa`** (optional, 20 minutes)
- Test scenario: Create alert, dismiss it, run pipeline again
- Verify dismissed alert doesn't reappear
- Output: Test results

### Timeline: 50 minutes
### Effort: Medium
### Complexity: SQL logic requires careful thinking

---

## ISSUE #4: Webhooks Have Zero Authentication

### What needs fixing:
- Add API key validation to WF-01, WF-06, WF-07
- Check X-API-Key header matches environment variable

### GStack Skills Used:

**1. `/investigate`** (10 minutes)
- Understand current webhook implementation
- See exactly where validation should happen
- Check if there's already an API key system
- Output: Specific code locations + how to implement

**2. `/review`** (10 minutes)
- Review validation logic
- Check for security vulnerabilities
- Ensure it's actually impossible to bypass
- Output: Approved code

**3. `/cso`** (15 minutes) - SECURITY AUDIT
- Security-focused review
- Check if this fix fully protects against DDoS/poisoning
- Identify any remaining security gaps
- Output: Security sign-off

### Timeline: 35 minutes
### Effort: Low
### Complexity: Straightforward security pattern

---

## ISSUE #5: No Input Validation (WF-01)

### What needs fixing:
- Add validation function for product data
- Check: product_id exists, stock >= 0, stock <= max, name not empty, etc.
- Apply validation before database write

### GStack Skills Used:

**1. `/investigate`** (15 minutes)
- What data comes into WF-01?
- What could be malicious/invalid?
- Where should validation happen?
- Output: Complete list of validation rules needed

**2. `/review`** (20 minutes)
- Review validation function code
- Check all edge cases covered
- Verify it rejects bad data but accepts good data
- Output: Approved validation code

**3. `/cso`** (10 minutes) - SECURITY AUDIT
- Check if validation prevents injection attacks
- Look for bypass vectors
- Output: Security confirmation

### Timeline: 45 minutes
### Effort: Medium
### Complexity: Need to think through all edge cases

---

## ISSUE #6: No store_id Validation in Webhooks

### What needs fixing:
- Add check: request.store_id === authenticated_store_id
- Prevent cross-store data pollution

### GStack Skills Used:

**1. `/investigate`** (10 minutes)
- How are webhooks authenticated currently?
- Where is the authenticated store_id available?
- What needs to change in WF-01, WF-06?
- Output: Exact code changes needed

**2. `/review`** (10 minutes)
- Review store_id validation logic
- Check it can't be bypassed
- Output: Approved code

### Timeline: 20 minutes
### Effort: Low
### Complexity: Simple comparison logic

---

## ISSUE #7: Groq API Failures Silent

### What needs fixing:
- Add try/catch around Groq API calls in WF-05
- Log errors when LLM fails
- Track which products got suggestions and which didn't
- Alert if fewer suggestions than expected

### GStack Skills Used:

**1. `/investigate`** (15 minutes)
- What happens when Groq times out?
- How many products should get suggestions?
- Where should error logging happen?
- Output: Implementation plan

**2. `/review`** (15 minutes)
- Review error handling code
- Check logging is comprehensive
- Verify alerts will actually fire
- Output: Approved code

**3. `/qa`** (optional, 30 minutes)
- Test: Simulate Groq timeout
- Verify error is logged
- Verify alert is sent
- Output: Test confirmation

### Timeline: 60 minutes
### Effort: Medium
### Complexity: Error handling patterns

---

## ISSUE #8: Hardcoded Phone Numbers

### What needs fixing:
- Replace hardcoded array with database query
- Fetch from Store Profiles table
- Get phone numbers for specific store_id

### GStack Skills Used:

**1. `/investigate`** (5 minutes)
- Find hardcoded phone numbers in WF-07
- Understand Store Profiles schema
- Output: What needs to change

**2. `/review`** (10 minutes)
- Review database query code
- Check Supabase query is correct
- Verify error handling if numbers not found
- Output: Approved code

### Timeline: 15 minutes
### Effort: Low
### Complexity: Simple database query

---

## SUMMARY: Which Skills Will Be Used

### Skills Used Most Frequently:
1. **`/investigate`** - Used for ALL 8 issues (understanding what's broken)
2. **`/review`** - Used for ALL 8 issues (reviewing fixes before applying)
3. **`/cso`** - Used for Issues #4, #5 (security audits)
4. **`/qa`** - Used for Issues #2, #3, #7 (optional testing)

### Skills NOT Needed:
- `/office-hours` - Not starting new features, fixing existing ones
- `/design-*` - No UI changes needed
- `/ship` - Not deploying yet (after all fixes done)
- `/qa-only`, `/canary`, `/land-and-deploy` - Not at deployment stage yet

---

## Overall Workflow

```
For each issue:
  1. Run /investigate → Understand what's broken
  2. I write the fix code
  3. Run /review → Verify the fix is correct
  4. (Optional) Run /cso → Security confirmation
  5. (Optional) Run /qa → Test it works
  6. You apply the fix to your actual code
```

---

## Time Breakdown

| Issue | Investigate | Review | CSO | QA | Total |
|-------|-------------|--------|-----|-----|--------|
| #1 | 5m | 10m | - | - | 15m |
| #2 | 10m | 15m | - | 30m* | 55m |
| #3 | 15m | 15m | - | 20m* | 50m |
| #4 | 10m | 10m | 15m | - | 35m |
| #5 | 15m | 20m | 10m | - | 45m |
| #6 | 10m | 10m | - | - | 20m |
| #7 | 15m | 15m | - | 30m* | 60m |
| #8 | 5m | 10m | - | - | 15m |
| **TOTAL** | **85m** | **105m** | **25m** | **80m*** | **295m (4.9 hrs)** |

*Optional (with asterisk)

---

## Recommended Sequence

**Day 1: Security Fixes (1.5 hours)**
1. Issue #4: Webhook authentication (35m)
2. Issue #6: Store_id validation (20m)
3. Issue #1: Row-Level Security (15m)

**Day 2: Data Integrity Fixes (2.5 hours)**
4. Issue #2: Frontend query filters (55m)
5. Issue #3: Destructive deletes (50m)
6. Issue #5: Input validation (45m)

**Day 3: Error Handling (1 hour)**
7. Issue #7: Groq error handling (60m)
8. Issue #8: Hardcoded numbers (15m)

**Total: ~5 hours of gstack skill usage + your implementation time**

---

## How to Execute

For each issue, we'll do:

```
YOU: "Let's fix Issue #1"

ME: "Running /investigate..."
   [gstack analyzes the code]
   Output: Root cause + implementation plan

YOU: "Here's my implementation"

ME: "Running /review..."
   [gstack checks the fix]
   Output: Approved or suggestions for improvement

YOU: "I'll apply this fix to the code"

ME: "Fix complete ✓"
```

---

## Ready to Start?

You can now decide:
- **Option A:** Start with Issue #1 (RLS security)
- **Option B:** Start with Issue #4 (webhook auth) 
- **Option C:** Do all 8 in sequence as recommended
- **Option D:** Something else?

Which would you prefer?

