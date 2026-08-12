import re
from pathlib import Path

from PIL import Image


root = Path(r"C:\Users\jjenn\GitHub\times-quest\times-quest")
source = (root / "public" / "index.html").read_text(encoding="utf-8")
physical_block = re.search(r"const CAMP_PHYSICAL_WIDTH=\{(.*?)\n\};", source, re.S).group(1)
physical = {key: float(value) for key, value in re.findall(r"'([^']+)'\s*:\s*([.\d]+)", physical_block)}
entries = re.findall(r"campPiece\('([^']+)'\s*,\s*'([^']+)'.*?'(camp-[^']+\.png)'", source)

avatar = Image.open(root / "public" / "art" / "avatar" / "profile-1.png").convert("RGBA")
avatar_box = avatar.getchannel("A").getbbox()
avatar_width = (avatar_box[2] - avatar_box[0]) / avatar.width
avatar_height = (avatar_box[3] - avatar_box[1]) / avatar.height

rows = []
for item_id, name, filename in entries:
    if item_id.startswith("ground-"):
        continue
    image = Image.open(root / "public" / "art" / "camp" / filename).convert("RGBA")
    frame_width = image.width // 3 if "strip3" in filename else image.width
    frame = image.crop((0, 0, frame_width, image.height))
    box = frame.getchannel("A").getbbox()
    alpha_width = (box[2] - box[0]) / frame_width
    alpha_height = (box[3] - box[1]) / image.height
    effective_width = physical[item_id] * alpha_width / avatar_width
    # Container height follows the item's art ratio. This ratio shows visible
    # item height beside the child, independent of perspective depth.
    rows.append((item_id, name, physical[item_id], effective_width, alpha_height))

for row in rows:
    print(f"{row[0]:24} {row[1]:22} physical={row[2]:4.2f} visible-width-vs-child={row[3]:4.2f} alpha-height={row[4]:4.2f}")

