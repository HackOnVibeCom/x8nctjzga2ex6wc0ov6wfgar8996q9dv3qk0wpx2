import asyncio
import os
import subprocess
import edge_tts

FFMPEG_PATH = r"C:\Users\HP\AppData\Roaming\Python\Python314\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"
OUTPUT_DIR = os.path.abspath("narration_audio")
os.makedirs(OUTPUT_DIR, exist_ok=True)

VOICE = "en-US-AndrewNeural"

SCENES = [
    {
        "id": "scene_1",
        "title": "Introduction & Zero-CAC Problem",
        "text": (
            "Welcome to IPIN, the zero-CAC multiplayer bill splitting protocol with client-side forensic verification "
            "and real-time Stellar testnet settlement. Group dining today suffers from two major friction points: "
            "hosts hate fronting massive bills from their personal bank accounts, and peer-to-peer transfers are constantly "
            "vulnerable to fake edited receipts. IPIN solves both, turning every shared restaurant bill into viral peer-to-peer user acquisition."
        )
    },
    {
        "id": "scene_2",
        "title": "Split Room Creation & Auto-Resolving Bank",
        "text": (
            "Let's launch a split. The host never inputs their own personal bank account. "
            "Instead, we select the restaurant's local bank, like OPay, and enter their ten-digit account number. "
            "IPIN instantly auto-resolves the account name to Ibrahim S., verifying destination validity before money moves. "
            "We choose the Naija Chow preset, which features an interactive item builder with pieces steppers and prices. "
            "Tapping Launch Bill automatically deploys and funds a dedicated cryptographic Stellar Escrow Vault on-chain via Friendbot."
        )
    },
    {
        "id": "scene_3",
        "title": "Home Dashboard & Stellar Vault Card",
        "text": (
            "Now inside the active room, the host and friends see the Stellar Vault card live. "
            "Every member has complete transparency into the escrow contract and the restaurant payout destination. "
            "Notice the vault pool balance starts at zero, awaiting friend deposits before any off-ramp can be authorized."
        )
    },
    {
        "id": "scene_4",
        "title": "Claiming Line Items & Mid-Meal Addition",
        "text": (
            "Friends now claim what they ordered. Tapping items claims dishes individually or splits shared dishes equally. "
            "What if someone orders extra drinks mid-meal? There is no need to make a new room. "
            "Users simply tap Add Bill Item, select two pieces of Chapman Cocktail, set the price, and claim it on the fly. "
            "All changes synchronize instantaneously across devices via Supabase PostgreSQL."
        )
    },
    {
        "id": "scene_5",
        "title": "Pollar Multi-Currency Checkout & On-Ramp",
        "text": (
            "When it is time to settle, IPIN launches the Pollar checkout gateway. "
            "It supports local virtual accounts, global cards in US Dollars, Euros, and Pounds, plus direct Web3 wallets. "
            "Simulating the inbound bank transfer triggers Pollar to mint USDC and deposit directly into the room's Stellar testnet vault. "
            "We receive an official IPIN settlement receipt backed by a verifiable transaction hash broadcasted to Stellar Horizon."
        )
    },
    {
        "id": "scene_6",
        "title": "Host Off-Ramp to Restaurant Local Account",
        "text": (
            "Here is the game changer. The escrow vault pool now holds the collected funds. "
            "The host simply taps Release to Restaurant via Pollar. "
            "The protocol executes an automated off-ramp, converting the vault USDC directly into local fiat and dispatching the payout straight to the restaurant's OPay account. "
            "The host never touched the funds, eliminating fronting risk and tax exposure completely."
        )
    },
    {
        "id": "scene_7",
        "title": "Client-Side ELA Forensics (Verify AI)",
        "text": (
            "What about friends who upload screenshot payment proofs? "
            "IPIN features client-side Error Level Analysis forensics executed directly on an HTML5 canvas. "
            "Scanning a sample tampered receipt detects compression anomalies and highlights fraudulent pixel edits in vivid red heatmaps. "
            "This gives merchants and organizers instant fraud detection with zero backend compute."
        )
    },
    {
        "id": "scene_8",
        "title": "Event Summary & Hackathon Conclusion",
        "text": (
            "Finally, the Summary tab gives every diner a complete audit breakdown. "
            "IPIN delivers frictionless dining, instant cross-border settlement, and tamper-proof verification. "
            "Built for HackOnVibe 2026. Thank you."
        )
    }
]

async def generate_scene_audio(scene):
    filepath = os.path.join(OUTPUT_DIR, f"{scene['id']}.mp3")
    print(f"[TTS] Generating {scene['id']} ({scene['title']})...")
    communicate = edge_tts.Communicate(scene['text'], VOICE, rate="+3%")
    await communicate.save(filepath)
    
    # Get duration using ffprobe/ffmpeg
    cmd = [
        FFMPEG_PATH, "-i", filepath,
        "-f", "null", "-"
    ]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
    # Parse duration from ffmpeg output: Duration: 00:00:23.45
    duration = 10.0
    for line in res.stderr.splitlines():
        if "Duration:" in line:
            parts = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = parts.split(":")
            duration = float(h)*3600 + float(m)*60 + float(s)
            break
    print(f"[TTS] {scene['id']} generated: {duration:.2f} seconds")
    return {
        "id": scene["id"],
        "file": filepath,
        "duration": duration,
        "title": scene["title"]
    }

async def main():
    results = []
    for s in SCENES:
        r = await generate_scene_audio(s)
        results.append(r)
        
    # Generate concat file for full narration
    concat_list = os.path.join(OUTPUT_DIR, "concat.txt")
    with open(concat_list, "w", encoding="utf-8") as f:
        for r in results:
            # write formatted line for ffmpeg concat
            # escape backslashes
            escaped = r["file"].replace("\\", "/")
            f.write(f"file '{escaped}'\n")
            
    full_audio = os.path.join(OUTPUT_DIR, "narration_full.mp3")
    cmd = [
        FFMPEG_PATH, "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list, "-c", "copy", full_audio
    ]
    subprocess.run(cmd, check=True)
    
    # Print timings json
    import json
    timings_path = os.path.join(OUTPUT_DIR, "timings.json")
    with open(timings_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
        
    print(f"\n[TTS] All scenes generated successfully! Full audio: {full_audio}")
    print(f"[TTS] Scene timings saved to: {timings_path}")

if __name__ == "__main__":
    asyncio.run(main())
