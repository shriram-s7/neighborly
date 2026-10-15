# 🎬 Neighborly — 7-Minute College Evaluation & Demo Script

> **Goal:** Showcase an end-to-end, mathematically sound, hyperlocal full-stack platform to examiners in 7 minutes. Every action runs live against the database with zero mock data.

---

## ⏱️ Timeline Overview

| Time | Act | Focus Feature | Persona |
|---|---|---|---|
| **0:00 – 1:30** | **Act 1** | Smart NLP Request Parser & 6-Factor Matching | Priya (Resident) |
| **1:30 – 3:00** | **Act 2** | Live Escrow Booking, Realtime Chat & Safety Masking | Priya & Karthik |
| **3:00 – 4:00** | **Act 3** | Review Submission, Bayesian Trust Score & Fraud Detection | Priya & Karthik |
| **4:00 – 5:15** | **Act 4** | Dispute Mediation Console & 50/50 Escrow Split | Admin |
| **5:15 – 6:15** | **Act 5** | Skill Exchange (Barter) & Dual-Confirmation Credits | Priya & Lakshmi |
| **6:15 – 7:00** | **Act 6** | Porur Pet Care Gap Analytics & Double-Entry Invariant Verification | Admin |

---

## 🎭 Step-by-Step Walkthrough

### Act 1: Smart Need Search & 6-Factor Matching Engine (0:00 – 1:30)
1. **Open:** `http://localhost:5173/login`
2. **Login as Resident:** `requester@demo.in` / `Demo@123` (Priya Sundaram, Ramapuram).
3. **Navigate to:** `Smart Dispatch` via the top navigation bar or the home banner button.
4. **Click Preset:** `⚡ Urgent Leaking Pipe`:
   > *"Urgent: leaking tap in my kitchen in Ramapuram, need help today around 6pm, budget around 400"*
5. **Show Examiner the Live Extraction:**
   - [Category: Plumbing]
   - [Urgency: URGENT ⚡]
   - [Budget: ₹400]
   - [Time: Today at 6:00 PM]
   - **Fair Price Intelligence Badge:** Displays local completed bookings median (₹400 – ₹450).
6. **Toggle Urgent Mode:**
   - Point out that the Proximity weight automatically increases from **20% to 35%**, and availability weight increases to **20%**.
7. **Expand "Why this match?":**
   - Click `Why this match?` on Karthik Raja (Score: ~94.2/100).
   - Show the 6 transparent factor contributions:
     - Skill Match (+20 pts)
     - Proximity (+35 pts, 0.4 km away in Ramapuram)
     - Availability (+19 pts, weekly slots active)
     - Bayesian Trust (+9.5 pts, 88/100 score)
     - Reliability (+9.5 pts, 96% completion rate)
     - Price Fit (+5 pts, ₹450 within budget)

---

### Act 2: Booking Creation, Realtime Chat & Safety Masking (1:30 – 3:00)
1. **Click:** `Book (₹450)` next to Karthik's listing.
2. **Confirm Booking:** Select scheduled time and payment mode (Wallet Escrow).
3. **Show Wallet Impact:**
   - Navigate to `/wallet`.
   - Point out that ₹450 is moved from **Available Balance** to **Held in Escrow**.
4. **Open Booking Page:** `/bookings/<id>`
   - State Machine Timeline shows: `REQUESTED (Escrow Secured)`.
5. **Test Phone/Email Safety Masking:**
   - In the live chat drawer on the right, type: `"Call me at 9840123456 or email priya@test.com"`.
   - Send the message.
   - **Show Examiner:** The message body is automatically masked: `"Call me at [PHONE NUMBER PROTECTED] or email [EMAIL PROTECTED]"`.
   - **Explain:** Direct contact exchange is blocked before acceptance to prevent platform leakage and ensure escrow safety.
6. **Provider Acceptance:**
   - Switch to Provider mode (or login as `provider@demo.in`).
   - Go to `/bookings/<id>` and click `Accept Booking Request`.
   - Status updates in realtime to `ACCEPTED`, and scheduled time is confirmed.

---

### Act 3: Completion, Bayesian Trust Score & Fraud Detection (3:00 – 4:00)
1. **Advance Job Lifecycle:**
   - Click `Start Job` -> moves to `IN_PROGRESS`.
   - Click `Complete Work` -> moves to `COMPLETED`.
   - Show examiner the **48-Hour Auto-Release Guarantee notice** with countdown.
2. **Release Escrow Payment:**
   - Resident clicks `Confirm & Release Payment (₹450)`.
   - Status moves to `PAID`.
   - Invariant: 95% (₹427.50) goes to provider, 5% (₹22.50) platform fee recorded.
3. **Leave Review:**
   - Star rating: 5 Stars.
   - Comment: `"Prompt arrival, fixed the kitchen drain leak thoroughly!"`.
   - Submit review.
4. **Show Explainable Trust Score:**
   - Open Karthik Raja's public profile `/providers/<karthik_id>`.
   - Click `Why this score?`.
   - Show the 6 factors with the **Bayesian rating formula ($C=3.0, m=4.0$)** dynamically computed from DB data.

---

### Act 4: Dispute Mediation Console & 50/50 Escrow Split (4:00 – 5:15)
1. **Login as Administrator:** `admin@demo.in` / `Demo@123`.
2. **Go to Admin Console:** `/admin`
3. **Open Dispute Resolution Tab:**
   - Show the active demo dispute: `#... Priya Sundaram vs Karthik Raja (Escrow: ₹450)`.
   - Resident evidence: *"Electrical switchboard sparked again after repair. Requesting 50% split."*
4. **Mediate with Custom Split:**
   - Select `Custom Split Escrow`.
   - Adjust split slider to **50% Resident / 50% Provider**.
   - Show examiner the live calculation:
     - Resident Refund: ₹225.00
     - Provider Payout: ₹213.75 (net of 5% fee: ₹11.25)
   - Click `Enforce Mediation Decision`.
5. **Verify Financial Invariant:**
   - Click `Verify Double-Entry Invariant` at the top.
   - **Result:** `DELTA = ₹0.00`.
   - Show examiner:
     $$\text{Balances} + \text{Held} + \text{Platform Fees} == \text{Total Topups}$$

---

### Act 5: Cashless Community Barter & Free Help Credits (5:15 – 6:15)
1. **Go to Barter Board:** `/barter` via navbar.
2. **Explore Barter Opportunities:**
   - Point out listings with `Barter Welcomed` badges.
3. **Propose Skill Swap:**
   - Click `Propose Swap` on Lakshmi's Tailoring listing.
   - Offer 2 hours of Electrical repair in return for 2 hours of tailoring alterations.
   - Submit proposal.
4. **Dual Confirmation Flow:**
   - Go to `My Skill Swaps` tab.
   - Show that status is `ACCEPTED`.
   - Both parties click `Confirm Completed Job`.
   - Once both confirm, status updates to `COMPLETED 🎉` and both users earn **+5 Community Credits** directly in their wallet!

---

### Act 6: Porur Pet Care Gap Analytics (6:15 – 7:00)
1. **Go to Analytics:** `/admin/analytics` via top navbar.
2. **Select Neighborhood:** Click `Porur`.
3. **Examine Community Health Index:**
   - Health Score: **84 / 100**.
   - Review transparent SQL weights: Fulfilment (25%), Repeat bookings (15%), Safety (15%), Trust (15%), Cashless activity (10%).
4. **Examine Service Gap Heatmap:**
   - Point out the **Critical Supply Gap banner on Pet Care**:
     - Local Demand: **14+ requests**
     - Active Supply: **0 providers**
     - Unfulfilled Rate: **75%**
   - Read the actionable recommendation:
     > *"CRITICAL SUPPLY DEFICIT: 14+ Pet Care requests in Porur with only 0-1 active providers. Recruiting 2 local pet walkers will close this gap and inject ~₹12,000 monthly neighborhood revenue."*
5. **Run Automated Test Suite:**
   - Open terminal:
     ```bash
     pnpm --filter @neighborly/api test
     ```
   - Show examiner: **4 Test Suites passed, 14 tests passing** covering state machine, ledger invariant, matching engine, and Bayesian trust calculations.

---

## 🏆 Summary Checklist for Examiners

- [x] Full-stack architecture (PostgreSQL 16 + NestJS + React 18 + Leaflet OSM).
- [x] Zero hardcoded mock numbers (all metrics derived live via Prisma aggregations).
- [x] Double-entry escrow invariant mathematically proven ($\Delta \equiv 0$).
- [x] Explainable 6-Factor Matching with Urgent Mode reweighting.
- [x] Explainable Bayesian Trust Score ($C=3.0, m=4.0$).
- [x] Realtime chat with phone/email safety masking.
- [x] Cashless skill exchange hour-for-hour barter and community credit incentives.
- [x] Community Health Index (0-100) and Porur Pet Care gap detection.
- [x] Automated Jest unit test suite covering core math and state transitions.
