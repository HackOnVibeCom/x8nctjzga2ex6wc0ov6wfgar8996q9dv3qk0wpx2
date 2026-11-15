# IPIN (ɪᴘ) — Zero-CAC Multiplayer Bill Splitting & Pollar Stellar Escrow Vault

> **Theme:** Zero-CAC IT Product | HackOnVibe November 2026 Build  
> **Team:** `lit-up` | **Live Web App:** [https://ipin.web.app](https://ipin.web.app)  
> **Mobile Demo Video (MP4):** [https://ipin.web.app/demo_mobile.mp4](https://ipin.web.app/demo_mobile.mp4)  
> **Mobile Demo Video (WebM):** [https://ipin.web.app/demo_mobile.webm](https://ipin.web.app/demo_mobile.webm)  
> **Hackathon Mirror:** [x8nctjzga2ex6wc0ov6wfgar8996q9dv3qk0wpx2.hackonvibe.com](https://x8nctjzga2ex6wc0ov6wfgar8996q9dv3qk0wpx2.hackonvibe.com/)

---

## 1. Executive Summary & Why IPIN Wins "Zero-CAC"

Traditional split apps (like Splitwise) only record awkward debt ("IOUs"). One person is still forced to front hundreds of dollars from their personal bank account, chase friends for weeks, and fall victim to photoshopped bank transfer screenshots.

**IPIN solves the root problem with cryptographic escrow:**
1. **The Host Never Fronts Money:** The host sets the restaurant's local bank (e.g., OPay). IPIN launches an on-chain **Escrow Vault** on the **Stellar Testnet** via Pollar.
2. **Diners Settle Up Directly:** Each friend joins with zero downloads or signups, claims their dishes, and pays their exact share into the vault via Pollar (Card, Bank Transfer, or Web3).
3. **Automated Restaurant Off-Ramp:** When funded, the vault off-ramps the pooled money directly to the restaurant's local account. The host never touches the pooled cash.
4. **Client-Side ELA Forensics:** An in-browser HTML5 Canvas Error Level Analysis engine scans receipt screenshots for edited digits, protecting organizers from fraud with zero server compute.

### The Mechanical Zero-CAC Flywheel ($K > 1.4$)
- **Host (User 1)** creates a bill room in 10 seconds.
- **Group (Users 2–10)** receive a room link on WhatsApp/Telegram with **no app install or signup required**.
- **Conversion:** All 5–10 dining friends actively use the product to claim dishes and settle. When any of them organizes dinner next weekend, they become the next host.

---

## 2. Quick Judge Testing Guide ("The Client Path")

Judges can test the complete end-to-end flow in under 2 minutes:

| Step | Action | What to "Poke" | Expected Result |
|---|---|---|---|
| **1. Landing** | Start test | Tap **"Create Split Room"** | Opens room creation modal. |
| **2. Auto-Resolving Bank** | Set destination | Select **OPay**, type account `9136447931` | Instantly auto-resolves to verified badge **`IBRAHIM S. (OPAY)`**. |
| **3. Interactive Item Builder** | Configure dishes | Tap **`+ Sample Naija Chow`** preset | Dishes load; tap `[+]` on pieces stepper to adjust quantities on the fly. |
| **4. Deploy Escrow** | Launch split | Tap **"Launch Bill & Deploy Stellar Vault"** | Deploys on-chain Escrow Vault on Stellar Horizon Testnet via Friendbot. |
| **5. Claim Items** | Test participant flow | Tap **"Claim"** nav tab & claim dishes | Personal share recalculates dynamically in real time. |
| **6. Mid-Meal Additions** | Add extra drinks | Tap **"Add Item"**, enter `Chapman Cocktail`, qty 2, price `2500` | Appends dish and claims it without resetting the room. |
| **7. Pollar Checkout** | Test payment gateway | Tap **"Home"** → **"Settle"** → **"Pay via Pollar"** | Multi-currency checkout opens (Card, Bank, Web3 rails). |
| **8. On-Chain Minting** | Settle portion | Select **"Bank"** rail & tap **"I Have Sent Bank Transfer"** | Mints USDC into vault on Stellar testnet; shows **IPIN Official Receipt** with hash. |
| **9. Host Off-Ramp** | Zero personal fronting | Tap **"Release Funds to Restaurant"** | Vault off-ramps pooled funds directly to the restaurant's local OPay bank. |
| **10. Verify AI** | Test fraud forensics | Tap **"Verify AI"** → tap **"Sample Tampered"** → toggle **"Heatmap"** | Canvas ELA scan exposes altered numbers in bright red error clusters. |
| **11. Summary** | Audit trail | Tap **"Summary"** tab | Shows complete transparent ledger with verified on-chain transactions. |

---

## 3. Core Architecture & Technological Innovations

```
                                  [ Dining Group ]
                                         │ (Link / QR)
                                         ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                          IPIN Mobile Web App                           │
   │  ┌───────────────────────┐  ┌───────────────────┐  ┌─────────────────┐ │
   │  │ Client-Side ELA Canvas│  │ Dynamic Stepper   │  │ Auto-Resolving  │ │
   │  │ Forensics (Verify AI) │  │ Item Builder      │  │ Bank Engine     │ │
   │  └───────────────────────┘  └───────────────────┘  └─────────────────┘ │
   └────────────────────────────────────┬───────────────────────────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
┌─────────────────────────┐                           ┌─────────────────────────┐
│  Supabase PostgreSQL    │                           │  Pollar + Stellar       │
│  - Realtime Sync        │                           │  Horizon Testnet        │
│  - Zero-drift Penny     │                           │  - Escrow Vault Keypair │
│    Balancing Algorithm  │                           │  - Multi-Currency Rails │
│  - Dynamic Item Claims  │                           │  - On-Chain Minting     │
└─────────────────────────┘                           │  - Direct Local Off-Ramp│
                                                      └────────────┬────────────┘
                                                                   │
                                                                   ▼
                                                      ┌─────────────────────────┐
                                                      │  Restaurant Local Bank  │
                                                      │  (e.g., OPay Nigeria)   │
                                                      │  "IBRAHIM S."           │
                                                      │  Zero Personal Fronting │
                                                      └─────────────────────────┘
```

### 1. Mathematical Zero-Drift Penny Balancing Engine
When splitting uneven bills across multiple people and currencies:
- **Shared Items:** If 3 people split a \$10.00 dish, IPIN distributes exact integer cents `[$3.33, $3.33, $3.34]`, strictly preserving $\sum \text{portions} \equiv \text{itemTotal}$.
- **Proportional Charges:** Taxes, service fees, and tips are weighted strictly by each diner's subtotal share:
  $$\text{ExtraCharge}_i = \text{TotalExtraCharges} \times \left( \frac{\text{ItemSubtotal}_i}{\text{BillSubtotal}} \right)$$
- Guaranteed zero rounding drift across USD, EUR, GBP, CAD, AUD, NGN, and zero-decimal JPY.

### 2. Client-Side Error Level Analysis (ELA) Forensic Engine
- Recompresses receipt screenshots at a calibrated 85% JPEG quantization table directly on an HTML5 `<canvas>`.
- Computes pixel-level difference vectors and amplifies variance $15\times$.
- Tampered numbers, cut-and-paste digits, and Photoshop manipulations display glowing high-frequency red/magenta error clusters, catching payment screenshot fraud with **0 server costs and 100% privacy**.

---

## 4. Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti
- **Blockchain & Payments:** Stellar SDK, Stellar Horizon Testnet, Friendbot, Pollar Multi-Currency Gateway
- **Database & Sync:** Supabase PostgreSQL Realtime
- **Automation & Quality:** Playwright Core (Mobile Viewport Automation), FFmpeg 9.0.2 (H.264/AAC & VP9/Opus Muxing), Edge TTS Neural Voice
- **Hosting:** Firebase Hosting CDN (`https://ipin.web.app`)

---

## 5. Verification & Test Suite

Run the automated test suite locally:
```bash
npm run test
```
```
 ✓ src/utils/splitMath.test.ts (10 tests)
   ✓ correctly formats money with international currency symbols
   ✓ splits uneven amounts with exact penny balancing (no lost cents)
   ✓ splits shared items equally among co-claimers
   ✓ distributes tax, service fee, and tip proportionally with zero penny drift
   ✓ handles JPY zero-decimal calculations accurately

 Test Files  1 passed (1)
      Tests  10 passed (10)
```

Production build verification:
```bash
npm run build
```
- Passes strict TypeScript compilation (`tsc -b && vite build`) with zero errors.
