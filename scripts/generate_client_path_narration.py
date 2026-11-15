import asyncio
import os
import subprocess
import json
import edge_tts

FFMPEG_PATH = r"C:\Users\HP\AppData\Roaming\Python\Python314\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"
OUTPUT_DIR = os.path.abspath("narration_audio_client_path")
os.makedirs(OUTPUT_DIR, exist_ok=True)

VOICE = "en-US-AndrewNeural"

STEPS = [
    {
        "id": "step_01",
        "title": "Landing Page & Client Path Start",
        "text": (
            "Welcome to the IPIN testing demo. To start the client path, we arrive at the landing page "
            "with zero signups required. Notice that group dining needs no prior app installs. "
            "To begin testing the product, tap Create Split Room."
        )
    },
    {
        "id": "step_02",
        "title": "Auto-Resolving Restaurant Bank",
        "text": (
            "On the room creation form, we configure where the pooled funds will land. "
            "Type the restaurant name as Iya Said Alamala. Destination bank is set to OPay. "
            "Enter the ten-digit account number 9136447931. "
            "Notice how IPIN immediately auto-resolves the account name to Ibrahim S., "
            "verifying the restaurant destination before any money moves."
        )
    },
    {
        "id": "step_03",
        "title": "Interactive Item Builder & Pieces Stepper",
        "text": (
            "Next, load the bill items by tapping the Sample Naija Chow preset. "
            "Notice the interactive item builder: you can use the plus and minus steppers "
            "to dynamically adjust the piece count and unit price for items like Jollof Rice and Peppered Goat."
        )
    },
    {
        "id": "step_04",
        "title": "Deploying Stellar Escrow Vault",
        "text": (
            "Now, tap Launch Bill & Deploy Stellar Vault. "
            "IPIN creates the room in Supabase and deploys an on-chain Escrow Vault contract directly on "
            "the Stellar Horizon Testnet, funding it via Friendbot."
        )
    },
    {
        "id": "step_05",
        "title": "Room Dashboard & Escrow Transparency",
        "text": (
            "We are now in the live room dashboard. "
            "Here, you see the active Stellar Escrow Vault card with its public key, "
            "the restaurant OPay payout target, and zero-CAC invite links for dining friends. "
            "Notice the vault pool balance starts at zero, awaiting friend deposits."
        )
    },
    {
        "id": "step_06",
        "title": "Claiming Line Items",
        "text": (
            "To test the participant claiming flow, tap Claim in the navigation bar. "
            "Tap Claim on the Jollof Rice with Dodo and the Suya Platter. "
            "Notice your personal share recalculates dynamically in real time."
        )
    },
    {
        "id": "step_07",
        "title": "Mid-Meal Dish Addition Modal",
        "text": (
            "What if friends order extra drinks mid-meal? Tap Add Item. "
            "The Add Bill Item modal appears. Type Chapman Cocktail, set the quantity to two pieces "
            "using the stepper, enter 2500 Naira, and tap Add & Claim. "
            "The item is added to the bill and assigned to your tab seamlessly without resetting the room."
        )
    },
    {
        "id": "step_08",
        "title": "Pollar Multi-Currency Checkout",
        "text": (
            "Now let's test the payment checkout. Tap Home, then tap Settle, and click Pay via Pollar. "
            "The multi-currency checkout gateway opens, showing Card, Bank, and Web3 payment rails."
        )
    },
    {
        "id": "step_09",
        "title": "Stellar On-Chain Minting & Official Receipt",
        "text": (
            "Select the Bank rail to test local transfer, and tap I Have Sent Bank Transfer. "
            "Notice that Pollar bridges fiat directly onto the Stellar blockchain. "
            "Watch closely as the smart contract mints USDC and deposits directly into the room's Escrow Vault on-chain. "
            "The official IPIN Settlement Receipt appears with the verified on-chain transaction hash and cryptographic block confirmation. "
            "Tap Done to return."
        )
    },
    {
        "id": "step_10",
        "title": "Host Off-Ramp to Restaurant OPay Account",
        "text": (
            "Now test the host off-ramp. Notice the vault balance is now fully funded by the dining members. "
            "Because IPIN holds funds securely in escrow, the host never fronts money from their personal bank. "
            "Tap Release Funds to Restaurant. Review the restaurant's verified OPay details, and tap Release. "
            "Watch as the escrow contract off-ramps the pooled funds directly to the restaurant's local bank account on the Stellar ledger, "
            "backed by an immutable payout receipt. Tap Done."
        )
    },
    {
        "id": "step_11",
        "title": "Client-Side ELA Receipt Forensics",
        "text": (
            "Next, let's test the fraud detection module. Tap the Verify tab. "
            "IPIN performs client-side Error Level Analysis on the HTML5 Canvas to catch altered screenshots. "
            "Tap Sample Tampered. The scan runs directly in your browser: "
            "notice how the manipulated numbers glow in high-contrast red error clusters on the heatmap."
        )
    },
    {
        "id": "step_12",
        "title": "Final Summary & Audit Breakdown",
        "text": (
            "Finally, tap the Summary tab. Here the judges can see the transparent ledger audit: "
            "all claimed items, settled participants, and verified escrow transactions. "
            "Everything is fully live, testnet-backed, and ready for you to test. Thank you."
        )
    }
]

def get_audio_duration_ms(filepath):
    cmd = [FFMPEG_PATH, "-i", filepath]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    for line in res.stderr.splitlines():
        if "Duration:" in line:
            parts = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = parts.split(":")
            total_sec = int(h) * 3600 + int(m) * 60 + float(s)
            return int(total_sec * 1000)
    return 15000

async def main():
    durations = {}
    total_ms = 0
    concat_list_path = os.path.join(OUTPUT_DIR, "concat.txt")
    
    # We force re-generating step_02, step_09, and step_10 for updated texts
    regen_steps = {"step_02", "step_09", "step_10"}
    
    with open(concat_list_path, "w", encoding="utf-8") as f_concat:
        for step in STEPS:
            mp3_path = os.path.join(OUTPUT_DIR, f"{step['id']}.mp3")
            
            if (step['id'] in regen_steps) or not (os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 20000):
                print(f"[TTS] Generating {step['id']}: {step['title']}...")
                for attempt in range(5):
                    try:
                        comm = edge_tts.Communicate(step['text'], VOICE, rate="+2%")
                        await comm.save(mp3_path)
                        if os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 20000:
                            break
                    except Exception as e:
                        print(f"  Attempt {attempt+1} failed: {e}. Retrying...")
                        await asyncio.sleep(2)
            else:
                print(f"[TTS] Using cached {step['id']}: {step['title']}")
                
            dur_ms = get_audio_duration_ms(mp3_path)
            durations[step['id']] = {
                "title": step['title'],
                "duration_ms": dur_ms,
                "duration_sec": round(dur_ms / 1000.0, 2),
                "file": f"{step['id']}.mp3"
            }
            total_ms += dur_ms
            f_concat.write(f"file '{step['id']}.mp3'\n")
            print(f"  -> Duration: {dur_ms} ms ({round(dur_ms/1000.0, 2)} s)")
            
    durations_json_path = os.path.join(OUTPUT_DIR, "step_durations.json")
    with open(durations_json_path, "w", encoding="utf-8") as jf:
        json.dump({"total_ms": total_ms, "total_sec": round(total_ms / 1000.0, 2), "steps": durations}, jf, indent=2)
        
    print(f"\n[TTS] Total Narration Duration: {round(total_ms / 1000.0, 2)} seconds ({round(total_ms / 60000.0, 2)} minutes)")
    
    full_audio_path = os.path.join(OUTPUT_DIR, "narration_full.mp3")
    concat_cmd = [
        FFMPEG_PATH, "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list_path, "-c", "copy", full_audio_path
    ]
    subprocess.run(concat_cmd, check=True)
    print(f"[TTS] Full combined narration saved to: {full_audio_path}")

if __name__ == "__main__":
    asyncio.run(main())
