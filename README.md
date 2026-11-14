# IPIN (ɪᴘ) — Zero-CAC Multiplayer Bill Split & Forensic Settlement

> **Theme:** Zero-CAC IT Product | HackOnVibe November 2026 Build  
> **Team:** `lit-up` | **Live Web App:** [https://ipin.web.app](https://ipin.web.app) | **Hackathon Mirror:** [x8nctjzga2ex6wc0ov6wfgar8996q9dv3qk0wpx2.hackonvibe.com](https://x8nctjzga2ex6wc0ov6wfgar8996q9dv3qk0wpx2.hackonvibe.com/)

---

## 1. Executive Summary & Pitch

**IPIN** (*"Share / Portion"*) is a mobile-first, zero-signup web application where groups can split any dining, grocery, or event bill in real time, claim individual and shared items, settle up via universal payment rails (PayPal.me, Revolut, Cash App, Venmo, Wise, or IBAN), and forensically verify bank transfer receipt screenshots against edited digits or Photoshop tampering.

### Why this fits the "Zero-CAC IT Product" Theme:
Most fintech and consumer apps suffer from \$15–\$50 Customer Acquisition Cost (CAC) via paid ads.  
**IPIN features an organic, mechanical Zero-CAC viral growth loop:**
1. **The Host (User 1):** Snaps a receipt or creates a room in 10 seconds.
2. **The Group (Users 2–10):** The host drops the link into WhatsApp, Telegram, or iMessage. **4 to 10 friends are compelled to open the web app** to view their claimed dishes, see their exact proportional share, and pay.
3. **Zero Friction:** No app store download, no forced passwords, no KYC barriers.
4. **Viral Loop:** Every participant viewing the settlement ledger experiences the utility firsthand. When they organize their next outing, they become the next host.  
   $$\text{CAC} = \$0.00 \quad|\quad \text{Viral Coefficient } K > 1.4$$

---

## 2. Core Architecture & Mathematical Engine

### Engine 1: Proportional Split with Zero-Drift Penny Balancing
Standard split apps divide items and round blindly, creating \$0.01–\$0.05 rounding drift that upsets group accounting. IPIN uses an exact integer-cent distribution algorithm:
- **Shared Items:** If 3 people split a \$10.00 dish, IPIN allocates `[$3.33, $3.33, $3.34]`, strictly preserving $\sum \text{portions} \equiv \text{itemTotal}$.
- **Proportional Extra Charges:** Taxes, service fees, delivery charges, and discounts are distributed mathematically based on each participant's exact item subtotal proportion:
  $$\text{ExtraCharge}_i = \text{TotalExtraCharges} \times \left( \frac{\text{ItemSubtotal}_i}{\text{BillSubtotal}} \right)$$
- **Zero-Drift Guarantee:** When all items are claimed, the sum of participant balances matches `grandTotal` to the exact cent across USD, EUR, GBP, CAD, AUD, NGN, INR, BRL, and zero-decimal JPY ($\text{JPY } ¥$).

### Engine 2: Universal P2P Settlement
- No closed-loop regional banking lock-in. Works for **every person on Earth**.
- Hosts configure their preferred universal payment rail: `PayPal.me`, `Revolut.me`, `cash.app/$cashtag`, `Venmo`, `Wise`, `IBAN/SEPA`, or cash.
- Participants can tap **"Copy"** or pay directly in their installed payment app, or tap **"1-Tap Mark as Paid"** to settle the group ledger.

### Engine 3: Client-Side Pixel Tampering Forensics (Error Level Analysis)
- **The Problem:** In group expenses, individuals frequently send fake or edited payment screenshots (altering the transferred amount or host name using mobile markup or Photoshop).
- **The Solution:** Client-side HTML5 Canvas **Error Level Analysis (ELA)**.
  - Recompresses the uploaded screenshot at a calibrated JPEG quality matrix (85%).
  - Computes the pixel differential between the original image and recompressed image.
  - Amplifies artifact variances ($15\times$) into a visual **Forensic Heatmap**: edited text/digits display distinct high-frequency compression anomalies (magenta/red glow) compared to the uniform compression of authentic bank app screenshots.
  - Automatically flags amount mismatches if the extracted screenshot value is less than the owed ledger share.
  - Runs **100% in the client's browser** with zero cloud GPU costs, preserving privacy and enabling instant analysis.

### Engine 4: Real-Time Multiplayer Sync via Supabase Channels
- Instant updates across 50+ connected devices via Supabase PostgreSQL realtime replication.
- Zero server state bottleneck; passwordless phone/@handle identity stored securely.

---

## 3. Quick 30-Second Guide for Judges

Judges can test the entire product immediately without any login or credit card:

1. **Open the Live App:** [https://ipin.web.app](https://ipin.web.app) (or [Hackathon Mirror](https://x8nctjzga2ex6wc0ov6wfgar8996q9dv3qk0wpx2.hackonvibe.com/))
2. **Create a Split Room:** Tap **"Create Split Room"** and choose a sample template (`+ Sample Dinner`, `+ Sample Izakaya`, or `+ Sample Lounge`) to populate real items in 1 click!
3. **Test Claiming Items (`/claim`):** Tap any dish to claim or unclaim. Notice how co-claimed items split dynamically and proportional tax updates instantly.
4. **Test Real Friend Search:** In the **Home** or **Roster** tab, tap **"Add Friend"** to search registered participants by Name or @Handle, or invite via WhatsApp.
5. **Test AI Forensic Verification (`/verify`):**
   - Navigate to **"Verify AI"** on the bottom navigation bar.
   - Click **`[Authentic Slip]`** to see uniform compression with zero tampering.
   - Click **`[Tampered Edit]`** to inspect the live **ELA Forensic Heatmap** revealing photoshopped digits and spliced artifact anomalies!
6. **Test Group Export (`/summary`):** Switch to the **Summary** tab to inspect the auto-generated WhatsApp/Discord settlement slip and copy summary.

## 4. Technical Stack & Repository Structure

- **Frontend:** React 19 + TypeScript + Vite 8
- **Styling & Layout:** Tailwind CSS v4 (Strictly mobile-first, edge-to-edge on phones, centered viewport on desktop)
- **Canvas & Visual Effects:** HTML5 Canvas API + `canvas-confetti`
- **Testing:** Vitest unit test suite covering math precision, multi-currency formatting, and settlement logic
- **Deployment:** Cloudflare Pages CI/CD

```
src/
├── components/
│   ├── BottomNav.tsx              # Floating mobile navigation with elevated AI Verify FAB
│   ├── ClaimItemsTab.tsx          # Line items claiming with multi-claimer distribution
│   ├── LandingHero.tsx            # Zero-CAC pitch & 1-click international demo selector
│   ├── LiveLedgerTab.tsx          # Real-time collection progress, participant balances & feed
│   ├── Navbar.tsx                 # Clean header with 1-click international demo switcher
│   ├── RoomHeader.tsx             # Bill total balance, host payout info & participant avatars
│   ├── SettleUpModal.tsx          # Universal settlement + interactive ELA Heatmap visualizer
│   ├── SummaryCardTab.tsx         # Digital receipt card & WhatsApp/Telegram export
│   └── TransactionReceiptModal.tsx# Digital transaction slip with reference ID
├── data/
│   └── sampleReceipt.ts           # Preloaded global datasets (USD, EUR, JPY)
├── types/
│   └── index.ts                   # Strongly-typed data models for rooms, items & forensics
└── utils/
    ├── elaTamper.ts               # Client-side Error Level Analysis (ELA) canvas engine
    ├── splitMath.ts               # Core proportional split & zero-drift penny balancing
    └── splitMath.test.ts          # Vitest suite (10/10 automated tests passing)
```

---

## 5. Verification & Automated Test Suite

Run the rigid test suite locally:
```bash
npm run test
```
```
 ✓ src/utils/splitMath.test.ts (10 tests)
   ✓ correctly formats money with international currency symbols
   ✓ resolves correct currency symbols
   ✓ splits uneven amounts with exact penny balancing (no lost cents)
   ✓ splits shared items equally among co-claimers
   ✓ distributes tax, service fee, and tip proportionally with zero penny drift
   ✓ correctly tracks unclaimed items when not all items have been claimed
   ✓ handles participants who have claimed nothing gracefully (zero owed, no NaN)
   ✓ updates remaining balances, collection progress, and settlement status from transactions
   ✓ marks room as fully settled when all participants have paid and all items are claimed
   ✓ handles JPY zero-decimal calculations accurately

 Test Files  1 passed (1)
      Tests  10 passed (10)
```

To build for production:
```bash
npm run build
```
- Fully passes strict TypeScript typechecking (`tsc -b && vite build`) with zero warnings or errors.
