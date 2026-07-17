"""Generate VIGIL's original scaffold-only pixel assets.

These assets are deterministic implementation placeholders. They are not considered
production-approved art. See docs/agent/asset-request-protocol.md before replacing
or expanding them.
"""
from __future__ import annotations

import random
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PIXEL_DIR = ROOT / "public" / "assets" / "pixel"
BRAND_DIR = ROOT / "public" / "assets" / "brand"
UI_TEXTURE_DIR = ROOT / "public" / "assets" / "ui" / "textures"
UI_FRAME_DIR = ROOT / "public" / "assets" / "ui" / "frames"
ICON_DIR = ROOT / "src-tauri" / "icons"
DOC_DIR = ROOT / "docs" / "assets"
for directory in (PIXEL_DIR, BRAND_DIR, UI_TEXTURE_DIR, UI_FRAME_DIR, ICON_DIR, DOC_DIR):
    directory.mkdir(parents=True, exist_ok=True)

PALETTE = {
    "outline": (28, 20, 17, 255),
    "skin": (211, 154, 103, 255),
    "skin_dark": (151, 91, 61, 255),
    "bronze": (189, 127, 44, 255),
    "bronze_hi": (241, 195, 106, 255),
    "bronze_dark": (102, 58, 19, 255),
    "red": (143, 37, 33, 255),
    "red_hi": (198, 67, 49, 255),
    "red_dark": (72, 17, 15, 255),
    "cloth": (93, 39, 34, 255),
    "leather": (83, 55, 37, 255),
    "steel": (151, 157, 151, 255),
    "steel_hi": (213, 216, 200, 255),
    "olive": (105, 112, 68, 255),
    "fire": (231, 121, 46, 255),
    "fire_hi": (251, 198, 76, 255),
    "parchment": (239, 219, 177, 255),
    "parchment_dark": (189, 158, 110, 255),
    "stone": (58, 45, 39, 255),
    "stone_dark": (31, 24, 22, 255),
}


def rect(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], color: str) -> None:
    draw.rectangle(xy, fill=PALETTE[color])


def draw_legionary(frame: Image.Image, state: str, tick: int) -> None:
    draw = ImageDraw.Draw(frame)
    bob = [0, -1, 0, 1][tick]
    y = 24

    draw.rectangle((11, 89, 53, 93), fill=(0, 0, 0, 70))

    # cape and tunic
    rect(draw, (23, y + 25 + bob, 45, y + 55 + bob), "red")
    rect(draw, (31, y + 45 + bob, 48, y + 66 + bob), "red_hi")
    rect(draw, (25, y + 56 + bob, 44, y + 70 + bob), "cloth")

    # legs and sandals
    stride = 1 if state == "focus" and tick % 2 else 0
    rect(draw, (25 - stride, y + 63 + bob, 31 - stride, 88), "skin_dark")
    rect(draw, (36 + stride, y + 63 + bob, 42 + stride, 88), "skin_dark")
    rect(draw, (22 - stride, 85, 32 - stride, 91), "leather")
    rect(draw, (36 + stride, 85, 47 + stride, 91), "leather")

    # torso armour
    rect(draw, (22, y + 22 + bob, 44, y + 54 + bob), "steel")
    rect(draw, (25, y + 25 + bob, 41, y + 30 + bob), "steel_hi")
    for row in (33, 39, 45, 51):
        rect(draw, (24, y + row - 8 + bob, 42, y + row - 6 + bob), "outline")

    # neck, head, helmet
    rect(draw, (29, y + 13 + bob, 39, y + 23 + bob), "skin_dark")
    rect(draw, (27, y + 1 + bob, 41, y + 17 + bob), "skin")
    rect(draw, (37, y + 6 + bob, 41, y + 10 + bob), "outline")
    rect(draw, (23, y - 4 + bob, 45, y + 4 + bob), "bronze")
    rect(draw, (27, y - 8 + bob, 41, y - 4 + bob), "bronze_hi")
    rect(draw, (20, y + 2 + bob, 47, y + 6 + bob), "bronze")
    rect(draw, (31, y - 14 + bob, 37, y - 7 + bob), "red")
    rect(draw, (26, y - 13 + bob, 43, y - 10 + bob), "red_hi")

    # spear arm
    arm_y = y + 29 + bob
    if state == "preparing":
        arm_y -= tick
    rect(draw, (43, arm_y, 49, arm_y + 18), "skin")
    spear_x = 50 + (1 if tick % 2 else 0)
    rect(draw, (spear_x, y - 12, spear_x + 2, 89), "leather")
    rect(draw, (spear_x - 2, y - 17, spear_x + 4, y - 10), "steel_hi")

    # shield
    shield_y = y + 34 + bob + (7 if state == "paused" else 0)
    rect(draw, (12, shield_y, 27, shield_y + 26), "red")
    rect(draw, (15, shield_y + 3, 24, shield_y + 23), "bronze")
    rect(draw, (18, shield_y + 10, 23, shield_y + 15), "bronze_hi")

    if state == "break":
        rect(draw, (3, 77, 15, 90), "fire")
        rect(draw, (6, 69 + tick % 2, 13, 83), "fire_hi")
        rect(draw, (1, 90, 17, 93), "leather")
    elif state == "complete":
        rect(draw, (56, 31, 58, 91), "bronze")
        rect(draw, (58, 34, 63, 52), "red_hi")
        if tick % 2:
            rect(draw, (59, 38, 62, 41), "bronze_hi")
    elif state == "focus" and tick == 1:
        rect(draw, (45, 11, 48, 16), "bronze_hi")


def generate_sheets() -> None:
    for state in ("idle", "preparing", "focus", "paused", "break", "complete"):
        sheet = Image.new("RGBA", (256, 96), (0, 0, 0, 0))
        for index in range(4):
            frame = Image.new("RGBA", (64, 96), (0, 0, 0, 0))
            draw_legionary(frame, state, index)
            sheet.alpha_composite(frame, (index * 64, 0))
        sheet.save(PIXEL_DIR / f"legionary-{state}.png")


def shield_image(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    scale = size / 64

    def box(x1: int, y1: int, x2: int, y2: int, color: str) -> None:
        draw.rectangle(tuple(int(value * scale) for value in (x1, y1, x2, y2)), fill=PALETTE[color])

    box(12, 8, 52, 48, "red")
    box(8, 14, 56, 42, "red")
    box(16, 12, 48, 46, "bronze")
    box(20, 16, 44, 42, "red")
    box(29, 14, 35, 46, "bronze_hi")
    box(20, 27, 44, 33, "bronze_hi")
    box(22, 48, 42, 54, "bronze")
    return image


def generate_brand() -> None:
    for size in (32, 64, 128, 256):
        shield_image(size).save(BRAND_DIR / f"vigil-mark-{size}.png")
    shield_image(32).save(ICON_DIR / "32x32.png")
    shield_image(128).save(ICON_DIR / "128x128.png")
    shield_image(256).save(ICON_DIR / "128x128@2x.png")
    icon = shield_image(256)
    icon.save(ICON_DIR / "icon.png")
    icon.save(
        ICON_DIR / "icon.ico",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    try:
        icon.save(ICON_DIR / "icon.icns")
    except Exception:
        icon.save(ICON_DIR / "icon.icns", format="PNG")


def clamp(value: int) -> int:
    return max(0, min(255, value))


def noise_texture(name: str, base: tuple[int, int, int], variance: int, accents: Iterable[tuple[int, int, int]]) -> None:
    rng = random.Random(f"vigil:{name}")
    image = Image.new("RGB", (32, 32), base)
    pixels = image.load()
    for y in range(32):
        for x in range(32):
            drift = rng.randint(-variance, variance)
            pixels[x, y] = tuple(clamp(channel + drift) for channel in base)
    draw = ImageDraw.Draw(image)
    for color in accents:
        for _ in range(7):
            x = rng.randrange(0, 32)
            y = rng.randrange(0, 32)
            length = rng.randrange(2, 9)
            draw.line((x, y, min(31, x + length), y), fill=color)
    image.save(UI_TEXTURE_DIR / f"{name}.png")


def generate_textures() -> None:
    noise_texture("dark-stone-tile", (31, 24, 22), 7, [(45, 34, 29), (20, 15, 14)])
    noise_texture("stone-wall-tile", (67, 55, 47), 10, [(88, 70, 55), (42, 34, 31)])
    noise_texture("stone-floor-tile", (45, 37, 33), 7, [(68, 55, 45), (28, 22, 20)])
    noise_texture("parchment-tile", (232, 210, 170), 7, [(199, 169, 123), (244, 228, 195)])
    noise_texture("red-marble-tile", (91, 19, 19), 12, [(128, 35, 28), (56, 10, 13)])

    hall = Image.new("RGB", (64, 64), (44, 36, 32))
    draw = ImageDraw.Draw(hall)
    for x in (3, 28, 53):
        draw.rectangle((x, 0, x + 7, 63), fill=(68, 57, 49))
        draw.rectangle((x + 2, 0, x + 4, 63), fill=(91, 75, 61))
        draw.rectangle((x - 2, 0, x + 9, 5), fill=(35, 28, 25))
        draw.rectangle((x - 2, 57, x + 9, 63), fill=(31, 25, 23))
    draw.line((0, 47, 63, 47), fill=(28, 22, 20), width=3)
    hall.save(UI_TEXTURE_DIR / "column-hall-tile.png")


def frame_image(name: str, center: tuple[int, int, int], edge: tuple[int, int, int], inner: tuple[int, int, int], size: int = 64, border: int = 14) -> None:
    image = Image.new("RGB", (size, size), center)
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, size - 1, size - 1), fill=edge)
    draw.rectangle((3, 3, size - 4, size - 4), fill=PALETTE["bronze_dark"][:3])
    draw.rectangle((6, 6, size - 7, size - 7), fill=PALETTE["bronze_hi"][:3])
    draw.rectangle((9, 9, size - 10, size - 10), fill=inner)
    draw.rectangle((border, border, size - border - 1, size - border - 1), fill=center)
    for x, y in ((1, 1), (size - 7, 1), (1, size - 7), (size - 7, size - 7)):
        draw.rectangle((x, y, x + 5, y + 5), fill=PALETTE["bronze_hi"][:3])
        draw.rectangle((x + 2, y + 2, x + 3, y + 3), fill=PALETTE["red_dark"][:3])
    image.save(UI_FRAME_DIR / f"{name}.png")


def generate_frames() -> None:
    frame_image("parchment-frame", (235, 216, 177), (61, 39, 27), (166, 119, 61))
    frame_image("stone-frame", (62, 50, 43), (24, 16, 13), (126, 79, 36))
    frame_image("dark-frame", (27, 21, 19), (18, 11, 9), (101, 62, 31))
    frame_image("outer-frame", (41, 28, 23), (48, 22, 12), (201, 132, 47), size=32, border=8)


def generate_preview() -> None:
    canvas = Image.new("RGB", (1200, 560), (21, 15, 13))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((20, 20, 1180, 540), outline=(210, 144, 54), width=4)
    states = ["idle", "preparing", "focus", "paused", "break", "complete"]
    for index, state in enumerate(states):
        x = 52 + (index % 3) * 380
        y = 54 + (index // 3) * 245
        sheet = Image.open(PIXEL_DIR / f"legionary-{state}.png").crop((0, 0, 64, 96)).resize(
            (160, 240), Image.Resampling.NEAREST
        )
        canvas.paste(sheet, (x, y), sheet)
        draw.text((x + 178, y + 105), state.upper(), fill=(242, 229, 201))
    canvas.save(DOC_DIR / "sprite-sheet-preview.png")


def generate_asset_board() -> None:
    canvas = Image.new("RGB", (1280, 720), (22, 16, 14))
    draw = ImageDraw.Draw(canvas)
    draw.text((42, 34), "VIGIL v0.0.2 / GENERATED SCAFFOLD ASSETS", fill=(241, 195, 106))
    texture_names = [
        "dark-stone-tile",
        "stone-wall-tile",
        "stone-floor-tile",
        "parchment-tile",
        "red-marble-tile",
        "column-hall-tile",
    ]
    for index, name in enumerate(texture_names):
        x = 42 + (index % 3) * 240
        y = 96 + (index // 3) * 180
        image = Image.open(UI_TEXTURE_DIR / f"{name}.png").resize((128, 128), Image.Resampling.NEAREST)
        canvas.paste(image, (x, y))
        draw.text((x, y + 138), name, fill=(232, 210, 170))
    frame_names = ["parchment-frame", "stone-frame", "dark-frame", "outer-frame"]
    for index, name in enumerate(frame_names):
        x = 800 + (index % 2) * 210
        y = 96 + (index // 2) * 240
        image = Image.open(UI_FRAME_DIR / f"{name}.png").resize((180, 180), Image.Resampling.NEAREST)
        canvas.paste(image, (x, y))
        draw.text((x, y + 190), name, fill=(232, 210, 170))
    canvas.save(DOC_DIR / "ui-asset-board.png")


if __name__ == "__main__":
    generate_sheets()
    generate_brand()
    generate_textures()
    generate_frames()
    generate_preview()
    generate_asset_board()
