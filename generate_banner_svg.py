import math
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

def generate_svg():
    # 1. Process adam-normal.png
    adam = Image.open('public/adam-normal.png')
    cols = 160
    img_aspect = adam.height / adam.width
    rows = int(cols * img_aspect) # 106
    resized = adam.resize((cols, rows), Image.Resampling.BILINEAR)
    rgba = resized.convert('RGBA')
    
    ramp = " .:-=+*#%@"
    
    # Matching screenshot dimensions (1024 x 412)
    canvas_w = 1024
    canvas_h = 412
    hands_w = 1024
    hands_h = hands_w * (1024 / 1536) # 682.66
    y_offset = -192.0 # Aligns row 50 (fingertips) to y=130 and knuckles to y=49
    
    # Gap shift between hands:
    left_gap = 0.0346
    right_gap = 0.0270
    x_offset = 6.0
    
    cells = []
    for r in range(rows):
        for c in range(cols):
            r_v, g_v, b_v, a_v = rgba.getpixel((c, r))
            if a_v < 40:
                continue
            lum = 0.299 * r_v + 0.587 * g_v + 0.114 * b_v
            char_idx = int((lum / 255) * (len(ramp) - 1))
            ch = ramp[char_idx]
            if ch == ' ':
                continue
            
            is_left = c < cols / 2
            hand_shift = -left_gap if is_left else right_gap
            
            # Position
            cx = (c / cols + hand_shift) * hands_w + x_offset
            cy = y_offset + (r / rows) * hands_h
            
            hex_color = f"#{r_v:02x}{g_v:02x}{b_v:02x}"
            
            cells.append({
                'char': ch,
                'cx': round(cx, 1),
                'cy': round(cy, 1),
                'col': c,
                'row': r,
                'is_left': is_left,
                'color': hex_color,
            })
            
    print(f"Total ASCII cells: {len(cells)}")
    
    # 2. Extract font glyphs for "Ronit  Mahajan"
    font = TTFont('public/fonts/Absans-Regular.otf')
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    
    # Exact bounding boxes measured from user's screenshot:
    target_letter_boxes = [
        ('R', 40, 111, 280, 379),
        ('o', 129, 196, 308, 380),
        ('n', 211, 265, 307, 379),
        ('i', 281, 294, 279, 379),
        ('t', 307, 352, 284, 381),
        ('M', 482, 565, 280, 379),
        ('a', 583, 640, 307, 381),
        ('h', 658, 712, 265, 379),
        ('a', 727, 784, 307, 381),
        ('j', 799, 814, 279, 406),
        ('a', 828, 885, 307, 381),
        ('n', 903, 957, 307, 379),
    ]
    
    letter_paths = []
    for char, x0, x1, y0, y1 in target_letter_boxes:
        glyph_name = cmap[ord(char)]
        pen = SVGPathPen(glyph_set)
        bp = BoundsPen(glyph_set)
        glyph_set[glyph_name].draw(bp)
        fx0, fy0, fx1, fy1 = bp.bounds
        
        sx = (x1 - x0) / (fx1 - fx0)
        sy = (y1 - y0) / (fy1 - fy0)
        tx = x0 - fx0 * sx
        ty = y1 + fy0 * sy
        
        tpen = TransformPen(pen, (sx, 0, 0, -sy, tx, ty))
        glyph_set[glyph_name].draw(tpen)
        d = pen.getCommands()
        letter_paths.append((char, d))
        
    print(f"Generated {len(letter_paths)} letter paths with exact bounding box fitting")
    
    # 3. Build the SVG Content
    svg_lines = []
    svg_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    svg_lines.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 412" width="100%" height="100%" style="background:#0a0a0a;">')
    
    # DEFS
    svg_lines.append('  <defs>')
    
    # High-performance bloom filter for the electric red glow
    svg_lines.append('    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">')
    svg_lines.append('      <feGaussianBlur stdDeviation="3.2" result="blur1" />')
    svg_lines.append('      <feGaussianBlur stdDeviation="7.5" result="blur2" />')
    svg_lines.append('      <feMerge>')
    svg_lines.append('        <feMergeNode in="blur2" />')
    svg_lines.append('        <feMergeNode in="blur1" />')
    svg_lines.append('        <feMergeNode in="SourceGraphic" />')
    svg_lines.append('      </feMerge>')
    svg_lines.append('    </filter>')
    
    # Exact Wave Gradients matching CanvasHands 0.94 exponential decay
    # Wave width = 520px
    # Left-to-Right wave gradient (sharp leading wavefront on right, long 0.94 exponential decay tail on left)
    svg_lines.append('    <linearGradient id="waveLTR" x1="0%" y1="0%" x2="100%" y2="0%">')
    svg_lines.append('      <stop offset="0%" stop-color="#000000" stop-opacity="0" />')
    svg_lines.append('      <stop offset="25%" stop-color="#ffffff" stop-opacity="0.06" />')
    svg_lines.append('      <stop offset="48%" stop-color="#ffffff" stop-opacity="0.18" />')
    svg_lines.append('      <stop offset="68%" stop-color="#ffffff" stop-opacity="0.42" />')
    svg_lines.append('      <stop offset="84%" stop-color="#ffffff" stop-opacity="0.75" />')
    svg_lines.append('      <stop offset="94%" stop-color="#ffffff" stop-opacity="0.95" />')
    svg_lines.append('      <stop offset="97%" stop-color="#ffffff" stop-opacity="1.0" />')
    svg_lines.append('      <stop offset="99%" stop-color="#ffffff" stop-opacity="0.85" />')
    svg_lines.append('      <stop offset="100%" stop-color="#000000" stop-opacity="0" />')
    svg_lines.append('    </linearGradient>')
    
    # Right-to-Left wave gradient (sharp leading wavefront on left, long 0.94 exponential decay tail on right)
    svg_lines.append('    <linearGradient id="waveRTL" x1="0%" y1="0%" x2="100%" y2="0%">')
    svg_lines.append('      <stop offset="0%" stop-color="#000000" stop-opacity="0" />')
    svg_lines.append('      <stop offset="1%" stop-color="#ffffff" stop-opacity="0.85" />')
    svg_lines.append('      <stop offset="3%" stop-color="#ffffff" stop-opacity="1.0" />')
    svg_lines.append('      <stop offset="6%" stop-color="#ffffff" stop-opacity="0.95" />')
    svg_lines.append('      <stop offset="16%" stop-color="#ffffff" stop-opacity="0.75" />')
    svg_lines.append('      <stop offset="32%" stop-color="#ffffff" stop-opacity="0.42" />')
    svg_lines.append('      <stop offset="52%" stop-color="#ffffff" stop-opacity="0.18" />')
    svg_lines.append('      <stop offset="75%" stop-color="#ffffff" stop-opacity="0.06" />')
    svg_lines.append('      <stop offset="100%" stop-color="#000000" stop-opacity="0" />')
    svg_lines.append('    </linearGradient>')

    # CSS Animations (5.2s total cycle, exactly mirroring the sweep duration)
    svg_lines.append('    <style>')
    svg_lines.append("""
      /* Typography styling */
      .title-letter {
        fill: #ffffff;
      }
      .period-dot {
        fill: #FF2C2C;
        animation: periodPulse 5.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        transform-origin: 982.5px 372px;
      }
      @keyframes periodPulse {
        0%, 100% { filter: drop-shadow(0 0 3px rgba(255,44,44,0.5)); opacity: 0.95; transform: scale(1); }
        18% { filter: drop-shadow(0 0 10px rgba(255,44,44,0.95)) drop-shadow(0 0 22px rgba(255,44,44,0.7)); opacity: 1; transform: scale(1.12); }
        35% { filter: drop-shadow(0 0 3px rgba(255,44,44,0.5)); opacity: 0.95; transform: scale(1); }
        56% { filter: drop-shadow(0 0 8px rgba(255,44,44,0.85)) drop-shadow(0 0 18px rgba(255,44,44,0.5)); opacity: 1; transform: scale(1.08); }
        74% { filter: drop-shadow(0 0 3px rgba(255,44,44,0.5)); opacity: 0.95; transform: scale(1); }
      }

      /* Base monospace rendering */
      .ascii-base {
        font-family: Consolas, 'Courier New', monospace;
        font-size: 10.8px;
        font-weight: 700;
        text-anchor: middle;
        dominant-baseline: central;
        opacity: 0.82;
      }

      .ascii-highlight {
        font-family: Consolas, 'Courier New', monospace;
        font-size: 10.8px;
        font-weight: 700;
        text-anchor: middle;
        dominant-baseline: central;
        fill: #FF2C2C;
      }

      /* Primary Left-to-Right wave sweep (0.0s -> 1.8s) */
      .sweep-ltr {
        animation: sweepMoveLTR 5.2s linear infinite;
      }
      @keyframes sweepMoveLTR {
        0% { transform: translateX(-560px); opacity: 0; }
        1% { opacity: 1; }
        35% { transform: translateX(1120px); opacity: 1; }
        36% { transform: translateX(1120px); opacity: 0; }
        100% { transform: translateX(-560px); opacity: 0; }
      }

      /* Returning Echo Right-to-Left wave sweep (1.9s -> 3.7s) */
      .sweep-rtl {
        animation: sweepMoveRTL 5.2s linear infinite;
      }
      @keyframes sweepMoveRTL {
        0%, 36% { transform: translateX(1120px); opacity: 0; }
        37% { opacity: 1; }
        71% { transform: translateX(-560px); opacity: 1; }
        72% { transform: translateX(-560px); opacity: 0; }
        100% { transform: translateX(1120px); opacity: 0; }
      }
    """)
    svg_lines.append('    </style>')
    
    # RIPPLE MASK
    svg_lines.append('    <mask id="rippleMask">')
    # Background in mask is pitch black (highlight hidden)
    svg_lines.append('      <rect width="1024" height="412" fill="#000000" />')
    
    # Animated Sweep Wave Left to Right (with 5 organic ripple lobes riding the wavefront)
    svg_lines.append('      <g class="sweep-ltr">')
    svg_lines.append('        <rect x="0" y="0" width="520" height="412" fill="url(#waveLTR)" />')
    # The 5 ripple lobes along the leading edge (x ~ 505) at the exact heights of the 5 CanvasHands ripple seeds
    svg_lines.append('        <ellipse cx="505" cy="54" rx="35" ry="28" fill="#ffffff" opacity="0.65" />')
    svg_lines.append('        <ellipse cx="512" cy="133" rx="42" ry="32" fill="#ffffff" opacity="0.85" />')
    svg_lines.append('        <ellipse cx="508" cy="225" rx="38" ry="30" fill="#ffffff" opacity="0.75" />')
    svg_lines.append('        <ellipse cx="502" cy="315" rx="32" ry="26" fill="#ffffff" opacity="0.60" />')
    svg_lines.append('      </g>')
    
    # Animated Sweep Wave Right to Left (with 5 organic ripple lobes riding the return wavefront)
    svg_lines.append('      <g class="sweep-rtl">')
    svg_lines.append('        <rect x="0" y="0" width="520" height="412" fill="url(#waveRTL)" />')
    # The 5 return ripple lobes along the leading edge (x ~ 15)
    svg_lines.append('        <ellipse cx="15" cy="54" rx="35" ry="28" fill="#ffffff" opacity="0.65" />')
    svg_lines.append('        <ellipse cx="8" cy="133" rx="42" ry="32" fill="#ffffff" opacity="0.85" />')
    svg_lines.append('        <ellipse cx="12" cy="225" rx="38" ry="30" fill="#ffffff" opacity="0.75" />')
    svg_lines.append('        <ellipse cx="18" cy="315" rx="32" ry="26" fill="#ffffff" opacity="0.60" />')
    svg_lines.append('      </g>')
    
    svg_lines.append('    </mask>')
    svg_lines.append('  </defs>')
    
    # BACKGROUND
    svg_lines.append('  <!-- Deep Black Canvas Background with Rounded Corners -->')
    svg_lines.append('  <rect width="1024" height="412" rx="10" fill="#0a0a0a" />')
    
    # LAYER 1: Base Hands (Warm Copper/Skin Tones)
    svg_lines.append('  <!-- Layer 1: Base ASCII Hands (Warm Copper Palette) -->')
    svg_lines.append('  <g class="ascii-base" id="base-hands">')
    for c in cells:
        escaped_ch = c['char'].replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        svg_lines.append(f'    <text x="{c["cx"]}" y="{c["cy"]}" fill="{c["color"]}">{escaped_ch}</text>')
    svg_lines.append('  </g>')
    
    # LAYER 2: Radiant Bloom Glow Layer (Masked Red)
    svg_lines.append('  <!-- Layer 2: Ethereal Neon Red Glow (Masked by Ripple Wave) -->')
    svg_lines.append('  <g class="ascii-highlight" id="glow-hands" mask="url(#rippleMask)" filter="url(#neonGlow)" opacity="0.80">')
    for c in cells:
        escaped_ch = c['char'].replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        svg_lines.append(f'    <text x="{c["cx"]}" y="{c["cy"]}">{escaped_ch}</text>')
    svg_lines.append('  </g>')
    
    # LAYER 3: Sharp Red Highlight Characters (Masked)
    svg_lines.append('  <!-- Layer 3: Vibrant Red Highlight Characters (Masked by Ripple Wave) -->')
    svg_lines.append('  <g class="ascii-highlight" id="highlight-hands" mask="url(#rippleMask)" opacity="0.95">')
    for c in cells:
        escaped_ch = c['char'].replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        svg_lines.append(f'    <text x="{c["cx"]}" y="{c["cy"]}">{escaped_ch}</text>')
    svg_lines.append('  </g>')
    
    # LAYER 4: Authentic Absans Vector Typography
    svg_lines.append('  <!-- Layer 4: Authentic Absans Vector Typography (Ronit Mahajan.) -->')
    svg_lines.append('  <g id="brand-title">')
    for char, d in letter_paths:
        svg_lines.append(f'    <path class="title-letter" d="{d}" />')
    # Square period dot matching portfolio signature red
    svg_lines.append('    <!-- Signature Portfolio Square Period Dot with Heartbeat Aura -->')
    svg_lines.append('    <rect class="period-dot" x="976" y="365" width="13.5" height="13.5" rx="0.5" />')
    svg_lines.append('  </g>')
    
    svg_lines.append('</svg>')
    
    svg_content = '\n'.join(svg_lines)
    
    # Write to portfolio/public/header.svg
    with open('public/header.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)
        
    print(f"Written public/header.svg (size: {len(svg_content)/1024:.1f} KB)")
    
    # Also write to d:/projects/Ronitdoes/header.svg
    try:
        with open('d:/projects/Ronitdoes/header.svg', 'w', encoding='utf-8') as f:
            f.write(svg_content)
        print("Updated d:/projects/Ronitdoes/header.svg")
    except Exception as e:
        print(f"Could not update d:/projects/Ronitdoes/header.svg: {e}")

if __name__ == '__main__':
    generate_svg()
