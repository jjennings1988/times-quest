from pathlib import Path

from PIL import Image, ImageDraw


root = Path(r"C:\Users\jjenn\GitHub\times-quest\times-quest")
avatar_dir = root / "public" / "art" / "avatar"
avatar_sheet = Image.new("RGBA", (7 * 210, 3 * 270), (239, 232, 214, 255))
draw = ImageDraw.Draw(avatar_sheet)
for slot, profile in enumerate(range(1, 20)):
    image = Image.open(avatar_dir / f"profile-{profile}.png").convert("RGBA")
    image.thumbnail((188, 235), Image.Resampling.LANCZOS)
    column, row = slot % 7, slot // 7
    x = column * 210 + (210 - image.width) // 2
    y = row * 270 + 25 + (235 - image.height)
    avatar_sheet.alpha_composite(image, (x, y))
    draw.text((column * 210 + 8, row * 270 + 7), str(profile), fill=(45, 42, 74, 255))
avatar_sheet.save(root / ".codex-avatar-review.png")

names = ["dusk", "morning", "autumn", "moonlit"]
background_sheet = Image.new("RGB", (590 * 2, 320 * 2), (20, 16, 46))
for slot, name in enumerate(names):
    image = Image.open(root / "public" / "art" / "camp" / f"bg-camp-{name}.png").convert("RGB")
    image.thumbnail((590, 320), Image.Resampling.LANCZOS)
    background_sheet.paste(image, ((slot % 2) * 590, (slot // 2) * 320))
background_sheet.save(root / ".codex-background-review.jpg", quality=92)

