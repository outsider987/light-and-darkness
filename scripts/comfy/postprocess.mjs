// Converts generated assets into the sizes the game uses and copies them into public/.
//   backgrounds: assets-src/bg/bg-<id>_*.png -> public/bg/<id>.png (320x140, area-filtered)
//   title art:   assets-src/bg/title-art_*.png -> public/bg/title.png (320x240)
//   music:       assets-src/music/<id>.mp3 -> public/music/<id>.mp3
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const py = `
import sys, glob, os
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
for f in sorted(glob.glob(os.path.join(src, 'bg-*_*.png'))):
    id = os.path.basename(f).split('_')[0][3:]
    im = Image.open(f).convert('RGB')
    # keep the full width; crop a little from the top so the ground band lands around y=120/140
    w, h = im.size
    target = (320, 140)
    crop_h = int(w * target[1] / target[0])
    top = max(0, min(h - crop_h, int((h - crop_h) * 0.55)))
    im = im.crop((0, top, w, top + crop_h)).resize(target, Image.BOX)
    im.save(os.path.join(dst, id + '.png'), optimize=True)
    print('bg', id)
for name, prefix in [('title', 'title-art_*.png'), ('ending', 'ending-art_*.png')]:
    for f in sorted(glob.glob(os.path.join(src, prefix))):
        im = Image.open(f).convert('RGB').resize((320, 240), Image.BOX)
        im.save(os.path.join(dst, name + '.png'), optimize=True)
        print(name)
`;
execFileSync('python3', ['-c', py, 'assets-src/bg', 'public/bg'], { stdio: 'inherit' });

// Battle sprites: key out the flat magenta background, trim, scale to 104px tall.
const pySprites = `
import sys, glob, os
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
H = 104
for f in sorted(glob.glob(os.path.join(src, '*.png'))):
    name = os.path.basename(f)
    if name.endswith('.ref.png') or name.startswith('exp-'): continue
    im = Image.open(f).convert('RGBA')
    px = im.load()
    w, h = im.size
    # magenta key with tolerance; also soften edge pixels that blend toward magenta
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            d = abs(r - 255) + g + abs(b - 255)
            if d < 90: px[x, y] = (0, 0, 0, 0)
            elif d < 170 and g < 90:
                # edge blend: keep color, reduce alpha
                px[x, y] = (r, g, b, int(255 * min(1.0, (d - 90) / 80)))
    bbox = im.getbbox()
    if not bbox: continue
    im = im.crop(bbox)
    # remove stray magenta fringe by desaturating leftover magenta-ish pixels
    px = im.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if a and r > 180 and b > 180 and g < 110:
                px[x, y] = (int((r + g) / 2), g, int((b + g) / 2), a)
    scale = H / im.size[1]
    nw = max(8, int(im.size[0] * scale))
    im = im.resize((nw, H), Image.LANCZOS)
    im.save(os.path.join(dst, name), optimize=True)
    print('sprite', name[:-4], nw)
`;
if (fs.existsSync('assets-src/sprites')) execFileSync('python3', ['-c', pySprites, 'assets-src/sprites', 'public/sprites'], { stdio: 'inherit' });
fs.mkdirSync('public/sfx', { recursive: true });
for (const f of fs.existsSync('assets-src/sfx') ? fs.readdirSync('assets-src/sfx') : []) {
  if (!f.endsWith('.mp3')) continue;
  const src = path.join('assets-src/sfx', f), dst = path.join('public/sfx', f);
  try {
    // trim trailing/leading silence so effects feel snappy
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse', '-b:a', '96k', dst]);
  } catch {
    fs.copyFileSync(src, dst);
  }
  console.log('sfx', f);
}
fs.mkdirSync('public/music', { recursive: true });
for (const f of fs.existsSync('assets-src/music') ? fs.readdirSync('assets-src/music') : []) {
  if (!f.endsWith('.mp3')) continue;
  fs.copyFileSync(path.join('assets-src/music', f), path.join('public/music', f));
  console.log('music', f);
}
