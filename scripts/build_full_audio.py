import os
import subprocess
import json

FFMPEG = r"C:\Users\HP\AppData\Roaming\Python\Python314\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"
DIR = os.path.abspath("narration_audio")
scenes = ["scene_1", "scene_2", "scene_3", "scene_4", "scene_5", "scene_6", "scene_7", "scene_8"]

concat_file = os.path.join(DIR, "concat.txt")
with open(concat_file, "w", encoding="utf-8") as f:
    for s in scenes:
        p = os.path.join(DIR, f"{s}.mp3").replace("\\", "/")
        f.write(f"file '{p}'\n")

full_mp3 = os.path.join(DIR, "narration_full.mp3")
cmd = [FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", concat_file, "-c", "copy", full_mp3]
subprocess.run(cmd, check=True)

timings = {}
for s in scenes:
    p = os.path.join(DIR, f"{s}.mp3")
    cmd = [FFMPEG, "-i", p, "-f", "null", "-"]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
    dur = 10.0
    for line in res.stderr.splitlines():
        if "Duration:" in line:
            parts = line.split("Duration:")[1].split(",")[0].strip()
            h, m, sec = parts.split(":")
            dur = float(h)*3600 + float(m)*60 + float(sec)
            break
    timings[s] = round(dur, 2)

timings_file = os.path.join(DIR, "timings.json")
with open(timings_file, "w", encoding="utf-8") as f:
    json.dump(timings, f, indent=2)

print("TIMINGS_RESULT:", json.dumps(timings))
total = sum(timings.values())
print(f"Total narration duration: {total:.2f} seconds ({total/60:.2f} minutes)")
