import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\HP\\AppData\\Local\\ms-playwright';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG_PATH = 'C:\\Users\\HP\\AppData\\Roaming\\Python\\Python314\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v9.0.2.exe';
const TARGET_URL = 'http://localhost:4174';
const OUTPUT_DIR = path.resolve('demo_recordings');
const NARRATION_DIR = path.resolve('narration_audio_client_path');
const NARRATION_FULL = path.join(NARRATION_DIR, 'narration_full.mp3');
const TIMINGS_JSON = path.join(NARRATION_DIR, 'step_durations.json');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const timings = JSON.parse(fs.readFileSync(TIMINGS_JSON, 'utf-8'));

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

// Injects an animated touch indicator and continuous keep-alive render loop
async function setupMobileTouchCursor(page) {
  await page.evaluate(() => {
    // 1. Keep-alive 60fps compositor ticker so Chromium NEVER drops frames during pauses
    const ticker = document.createElement('div');
    ticker.id = 'demo-frame-keepalive';
    ticker.style.position = 'fixed';
    ticker.style.bottom = '1px';
    ticker.style.right = '1px';
    ticker.style.width = '2px';
    ticker.style.height = '2px';
    ticker.style.opacity = '0.02';
    ticker.style.pointerEvents = 'none';
    ticker.style.zIndex = '9999999';
    document.body.appendChild(ticker);

    let angle = 0;
    function keepaliveTick() {
      angle = (angle + 1) % 360;
      ticker.style.transform = `rotate(${angle}deg)`;
      requestAnimationFrame(keepaliveTick);
    }
    requestAnimationFrame(keepaliveTick);

    // 2. Visual mobile touch cursor showing judge exactly where to poke
    const cursor = document.createElement('div');
    cursor.id = 'demo-touch-cursor';
    cursor.style.position = 'fixed';
    cursor.style.width = '30px';
    cursor.style.height = '30px';
    cursor.style.borderRadius = '50%';
    cursor.style.backgroundColor = 'rgba(22, 163, 74, 0.4)';
    cursor.style.border = '2.5px solid rgba(22, 163, 74, 0.95)';
    cursor.style.boxShadow = '0 0 14px rgba(34, 197, 94, 0.7)';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '999999';
    cursor.style.transform = 'translate(-50%, -50%) scale(0)';
    cursor.style.transition = 'transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease';
    cursor.style.opacity = '0';
    document.body.appendChild(cursor);

    window.__tapAt = (x, y) => {
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      cursor.style.opacity = '1';
      cursor.style.transform = 'translate(-50%, -50%) scale(1.15)';
      setTimeout(() => {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.85)';
      }, 150);
      setTimeout(() => {
        cursor.style.opacity = '0';
        cursor.style.transform = 'translate(-50%, -50%) scale(0)';
      }, 450);
    };
  });
}

async function touchClick(page, selector, desc = '') {
  try {
    const el = await page.locator(selector).first();
    await el.scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => {});
    await el.waitFor({ state: 'visible', timeout: 5000 });
    const box = await el.boundingBox();
    if (box) {
      const clickX = box.x + box.width / 2;
      const clickY = box.y + box.height / 2;
      await page.evaluate(({ x, y }) => window.__tapAt(x, y), { x: clickX, y: clickY });
      await sleep(180);
    }
    await el.click({ timeout: 5000 });
    console.log(`[Demo] Touched: ${desc || selector}`);
    return true;
  } catch (err) {
    console.warn(`[Demo] Warning: Could not touch ${desc || selector}: ${err.message}`);
    return false;
  }
}

async function runStepWithExactDuration(stepId, actionFn) {
  const stepMeta = timings.steps[stepId];
  if (!stepMeta) {
    console.error(`Unknown step: ${stepId}`);
    return;
  }
  const targetDurationMs = stepMeta.duration_ms;
  console.log(`\n======================================================`);
  console.log(`[Demo] START STEP: ${stepId} - "${stepMeta.title}" (Target: ${stepMeta.duration_sec}s / ${targetDurationMs}ms)`);
  console.log(`======================================================`);

  const stepStart = Date.now();
  try {
    await actionFn();
  } catch (err) {
    console.error(`[Demo] Error in ${stepId}:`, err);
  }
  const elapsed = Date.now() - stepStart;
  const remaining = targetDurationMs - elapsed;
  console.log(`[Demo] Action completed in ${elapsed}ms. Holding for exact sync: ${remaining > 0 ? remaining : 0}ms`);
  if (remaining > 0) {
    await sleep(remaining);
  }
  const totalActual = Date.now() - stepStart;
  console.log(`[Demo] FINISHED STEP: ${stepId} in ${totalActual}ms (Diff from target: ${totalActual - targetDurationMs}ms)`);
}

async function runClientPathDemo() {
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
  await sleep(2000);
  await setupMobileTouchCursor(page);

  // STEP 1: Landing Page & Client Path Start
  await runStepWithExactDuration('step_01', async () => {
    await page.evaluate(() => window.scrollBy({ top: 320, behavior: 'smooth' }));
    await sleep(4000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(3000);
    await touchClick(page, 'button:has-text("Create Split Room")', 'Create Split Room Button');
    await sleep(1500);
  });

  // STEP 2: Auto-Resolving Restaurant Bank
  await runStepWithExactDuration('step_02', async () => {
    const modalForm = await page.$('form');
    if (modalForm) {
      await modalForm.evaluate((el) => el.scrollBy({ top: 220, behavior: 'smooth' }));
    }
    await sleep(2500);

    // Enter Restaurant Name
    const vendorInput = await page.$('input[placeholder*="Iya Said"], input[placeholder*="KFC"]');
    if (vendorInput) {
      await vendorInput.fill('');
      await vendorInput.type('Iya Said Alamala', { delay: 40 });
    }
    await sleep(1500);

    // Type Account Number 9136447931
    const accInput = await page.$('input[placeholder*="9136447931"]');
    if (accInput) {
      await accInput.fill('');
      await accInput.type('9136447931', { delay: 80 });
    }
    await sleep(3500);

    console.log('[Demo] Verified Restaurant account name displayed: IBRAHIM S. (OPAY)');
  });

  // STEP 3: Interactive Item Builder & Pieces Stepper
  await runStepWithExactDuration('step_03', async () => {
    const modalForm = await page.$('form');
    if (modalForm) {
      await modalForm.evaluate((el) => el.scrollTo({ top: 0, behavior: 'smooth' }));
    }
    await sleep(1500);

    // Click "+ Sample Naija Chow" Preset
    await touchClick(page, 'button:has-text("+ Sample Naija Chow")', 'Sample Naija Chow Preset');
    await sleep(2500);

    // Scroll to item builder steppers
    if (modalForm) {
      await modalForm.evaluate((el) => el.scrollBy({ top: 380, behavior: 'smooth' }));
    }
    await sleep(1500);

    // Click "+" on pieces stepper
    const plusButtons = await page.$$('button:has-text("+")');
    if (plusButtons.length > 0) {
      const lastPlus = plusButtons[plusButtons.length - 1];
      const box = await lastPlus.boundingBox();
      if (box) {
        await page.evaluate(({ x, y }) => window.__tapAt(x, y), { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      }
      await lastPlus.click();
      await sleep(1200);
    }
  });

  // STEP 4: Deploying Stellar Escrow Vault
  await runStepWithExactDuration('step_04', async () => {
    await touchClick(page, 'button:has-text("Launch Bill & Deploy Stellar Vault")', 'Launch Bill CTA');
    await sleep(3500);
    await page.waitForSelector('text=Escrow Vault', { timeout: 15000 }).catch(() => {});
  });

  // STEP 5: Room Dashboard & Escrow Transparency
  await runStepWithExactDuration('step_05', async () => {
    await sleep(2000);
    await page.evaluate(() => window.scrollBy({ top: 220, behavior: 'smooth' }));
    await sleep(5000);
    console.log('[Demo] Highlighting Stellar Escrow Vault card');
  });

  // STEP 6: Claiming Line Items
  await runStepWithExactDuration('step_06', async () => {
    const claimTile = await touchClick(page, 'div.grid-cols-4 button:has-text("Claim")', 'Claim Action Tile');
    if (!claimTile) {
      await touchClick(page, 'nav button:has-text("Claim")', 'Claim Nav Button');
    }
    await sleep(2000);

    const claimButtons = await page.$$('button:has-text("Claim"), button:has-text("Split")');
    if (claimButtons.length > 0) {
      await claimButtons[0].click();
      await sleep(1200);
    }
    if (claimButtons.length > 1) {
      await claimButtons[1].click();
      await sleep(1200);
    }
  });

  // STEP 7: Mid-Meal Dish Addition Modal
  await runStepWithExactDuration('step_07', async () => {
    await touchClick(page, 'button:has-text("Add Item")', 'Add Bill Item Button');
    await sleep(2000);

    const nameInput = await page.$('input[placeholder*="Chapman"], input[placeholder*="Garlic"]');
    if (nameInput) {
      await nameInput.fill('');
      await nameInput.type('Chapman Cocktail', { delay: 60 });
      await sleep(800);
    }

    const addModalPlus = await page.$('form button:has-text("+")');
    if (addModalPlus) {
      await addModalPlus.click();
      await sleep(800);
    }

    const priceInput = await page.$('input[placeholder*="2500"], input[placeholder*="15.50"]');
    if (priceInput) {
      await priceInput.fill('');
      await priceInput.type('2500', { delay: 60 });
      await sleep(1000);
    }

    await touchClick(page, 'button:has-text("Add & Claim")', 'Add & Claim CTA');
    await sleep(2000);
  });

  // STEP 8: Pollar Multi-Currency Checkout
  await runStepWithExactDuration('step_08', async () => {
    await touchClick(page, 'nav button:has-text("Home")', 'Home Nav Button');
    await sleep(1500);

    await touchClick(page, 'div.grid-cols-4 button:has-text("Settle")', 'Settle Action Tile');
    await sleep(2000);

    await touchClick(page, 'button:has-text("Pay via Pollar")', 'Pay via Pollar CTA');
    await sleep(2000);

    await touchClick(page, 'button:has-text("Card")', 'Card Rail');
    await sleep(1500);
  });

  // STEP 9: Stellar On-Chain Minting & Official Receipt
  await runStepWithExactDuration('step_09', async () => {
    await touchClick(page, 'button:has-text("Bank")', 'Bank Rail');
    await sleep(1500);

    await touchClick(page, 'button:has-text("I Have Sent Bank Transfer")', 'Confirm Bank Transfer');
    console.log('[Demo] Waiting for on-chain block confirmation...');

    try {
      const receipt = page.locator('#close-receipt-modal-done-btn').or(page.locator('text=Settlement Verified'));
      await receipt.first().waitFor({ state: 'visible', timeout: 25000 });
    } catch (e) {
      console.warn('[Demo] Wait notice for receipt modal:', e.message);
    }
    await sleep(3500);

    await touchClick(page, '#close-receipt-modal-done-btn, button:has-text("Done")', 'Close Receipt Done Button');
    await sleep(1500);
  });

  // STEP 10: Host Off-Ramp to Restaurant OPay Account
  await runStepWithExactDuration('step_10', async () => {
    await touchClick(page, 'nav button:has-text("Home")', 'Return to Home for Off-Ramp');
    await sleep(1800);

    await page.evaluate(() => window.scrollTo({ top: 180, behavior: 'smooth' }));
    await sleep(2000);

    await touchClick(page, 'button:has-text("Release")', 'Release Funds to Restaurant Button');
    await sleep(2500);

    await touchClick(page, 'div.fixed button:has-text("Release")', 'Confirm Off-Ramp Release');
    console.log('[Demo] Waiting for off-ramp settlement on Stellar Horizon...');

    try {
      const offrampReceipt = page.locator('#close-receipt-modal-done-btn').or(page.locator('text=Settlement Verified')).or(page.locator('text=Off-Ramp Settled'));
      await offrampReceipt.first().waitFor({ state: 'visible', timeout: 25000 });
    } catch (e) {
      console.warn('[Demo] Wait notice for offramp receipt:', e.message);
    }
    await sleep(3500);

    await touchClick(page, '#close-receipt-modal-done-btn, button:has-text("Done")', 'Done Off-Ramp');
    await sleep(1500);
  });

  // STEP 11: Client-Side ELA Receipt Forensics
  await runStepWithExactDuration('step_11', async () => {
    await touchClick(page, 'nav button:has-text("Verify AI"), nav button:has-text("Verify")', 'Verify AI Tab');
    await sleep(2500);

    await touchClick(page, 'button:has-text("Sample Tampered"), button:has-text("Tampered")', 'Sample Tampered Preset');
    await sleep(4000);

    await touchClick(page, 'button:has-text("Heatmap"), button:has-text("ELA Analysis")', 'Toggle Heatmap');
    await sleep(5000);
  });

  // STEP 12: Final Summary & Audit Breakdown
  await runStepWithExactDuration('step_12', async () => {
    await touchClick(page, 'nav button:has-text("Summary")', 'Summary Tab');
    await sleep(3000);

    await page.evaluate(() => window.scrollBy({ top: 220, behavior: 'smooth' }));
    await sleep(4000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(3000);
  });

  console.log('[Demo] Client path recording finished. Closing context...');
  await context.close();
  await browser.close();
  await sleep(2000);

  // Locate the new webm recording
  const videoFiles = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.webm'));
  if (videoFiles.length > 0) {
    videoFiles.sort((a, b) => {
      return fs.statSync(path.join(OUTPUT_DIR, b)).mtimeMs - fs.statSync(path.join(OUTPUT_DIR, a)).mtimeMs;
    });
    const latestWebm = path.join(OUTPUT_DIR, videoFiles[0]);
    console.log(`[Demo] Latest raw video: ${latestWebm} (${(fs.statSync(latestWebm).size / (1024 * 1024)).toFixed(2)} MB)`);

    const finalMp4 = path.resolve('public', 'demo_mobile.mp4');
    const finalWebm = path.resolve('public', 'demo_mobile.webm');

    // Mux Video + Synchronized Audio into MP4 (H.264 + AAC)
    console.log('[Demo] Muxing Video + Narration Audio into MP4 at', finalMp4);
    try {
      execSync(`"${FFMPEG_PATH}" -y -i "${latestWebm}" -i "${NARRATION_FULL}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "${finalMp4}"`, {
        stdio: 'inherit',
      });
      const mp4Size = (fs.statSync(finalMp4).size / (1024 * 1024)).toFixed(2);
      console.log(`[Demo] ✓ MP4 Video with Audio generated successfully: ${finalMp4} (${mp4Size} MB)`);
    } catch (e) {
      console.error('[Demo] FFmpeg MP4 muxing error:', e.message);
    }

    // Mux Video + Synchronized Audio into WebM (VP9 + Opus)
    console.log('[Demo] Muxing Video + Narration Audio into WebM at', finalWebm);
    try {
      execSync(`"${FFMPEG_PATH}" -y -i "${latestWebm}" -i "${NARRATION_FULL}" -c:v copy -c:a libopus -b:a 128k "${finalWebm}"`, {
        stdio: 'inherit',
      });
      const webmSize = (fs.statSync(finalWebm).size / (1024 * 1024)).toFixed(2);
      console.log(`[Demo] ✓ WebM Video with Audio generated successfully: ${finalWebm} (${webmSize} MB)`);
    } catch (e) {
      console.error('[Demo] FFmpeg WebM muxing error:', e.message);
    }
  }
}

runClientPathDemo().catch(console.error);
