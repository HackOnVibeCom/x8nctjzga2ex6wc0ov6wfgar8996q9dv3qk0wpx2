import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\HP\\AppData\\Local\\ms-playwright';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG_PATH = 'C:\\Users\\HP\\AppData\\Local\\ms-playwright\\ffmpeg-1013\\ffmpeg-win64.exe';
const TARGET_URL = 'http://localhost:4174';
const OUTPUT_DIR = path.resolve('demo_recordings');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeClick(page, selector, desc = '') {
  try {
    const el = await page.locator(selector).first();
    await el.scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => {});
    await el.waitFor({ state: 'visible', timeout: 4000 });
    await el.click({ timeout: 4000 });
    console.log(`[Demo] Clicked: ${desc || selector}`);
    return true;
  } catch (err) {
    console.warn(`[Demo] Warning: Could not click ${desc || selector}: ${err.message}`);
    return false;
  }
}

async function runMobileDemo() {
  console.log('[Demo] Launching mobile Chrome browser at 390x844...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=430,920',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 390, height: 844 },
    },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  console.log('[Demo] Navigating to', TARGET_URL);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3500);

  // 1. SCENE 1: Welcome & Landing Walkthrough
  console.log('[Demo] Scene 1: Landing page presentation');
  await page.evaluate(() => window.scrollBy({ top: 320, behavior: 'smooth' }));
  await sleep(2000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await sleep(2000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(1500);

  // 2. SCENE 2: Create New Split Room with Auto-Resolving Bank
  console.log('[Demo] Scene 2: Creating Room with Auto-Resolving Bank');
  await safeClick(page, 'button:has-text("Create Split Room")', 'Create Split Room Button');
  await sleep(1500);

  // Click "+ Sample Naija Chow" Preset
  console.log('[Demo] Selecting + Sample Naija Chow Preset');
  await safeClick(page, 'button:has-text("+ Sample Naija Chow")', 'Sample Naija Chow Preset');
  await sleep(2000);

  // Scroll inside modal to show auto-resolved bank
  const modalScroll = await page.$('form');
  if (modalScroll) {
    await modalScroll.evaluate((el) => el.scrollBy({ top: 240, behavior: 'smooth' }));
  }
  await sleep(2500);

  // Demonstrate Interactive Item Builder (Pieces & Price)
  console.log('[Demo] Demonstrating Pieces Stepper in Item Builder');
  if (modalScroll) {
    await modalScroll.evaluate((el) => el.scrollBy({ top: 320, behavior: 'smooth' }));
  }
  await sleep(1500);

  // Click "+" on pieces
  const plusButtons = await page.$$('button:has-text("+")');
  if (plusButtons.length > 0) {
    try {
      await plusButtons[plusButtons.length - 1].click();
      await sleep(800);
      await plusButtons[plusButtons.length - 1].click();
      await sleep(1200);
    } catch {}
  }

  // Click Submit CTA
  console.log('[Demo] Launching Bill & Generating Stellar Vault');
  await safeClick(page, 'button:has-text("Launch Bill & Deploy Stellar Vault")', 'Launch Bill CTA');
  await sleep(4000);

  // 3. SCENE 3: Home Dashboard & Stellar Testnet Escrow Vault Card
  console.log('[Demo] Scene 3: Exploring Home Dashboard & Stellar Vault');
  await sleep(2500);
  await page.evaluate(() => window.scrollBy({ top: 220, behavior: 'smooth' }));
  await sleep(3000);

  // 4. SCENE 4: Claim Items Tab & On-The-Fly Item Addition
  console.log('[Demo] Scene 4: Claiming Line Items & Adding Extra Dish');
  // Try tile first, then nav
  const claimTile = await safeClick(page, 'div.grid-cols-4 button:has-text("Claim")', 'Claim Action Tile');
  if (!claimTile) {
    await safeClick(page, 'nav button:has-text("Claim")', 'Claim Nav Button');
  }
  await sleep(2500);

  // Claim initial dishes
  console.log('[Demo] Claiming dishes for current user');
  const claimButtons = await page.$$('button:has-text("Claim"), button:has-text("Split")');
  for (let i = 0; i < Math.min(2, claimButtons.length); i++) {
    try {
      await claimButtons[i].click();
      await sleep(1000);
    } catch {}
  }
  await sleep(1500);

  // Demonstrate Add Bill Item Modal (Addressing Image 1)
  console.log('[Demo] Demonstrating "Add Bill Item" modal mid-meal');
  await safeClick(page, 'button:has-text("Add Item")', 'Add Bill Item Button');
  await sleep(2000);

  // Fill in Extra Item
  const itemNameInput = await page.$('input[placeholder*="Chapman"], input[placeholder*="Garlic"]');
  if (itemNameInput) {
    await itemNameInput.fill('Chapman Cocktail');
    await sleep(800);
  }

  // Click "+" on quantity stepper
  const addModalPlus = await page.$('form button:has-text("+")');
  if (addModalPlus) {
    await addModalPlus.click();
    await sleep(800);
  }

  // Fill price
  const itemPriceInput = await page.$('input[placeholder*="2500"], input[placeholder*="15.50"]');
  if (itemPriceInput) {
    await itemPriceInput.fill('2500');
    await sleep(1000);
  }

  // Submit Add & Claim
  await safeClick(page, 'button:has-text("Add & Claim")', 'Add & Claim CTA');
  await sleep(2500);

  // 5. SCENE 5: Pollar Checkout Gateway & Stellar On-Ramp
  console.log('[Demo] Scene 5: Settling Up via Pollar Checkout Gateway');
  await safeClick(page, 'nav button:has-text("Home")', 'Home Nav Button');
  await sleep(2000);

  await safeClick(page, 'div.grid-cols-4 button:has-text("Settle")', 'Settle Action Tile');
  await sleep(2500);

  // Open Pollar Checkout Gateway
  await safeClick(page, 'button:has-text("Pay via Pollar")', 'Pay via Pollar CTA');
  await sleep(3000);

  // Show Payment Rails (Bank, Card, Web3)
  await safeClick(page, 'button:has-text("Card")', 'Card Rail');
  await sleep(1800);
  await safeClick(page, 'button:has-text("Bank")', 'Bank Rail');
  await sleep(1800);

  // Execute Simulated Inbound Bank Payment & Stellar Testnet Minting
  console.log('[Demo] Triggering Inbound Bank Transfer & Stellar On-Chain Minting');
  await safeClick(page, 'button:has-text("I Have Sent Bank Transfer")', 'Confirm Bank Transfer');
  
  // Wait for Stellar testnet minting to complete and Receipt modal to show
  console.log('[Demo] Waiting for Stellar testnet block confirmation...');
  await sleep(6500);

  // 1. Dismiss Top Modal: Transaction Receipt Modal
  console.log('[Demo] Dismissing Transaction Receipt Modal');
  await safeClick(page, '#close-receipt-modal-x-btn, #close-receipt-modal-done-btn, button:has-text("Done")', 'Receipt Done CTA');
  await sleep(1500);

  // 2. Dismiss Behind Modal: SettleUpModal
  console.log('[Demo] Dismissing Settle Up Modal');
  await safeClick(page, 'button:has-text("Back to Split Room"), div.fixed button:has(svg.lucide-x)', 'Back to Split Room CTA');
  await sleep(2000);

  // 6. SCENE 6: Host Off-Ramp to Restaurant Local Account
  console.log('[Demo] Scene 6: Executing Off-Ramp to Restaurant');
  await safeClick(page, 'nav button:has-text("Home")', 'Return to Home for Off-Ramp');
  await sleep(2000);
  await page.evaluate(() => window.scrollTo({ top: 150, behavior: 'smooth' }));
  await sleep(1500);

  // Click Release Funds to Restaurant (green button in Stellar Vault card)
  await safeClick(page, 'button:has-text("Release")', 'Release Funds to Restaurant Button');
  await sleep(2500);

  // Confirm Off-Ramp inside modal
  await safeClick(page, 'div.fixed button:has-text("Release")', 'Confirm Off-Ramp Release');
  
  // Wait for off-ramp confirmation
  console.log('[Demo] Waiting for Off-Ramp settlement...');
  await sleep(6500);

  // Dismiss Off-Ramp Modal
  console.log('[Demo] Dismissing Off-Ramp Modal');
  await safeClick(page, 'button:has-text("Done & Close")', 'Done & Close Off-Ramp');
  await sleep(2000);

  // 7. SCENE 7: Client-Side ELA Receipt Forensics (Verify AI)
  console.log('[Demo] Scene 7: Demonstrating Receipt Forensics (Verify AI)');
  await safeClick(page, 'nav button:has-text("Verify AI"), nav button:has-text("Verify")', 'Verify AI Tab');
  await sleep(3000);

  // Click Tampered Receipt Preset to show ELA Heatmap detection
  console.log('[Demo] Running ELA forensic scan on sample receipt');
  await safeClick(page, 'button:has-text("Sample Tampered"), button:has-text("Tampered")', 'Sample Tampered Preset');
  await sleep(3500);

  // Toggle Heatmap Analysis View
  await safeClick(page, 'button:has-text("Heatmap"), button:has-text("ELA Analysis")', 'Toggle Heatmap');
  await sleep(2500);

  // 8. SCENE 8: Summary Tab
  console.log('[Demo] Scene 8: Final Summary Tab');
  await safeClick(page, 'nav button:has-text("Summary")', 'Summary Tab');
  await sleep(3500);

  console.log('[Demo] Demo recording completed successfully. Closing context...');
  await context.close();
  await browser.close();
  await sleep(1500);

  // Find the newest webm file in OUTPUT_DIR
  const videoFiles = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.webm'));
  if (videoFiles.length > 0) {
    videoFiles.sort((a, b) => {
      return fs.statSync(path.join(OUTPUT_DIR, b)).mtimeMs - fs.statSync(path.join(OUTPUT_DIR, a)).mtimeMs;
    });
    const latestWebm = path.join(OUTPUT_DIR, videoFiles[0]);
    const finalWebm = path.resolve('public', 'demo_mobile.webm');
    fs.copyFileSync(latestWebm, finalWebm);
    const size = fs.statSync(finalWebm).size;
    console.log(`[Demo] WebM Video saved successfully at: ${finalWebm} (${(size / (1024 * 1024)).toFixed(2)} MB)`);
  }
}

runMobileDemo().catch(console.error);
