"""Build deterministic metadata for repository raster assets."""

from __future__ import annotations

import hashlib
import json
from datetime import date
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "assets" / "asset-manifest.json"


def status_for(relative_path: str) -> str:
    if relative_path == "docs/assets/legio-focus-ui-reference.png":
        return "reference-only"
    if relative_path.startswith("docs/assets/"):
        return "documentation-preview"
    return "scaffold-only"


def raster_paths() -> list[Path]:
    paths = list((ROOT / "public" / "assets").rglob("*.png"))
    paths.extend((ROOT / "docs" / "assets").glob("*.png"))
    return sorted(path for path in paths if path.is_file())


def record(path: Path) -> dict[str, object]:
    relative_path = path.relative_to(ROOT).as_posix()
    with Image.open(path) as image:
        dimensions = [image.width, image.height]
    return {
        "path": relative_path,
        "dimensions": dimensions,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "status": status_for(relative_path),
    }


def main() -> None:
    payload = {
        "generated": date.today().isoformat(),
        "version": "0.0.2",
        "assets": [record(path) for path in raster_paths()],
    }
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {len(payload['assets'])} records.")


if __name__ == "__main__":
    main()
