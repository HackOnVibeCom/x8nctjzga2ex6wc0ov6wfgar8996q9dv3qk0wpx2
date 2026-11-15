import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\HP\\AppData\\Local\\ms-playwright';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG_PATH = 'C:\\Users\\HP\\AppData\\Roaming\\Python\\Python314\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v9.0.2.exe';
const TARGET_URL = 'http://localhost:4174';
const OUTPUT_DIR = path.resolve('demo_recordings');
const NARRATION_AUDIO = path.resolve('narration_audio', 'narration_full.mp3');

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
    await el.waitFor({ state: 'visible', timeout: 5000 });
    await el.click({ timeout: 5000 });
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
  page.setDefaultTimeout(35000);

  console.log('[Demo] Navigating to', TARGET_URL);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);

  // 1. SCENE 1: Welcome & Landing Walkthrough (27 seconds)
  console.log('[Demo] Scene 1: Landing page presentation & problem statement');
  await page.evaluate(() => window.scrollBy({ top: 320, behavior: 'smooth' }));
  await sleep(4000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await sleep(5000);
  await page.evaluate(() => window.scrollBy({ top: 450, behavior: 'smooth' }));
  await sleep(5000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(3500);

  // 2. SCENE 2: Create New Split Room with Auto-Resolving Bank (24 seconds)
  console.log('[Demo] Scene 2: Creating Room with Auto-Resolving Bank & Item Builder');
  await safeClick(page, 'button:has-text("Create Split Room")', 'Create Split Room Button');
  await sleep(2000);

  // Click "+ Sample Naija Chow" Preset
  console.log('[Demo] Selecting + Sample Naija Chow Preset');
  await safeClick(page, 'button:has-text("+ Sample Naija Chow")', 'Sample Naija Chow Preset');
  await sleep(2500);

  // Scroll inside modal to show auto-resolved bank
  const modalScroll = await page.$('form');
  if (modalScroll) {
    await modalScroll.evaluate((el) => el.scrollBy({ top: 250, behavior: 'smooth' }));
  }
  await sleep(3500);

  // Demonstrate Interactive Item Builder (Pieces & Price)
  console.log('[Demo] Demonstrating Pieces Stepper in Item Builder');
  if (modalScroll) {
    await modalScroll.evaluate((el) => el.scrollBy({ top: 350, behavior: 'smooth' }));
  }
  await sleep(2000);

  // Click "+" on pieces stepper
  const plusButtons = await page.$$('button:has-text("+")');
  if (plusButtons.length > 0) {
    try {
      await plusButtons[plusButtons.length - 1].click();
      await sleep(1000);
      await plusButtons[plusButtons.length - 1].click();
      await sleep(1500);
    } catch {}
  }

  // Click Submit CTA
  console.log('[Demo] Launching Bill & Generating Stellar Vault');
  await safeClick(page, 'button:has-text("Launch Bill & Deploy Stellar Vault")', 'Launch Bill CTA');
  await sleep(4500);

  // 3. SCENE 3: Home Dashboard & Stellar Testnet Escrow Vault Card (17 seconds)
  console.log('[Demo] Scene 3: Exploring Home Dashboard & Stellar Vault');
  await sleep(2500);
  await page.evaluate(() => window.scrollBy({ top: 220, behavior: 'smooth' }));
  await sleep(8000);

  // 4. SCENE 4: Claim Items Tab & On-The-Fly Item Addition (23 seconds)
  console.log('[Demo] Scene 4: Claiming Line Items & Adding Extra Dish Mid-Meal');
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
      await sleep(1200);
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
    await sleep(1000);
  }

  // Click "+" on quantity stepper
  const addModalPlus = await page.$('form button:has-text("+")');
  if (addModalPlus) {
    await addModalPlus.click();
    await sleep(1000);
  }

  // Fill price
  const itemPriceInput = await page.$('input[placeholder*="2500"], input[placeholder*="15.50"]');
  if (itemPriceInput) {
    await itemPriceInput.fill('2500');
    await sleep(1200);
  }

  // Submit Add & Claim
  await safeClick(page, 'button:has-text("Add & Claim")', 'Add & Claim CTA');
  await sleep(3500);

  // 5. SCENE 5: Pollar Checkout Gateway & Stellar On-Ramp (28 seconds)
  console.log('[Demo] Scene 5: Settling Up via Pollar Checkout Gateway');
  await safeClick(page, 'nav button:has-text("Home")', 'Home Nav Button');
  await sleep(2000);

  await safeClick(page, 'div.grid-cols-4 button:has-text("Settle")', 'Settle Action Tile');
  await sleep(2500);

  // Open Pollar Checkout Gateway
  await safeClick(page, 'button:has-text("Pay via Pollar")', 'Pay via Pollar CTA');
  await sleep(3000);

  // Show Payment Rails (Card & Bank)
  await safeClick(page, 'button:has-text("Card")', 'Card Rail');
  await sleep(2000);
  await safeClick(page, 'button:has-text("Bank")', 'Bank Rail');
  await sleep(2000);

  // Execute Simulated Inbound Bank Payment & Stellar Testnet Minting
  console.log('[Demo] Triggering Inbound Bank Transfer & Stellar On-Chain Minting');
  await safeClick(page, 'button:has-text("I Have Sent Bank Transfer")', 'Confirm Bank Transfer');
  
  // Wait dynamically for real Stellar Testnet confirmation & receipt modal
  console.log('[Demo] Waiting for Stellar testnet block confirmation...');
  try {
    const receiptIndicator = page.locator('#close-receipt-modal-done-btn').or(page.locator('text=Settlement Verified'));
    await receiptIndicator.first().waitFor({ state: 'visible', timeout: 35000 });
  } catch (e) {
    console.warn('[Demo] Wait notice for receipt:', e.message);
  }
  await sleep(3500); // Judges see official receipt with on-chain hash!

  // Dismiss Receipt Modal
  console.log('[Demo] Dismissing Receipt Modal');
  await safeClick(page, '#close-receipt-modal-done-btn, #close-receipt-modal-x-btn, button:has-text("Done")', 'Close Receipt Done Button');
  await sleep(2500);

  // 6. SCENE 6: Host Off-Ramp to Restaurant Local Account (24 seconds)
  console.log('[Demo] Scene 6: Executing Off-Ramp to Restaurant from Stellar Vault');
  await safeClick(page, 'nav button:has-text("Home")', 'Return to Home for Off-Ramp');
  await sleep(2000);
  await page.evaluate(() => window.scrollTo({ top: 180, behavior: 'smooth' }));
  await sleep(2500);

  // Click Release Funds to Restaurant
  await safeClick(page, 'button:has-text("Release")', 'Release Funds to Restaurant Button');
  await sleep(3000);

  // Confirm Off-Ramp inside modal
  console.log('[Demo] Confirming Off-Ramp Release to Restaurant local account');
  await safeClick(page, 'div.fixed button:has-text("Release")', 'Confirm Off-Ramp Release');
  
  // Wait dynamically for off-ramp execution on Stellar Testnet
  console.log('[Demo] Waiting for Off-Ramp settlement on Stellar Horizon...');
  try {
    const offrampReceipt = page.locator('#close-receipt-modal-done-btn').or(page.locator('text=Settlement Verified')).or(page.locator('text=Off-Ramp Settled'));
    await offrampReceipt.first().waitFor({ state: 'visible', timeout: 35000 });
  } catch (e) {
    console.warn('[Demo] Wait notice for offramp receipt:', e.message);
  }
  await sleep(3500); // Judges see off-ramp settlement receipt!

  // Dismiss Off-Ramp Receipt Modal
  console.log('[Demo] Dismissing Off-Ramp Receipt Modal');
  await safeClick(page, '#close-receipt-modal-done-btn, #close-receipt-modal-x-btn, button:has-text("Done")', 'Done Off-Ramp');
  await sleep(2500);

  // 7. SCENE 7: Client-Side ELA Receipt Forensics (Verify AI) (23 seconds)
  console.log('[Demo] Scene 7: Demonstrating Receipt Forensics (Verify AI)');
  await safeClick(page, 'nav button:has-text("Verify AI"), nav button:has-text("Verify")', 'Verify AI Tab');
  await sleep(3000);

  // Click Tampered Receipt Preset to show ELA Heatmap detection
  console.log('[Demo] Running ELA forensic scan on sample receipt');
  await safeClick(page, 'button:has-text("Sample Tampered"), button:has-text("Tampered")', 'Sample Tampered Preset');
  await sleep(4000);

  // Toggle Heatmap Analysis View
  await safeClick(page, 'button:has-text("Heatmap"), button:has-text("ELA Analysis")', 'Toggle Heatmap');
  await sleep(5500);

  // 8. SCENE 8: Summary Tab & Conclusion (14 seconds)
  console.log('[Demo] Scene 8: Final Summary Tab & Conclusion');
  await safeClick(page, 'nav button:has-text("Summary")', 'Summary Tab');
  await sleep(4000);
  await page.evaluate(() => window.scrollBy({ top: 220, behavior: 'smooth' }));
  await sleep(5000);

  console.log('[Demo] Demo recording completed successfully. Closing context...');
  await context.close();
  await browser.close();
  await sleep(2000);

  // Find the newest webm file in OUTPUT_DIR
  const videoFiles = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.webm'));
  if (videoFiles.length > 0) {
    videoFiles.sort((a, b) => {
      return fs.statSync(path.join(OUTPUT_DIR, b)).mtimeMs - fs.statSync(path.join(OUTPUT_DIR, a)).mtimeMs;
    });
    const latestWebm = path.join(OUTPUT_DIR, videoFiles[0]);
    console.log(`[Demo] Latest raw video: ${latestWebm} (${(fs.statSync(latestWebm).size / (1024 * 1024)).toFixed(2)} MB)`);

    const finalMp4 = path.resolve('public', 'demo_mobile.mp4');
    const finalWebm = path.resolve('public', 'demo_mobile.webm');

    // Mux Video + Audio into MP4 (H.264 + AAC)
    console.log('[Demo] Muxing Video + Narration Audio into MP4 at', finalMp4);
    try {
      execSync(`"${FFMPEG_PATH}" -y -i "${latestWebm}" -i "${NARRATION_AUDIO}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${finalMp4}"`, {
        stdio: 'inherit',
      });
      const mp4Size = (fs.statSync(finalMp4).size / (1024 * 1024)).toFixed(2);
      console.log(`[Demo] ✓ MP4 Video with Audio generated successfully: ${finalMp4} (${mp4Size} MB)`);
    } catch (e) {
      console.error('[Demo] FFmpeg MP4 muxing error:', e.message);
    }

    // Mux Video + Audio into WebM (VP9 + Opus)
    console.log('[Demo] Muxing Video + Narration Audio into WebM at', finalWebm);
    try {
      execSync(`"${FFMPEG_PATH}" -y -i "${latestWebm}" -i "${NARRATION_AUDIO}" -c:v copy -c:a libopus -b:a 128k -shortest "${finalWebm}"`, {
        stdio: 'inherit',
      });
      const webmSize = (fs.statSync(finalWebm).size / (1024 * 1024)).toFixed(2);
      console.log(`[Demo] ✓ WebM Video with Audio generated successfully: ${finalWebm} (${webmSize} MB)`);
    } catch (e) {
      console.error('[Demo] FFmpeg WebM muxing error:', e.message);
    }
  }
}

runMobileDemo().catch(console.error);
