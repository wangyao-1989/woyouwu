#!/usr/bin/env python3
"""
Remove image background using rembg (u2netp lightweight model, ~4.7MB).
Usage: python3 rembg_convert.py <input_image> <output.png>
"""
import sys
import os
from rembg import remove, new_session
from PIL import Image

# Pre-load u2netp session (lightweight model)
_session = None

def get_session():
    global _session
    if _session is None:
        _session = new_session('u2netp')
    return _session

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python3 rembg_convert.py <input_image> <output.png>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.exists(input_path):
        print(f"ERROR: input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    try:
        print(f"Removing background from: {input_path}")
        input_img = Image.open(input_path).convert("RGBA")
        output_img = remove(input_img, session=get_session())
        output_img.save(output_path, "PNG")
        print(f"OK: {output_path}")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
