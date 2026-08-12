import re
from pathlib import Path

from PIL import Image


root = Path(r"C:\Users\jjenn\GitHub\times-quest\times-quest")
source = (root / "public" / "index.html").read_text(encoding="utf-8")
entries = re.findall(
    r"campPiece\('([^']+)'\s*,\s*'([^']+)'.*?'(camp-[^']+\.png)'",
    source,
)
avatar = Image.open(root / "public" / "art" / "avatar" / "profile-1.png").convert("RGBA")
avatar_box = avatar.getchannel("A").getbbox()
avatar_w = (avatar_box[2] - avatar_box[0]) / avatar.width
avatar_h = (avatar_box[3] - avatar_box[1]) / avatar.height

for item_id, name, filename in entries:
    path = root / "public" / "art" / "camp" / filename
    image = Image.open(path).convert("RGBA")
    frame_width = image.width // 3 if "strip3" in filename else image.width
    frame = image.crop((0, 0, frame_width, image.height))
    box = frame.getchannel("A").getbbox()
    width_ratio = (box[2] - box[0]) / frame_width
    height_ratio = (box[3] - box[1]) / image.height
    print(f"{item_id:24} {name:22} alpha={width_ratio:.3f}x{height_ratio:.3f}")

print(f"{'camp-climber':24} {'Profile explorer':22} alpha={avatar_w:.3f}x{avatar_h:.3f}")

