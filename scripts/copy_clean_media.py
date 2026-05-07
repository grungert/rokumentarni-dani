#!/usr/bin/env python3
"""
Copy WordPress wp-content/uploads/ to a clean media folder.

Allowlist-based: only files with safe media extensions are copied. Anything
else (PHP backdoors, .htaccess overrides, hidden CSS files used as PHP loaders,
zip backups, etc.) is skipped and logged. Directory structure is preserved
so existing post URLs like /wp-content/uploads/2018/06/photo.jpg map cleanly.

Usage:
    copy_clean_media.py <source-uploads> <dest-media> [--dry-run] [--report report.txt]

Examples:
    # See what would be copied/skipped:
    copy_clean_media.py ./old/wp-content/uploads ./extracted/media --dry-run

    # Actually copy:
    copy_clean_media.py ./old/wp-content/uploads ./extracted/media
"""

from __future__ import annotations

import argparse
import datetime as dt
import shutil
import sys
from pathlib import Path

# Extensions safe to copy. Lowercase, no leading dot.
ALLOWED_EXTS = {
    # Images
    "jpg", "jpeg", "png", "gif", "webp", "avif", "svg", "ico", "bmp", "tif", "tiff",
    # Video
    "mp4", "mov", "webm", "m4v", "ogv",
    # Audio
    "mp3", "wav", "ogg", "m4a", "flac",
    # Documents
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "rtf", "txt", "csv",
    # Subtitles / fonts (sometimes uploaded)
    "vtt", "srt", "woff", "woff2", "ttf", "otf", "eot",
    # Misc legitimate WP uploads metadata
    "json",
}

# Always block these, even if extension would otherwise pass. Belt-and-braces
# against, e.g., shell.php.jpg-style polyglot uploads (handled separately
# below) and against extensions that are valid media but commonly weaponized
# on shared hosts.
BLOCKED_NAMES = {".htaccess", ".htpasswd", "wp-config.php"}


def is_safe_filename(name: str) -> tuple[bool, str]:
    """Return (allowed, reason). reason describes why blocked."""
    lower = name.lower()
    if lower in BLOCKED_NAMES:
        return False, "blocked_filename"
    # Multi-extension files like shell.php.jpg — block if any part is a script ext.
    parts = lower.split(".")
    if len(parts) > 2:
        for ext in parts[1:-1]:
            if ext in {"php", "phtml", "php3", "php4", "php5", "php7", "phar", "pl", "py", "sh", "asp", "aspx", "jsp", "cgi"}:
                return False, "double_extension_script"
    if "." not in name:
        return False, "no_extension"
    ext = parts[-1]
    if ext not in ALLOWED_EXTS:
        return False, f"ext_not_allowed:{ext}"
    return True, ""


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Copy WP uploads, media files only.")
    ap.add_argument("source", type=Path, help="wp-content/uploads/ source dir")
    ap.add_argument("dest", type=Path, help="Destination media dir")
    ap.add_argument("--dry-run", action="store_true",
                    help="Don't copy; just report.")
    ap.add_argument("--report", type=Path, default=None,
                    help="Write report file (also printed).")
    args = ap.parse_args(argv)

    src: Path = args.source.resolve()
    dst: Path = args.dest.resolve()
    if not src.is_dir():
        print(f"Source not a directory: {src}", file=sys.stderr)
        return 2

    copied: list[str] = []
    skipped: list[tuple[str, str]] = []
    bytes_copied = 0

    for p in src.rglob("*"):
        if not p.is_file():
            continue
        rel = p.relative_to(src)
        ok, reason = is_safe_filename(p.name)
        if not ok:
            skipped.append((str(rel), reason))
            continue
        target = dst / rel
        if not args.dry_run:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, target)
        copied.append(str(rel))
        try:
            bytes_copied += p.stat().st_size
        except OSError:
            pass

    # Build report
    lines = []
    ts = dt.datetime.now().isoformat(timespec="seconds")
    mode = "DRY-RUN" if args.dry_run else "COPY"
    lines.append(f"Media copy report  ({mode})")
    lines.append(f"Source: {src}")
    lines.append(f"Dest:   {dst}")
    lines.append(f"When:   {ts}")
    lines.append(f"Copied: {len(copied)} files  ({bytes_copied:,} bytes)")
    lines.append(f"Skipped:{len(skipped)} files")
    lines.append("")

    if skipped:
        # Group by reason for a useful summary.
        by_reason: dict[str, list[str]] = {}
        for path, reason in skipped:
            by_reason.setdefault(reason, []).append(path)
        lines.append("== Skipped by reason ==")
        for reason in sorted(by_reason):
            lines.append(f"  {reason}: {len(by_reason[reason])}")
        lines.append("")
        lines.append("== Skipped files ==")
        for path, reason in sorted(skipped):
            lines.append(f"  [{reason}]  {path}")

    report = "\n".join(lines) + "\n"
    print(report)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(report)
        print(f"Report written to {args.report}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
