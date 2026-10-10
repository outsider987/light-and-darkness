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
fs.mkdirSync('public/music', { recursive: true });
for (const f of fs.existsSync('assets-src/music') ? fs.readdirSync('assets-src/music') : []) {
  if (!f.endsWith('.mp3')) continue;
  fs.copyFileSync(path.join('assets-src/music', f), path.join('public/music', f));
  console.log('music', f);
}
