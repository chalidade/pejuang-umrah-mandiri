"""Pasang logo Fajar ke semua aset aplikasi Pejuang Umrah."""
import os, subprocess, glob, io
from PIL import Image
import sys; sys.path.insert(0, __import__('os').path.dirname(__file__))
from kabah import fajar, STYLE, F_BBOX, BLUE, WHITE, NAVY, tile
REPO = __import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__), '../..'))
DARK = dict(STYLE['biru'], faces=(BLUE, '#123088', '#CFE0FF'), bg=NAVY)

def mark(style, k=1.0, cx=256, cy=256, uid='f'):
    """logo Fajar diskala k terhadap pusat (pusat bbox logo = 256,256)."""
    return f'<g transform="translate({cx} {cy}) scale({k}) translate(-256 -256)">{fajar(style, uid)}</g>'

def svg(body, w=512, h=512, vb=None):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{vb or f"0 0 {w} {h}"}">{body}</svg>'

def png(svgtext, size, out, rgb=False):
    w, h = size if isinstance(size, tuple) else (size, size)
    data = subprocess.run(['rsvg-convert', '-w', str(w), '-h', str(h)], input=svgtext.encode(), capture_output=True, check=True).stdout
    im = Image.open(io.BytesIO(data)).convert('RGBA')
    if rgb:
        bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[3]); im = bg
    os.makedirs(os.path.dirname(out), exist_ok=True); im.save(out, optimize=True)

x0, y0, x1, y1 = F_BBOX
SYM_VB = f'{x0-4:.2f} {y0-4:.2f} {x1-x0+8:.2f} {y1-y0+8:.2f}'
rounded = svg(tile(BLUE) + mark(STYLE['biru']))                       # ikon dengan sudut membulat
square = svg(f'<rect width="512" height="512" fill="{BLUE}"/>' + mark(STYLE['biru']))   # penuh, OS yang membulatkan
maskable = svg(f'<rect width="512" height="512" fill="{BLUE}"/>' + mark(STYLE['biru'], .80))
fg_android = svg(mark(STYLE['biru'], .74))                            # lapisan depan adaptive icon, latar diisi warna
round_legacy = svg(f'<circle cx="256" cy="256" r="256" fill="{BLUE}"/>' + mark(STYLE['biru'], .86))

# sumber vektor
os.makedirs(f'{REPO}/resources/logo', exist_ok=True)
files = {
    'public/favicon-v2.svg': rounded,
    'resources/logo/ikon.svg': rounded,
    'resources/logo/simbol.svg': svg(fajar(STYLE['putih'], 's1'), x1-x0+8, y1-y0+8, SYM_VB),
    'resources/logo/simbol-di-biru.svg': svg(fajar(STYLE['biru'], 's2'), x1-x0+8, y1-y0+8, SYM_VB),
    'public/logo/simbol.svg': svg(fajar(STYLE['putih'], 's3'), x1-x0+8, y1-y0+8, SYM_VB),
    'public/logo/simbol-di-biru.svg': svg(fajar(STYLE['biru'], 's4'), x1-x0+8, y1-y0+8, SYM_VB),
}
for p, t in files.items():
    os.makedirs(os.path.dirname(f'{REPO}/{p}'), exist_ok=True); open(f'{REPO}/{p}', 'w').write(t)

# web / PWA
png(rounded, 192, f'{REPO}/public/icons/icon-192-v2.png')
png(rounded, 512, f'{REPO}/public/icons/icon-512-v2.png')
png(maskable, 512, f'{REPO}/public/icons/icon-512-maskable-v2.png', rgb=True)
png(square, 180, f'{REPO}/public/icons/apple-touch-icon-v2.png', rgb=True)
png(square, 1024, f'{REPO}/resources/icon-only.png', rgb=True)

# iOS
png(square, 1024, f'{REPO}/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', rgb=True)

# Android launcher
dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for d, m in dens.items():
    base = f'{REPO}/android/app/src/main/res/mipmap-{d}'
    png(rounded, int(48*m), f'{base}/ic_launcher.png')
    png(round_legacy, int(48*m), f'{base}/ic_launcher_round.png')
    png(fg_android, int(108*m), f'{base}/ic_launcher_foreground.png')
bgxml = f'{REPO}/android/app/src/main/res/values/ic_launcher_background.xml'
xml = open(bgxml).read()
open(bgxml, 'w').write(xml.replace('#FFFFFF', BLUE))

# Splash: logo di tengah, putih (terang) dan navy (gelap)
def splash(w, h, dark):
    st = DARK if dark else STYLE['putih']; bg = NAVY if dark else WHITE
    k = min(w, h) * .36 / (x1 - x0)                      # lebar logo = 30% sisi terpendek
    body = f'<rect width="{w}" height="{h}" fill="{bg}"/><g transform="translate({w/2} {h/2}) scale({k}) translate(-256 -256)">{fajar(st, "sp")}</g>'
    return svg(body, w, h)
for f in glob.glob(f'{REPO}/android/app/src/main/res/drawable*/splash.png'):
    w, h = Image.open(f).size
    png(splash(w, h, '-night' in f), (w, h), f, rgb=True)
for f in glob.glob(f'{REPO}/ios/App/App/Assets.xcassets/Splash.imageset/*.png'):
    w, h = Image.open(f).size
    png(splash(w, h, 'dark' in f), (w, h), f, rgb=True)
png(splash(2732, 2732, False), 2732, f'{REPO}/resources/splash.png', rgb=True)
png(splash(2732, 2732, True), 2732, f'{REPO}/resources/splash-dark.png', rgb=True)
print('ok')
