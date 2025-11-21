#!/usr/bin/env python3
"""
Create PNG icons for VS Code file icon theme.
"""

import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Error: PIL (Pillow) is required. Install it with: pip install Pillow")
    sys.exit(1)

def create_pain_icon(output_path: Path, size: int = 32):
    """Create Pain file icon as PNG."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle with gradient (simplified - solid color)
    # Blue gradient: #4A90E2 to #357ABD
    color = (74, 144, 226)  # #4A90E2
    corner_radius = 5
    
    # Draw rounded rectangle
    draw.rounded_rectangle(
        [(0, 0), (size-1, size-1)],
        radius=corner_radius,
        fill=color
    )
    
    # Draw letter P
    try:
        # Try to use a nice font
        font_size = int(size * 0.625)  # ~20px for 32px icon
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    text = "P"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((size - text_width) // 2, (size - text_height) // 2 - 2)
    
    draw.text(position, text, fill=(255, 255, 255, 255), font=font)
    
    img.save(output_path, 'PNG')
    print(f"Created: {output_path}")

def create_pml_icon(output_path: Path, size: int = 32):
    """Create PML file icon as PNG."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Green gradient: #50C878 to #3FA568
    color = (80, 200, 120)  # #50C878
    corner_radius = 5
    
    # Draw rounded rectangle
    draw.rounded_rectangle(
        [(0, 0), (size-1, size-1)],
        radius=corner_radius,
        fill=color
    )
    
    # Draw text "PML"
    try:
        font_size = int(size * 0.375)  # ~12px for 32px icon
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "PML"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((size - text_width) // 2, (size - text_height) // 2 - 1)
    
    draw.text(position, text, fill=(255, 255, 255, 255), font=font)
    
    img.save(output_path, 'PNG')
    print(f"Created: {output_path}")

def main():
    script_dir = Path(__file__).resolve().parent
    
    # Create PNG versions
    create_pain_icon(script_dir / "pain-file.png", size=32)
    create_pml_icon(script_dir / "pml-file.png", size=32)
    
    print("\n[OK] PNG icons created!")

if __name__ == "__main__":
    main()

