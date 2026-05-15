from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALLOWLIST_SUFFIXES = {".env.example"}
SECRET_PATTERNS = [
    re.compile(r"AIza[0-9A-Za-z_-]{20,}"),
    re.compile(r"sk-[0-9A-Za-z_-]{20,}"),
    re.compile(r"xox[baprs]-[0-9A-Za-z-]{20,}"),
]


def tracked_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return [ROOT / line.strip() for line in result.stdout.splitlines() if line.strip()]


def should_skip(path: Path) -> bool:
    if path.name in ALLOWLIST_SUFFIXES:
        return True
    if any(part in {"node_modules", ".venv", "bin", "obj"} for part in path.parts):
        return True
    return path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".pdf", ".onnx"}


def main() -> int:
    findings: list[str] = []
    for path in tracked_files():
        if should_skip(path) or not path.exists():
            continue

        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue

        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                findings.append(str(path.relative_to(ROOT)))
                break

    if findings:
        print("Potential secrets found in tracked files:")
        for finding in findings:
            print(f"- {finding}")
        return 1

    print("No obvious secrets found in tracked files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
