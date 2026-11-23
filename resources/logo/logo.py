"""Pejuang Umrah — tiga alternatif logo, semua ukuran diambil dari satu deret emas.
r[n] = 256 / φ^(6-n)  →  r0 14.27 · r1 23.08 · r2 37.35 · r3 60.43 · r4 97.78 · r5 158.22 · r6 256 (setengah sisi ikon)
"""
import math
PHI=(1+5**.5)/2
BLUE='#1857F0'; SUN='#FFB423'; NAVY='#0B1F4B'; WHITE='#FFFFFF'; PINK='#E5348B'; GHOST='#D5E1FB'; GSUN='#FFE2A6'
r=[256/PHI**(6-n) for n in range(7)]
FONT='Wix Madefor Text Variable,sans-serif'
def svg(body, vb='0 0 512 512'): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{body}</svg>\n'
def tile(bg): return f'<rect width="512" height="512" rx="{r[4]+r[1]:.2f}" fill="{bg}"/>'
def circ(cx,cy,rad,**kw):
    a=' '.join(f'{k.replace("_","-")}="{v}"' for k,v in kw.items()); return f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{rad:.2f}" {a}/>'

# ── alat bantu diagram konstruksi ──
def gc(cx,cy,rad,label=None,ang=-35,dash=False,lpos=.5,dx=0,dy=-6):
    s=circ(cx,cy,rad,fill='none',stroke=PINK,stroke_width=1.4,**({'stroke_dasharray':'5 4'} if dash else {}))
    if label is not None:
        x=cx+rad*math.cos(math.radians(ang)); y=cy+rad*math.sin(math.radians(ang))
        s+=f'<line x1="{cx:.1f}" y1="{cy:.1f}" x2="{x:.1f}" y2="{y:.1f}" stroke="{PINK}" stroke-width="1.2"/>'+circ(cx,cy,3,fill=PINK)+circ(x,y,2.2,fill=PINK)
        s+=txt(cx+(x-cx)*lpos+dx,cy+(y-cy)*lpos+dy,label)
    return s
def txt(x,y,s,size=17,anchor='middle',fill=PINK):
    return (f'<text x="{x:.1f}" y="{y:.1f}" fill="{fill}" font-size="{size}" font-weight="700" text-anchor="{anchor}" font-family="{FONT}" '
            f'paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">{s}</text>')
def gl(x1,y1,x2,y2,dash=True,w=1.1): return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{PINK}" stroke-width="{w}" {"stroke-dasharray=\'4 4\'" if dash else ""}/>'
def grect(x,y,w,h): return f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="none" stroke="{PINK}" stroke-width="1.1" stroke-dasharray="4 4"/>'
def dim(x1,y1,x2,y2,label,off=14):
    """garis ukur dengan tanda ujung"""
    dx,dy=x2-x1,y2-y1; L=math.hypot(dx,dy); nx,ny=-dy/L,dx/L; t=5
    s=gl(x1,y1,x2,y2,dash=False,w=1.3)
    for (x,y) in ((x1,y1),(x2,y2)): s+=gl(x-nx*t,y-ny*t,x+nx*t,y+ny*t,dash=False,w=1.3)
    return s+txt((x1+x2)/2+nx*off,(y1+y2)/2+ny*off+6,label)

# ═════════ A · P SABIT — huruf P, mangkuknya bulan sabit yang memangku matahari ═════════
PR=r[4]                    # mangkuk P  (φ²)
PB=r[3]                    # lingkaran pemotong sabit (φ) — juga lebar batang
PS=r[2]                    # matahari (1)
PH=2*r[5]                  # tinggi huruf → kotak pembatas 2·r4 × 2·r5 = persegi panjang emas
PCX=256.0; PCY=256-r[5]+PR
PU=(math.cos(math.radians(-45)),math.sin(math.radians(-45)))
PBX,PBY=PCX+PB*PU[0],PCY+PB*PU[1]
def p_mark(fg,sun,navy=None,uid='p'):
    xs=PCX-PR+PB; f=r[0]                       # tepi kanan batang, radius sambungan
    yf=PCY+math.sqrt((PR+f)**2-(xs+f-PCX)**2)
    tx=PCX+(xs+f-PCX)*PR/(PR+f); ty=PCY+(yf-PCY)*PR/(PR+f)
    yi=PCY+math.sqrt(PR**2-(xs-PCX)**2)
    fillet=f'<path d="M{xs:.2f} {yf:.2f}L{xs:.2f} {yi-2:.2f}L{tx+1:.2f} {ty-2:.2f}L{tx:.2f} {ty:.2f}A{f:.2f} {f:.2f} 0 0 0 {xs:.2f} {yf:.2f}Z" fill="{fg}"/>'
    bot=PCY-PR+PH
    stem=(f'<path d="M{PCX-PR:.2f} {PCY:.2f}H{xs:.2f}V{bot-PB/2:.2f}A{PB/2:.2f} {PB/2:.2f} 0 0 1 {PCX-PR:.2f} {bot-PB/2:.2f}Z" fill="{fg}"/>')
    return (f'<defs><mask id="m{uid}"><rect width="512" height="512" fill="#fff"/>{circ(PBX,PBY,PB,fill="#000")}</mask></defs>'
            f'<g mask="url(#m{uid})">{circ(PCX,PCY,PR,fill=fg)}{stem}{fillet}</g>'+circ(PBX,PBY,PS,fill=sun))
def p_guides():
    bot=PCY-PR+PH; x0=PCX-PR
    s=grect(x0,PCY-PR,2*PR,PH)+gl(x0,PCY+PR,PCX+PR,PCY+PR)
    s+=gc(PCX,PCY,PR,'φ²',160,lpos=.55)+gc(PBX,PBY,PB,'φ',135,lpos=.52,dx=-10,dy=-6)+gc(PBX,PBY,PS,'1',20,lpos=.5,dy=-5)
    s+=gc(x0+PB/2,bot-PB/2,PB/2)+gc(x0+PB/2,bot-PB*1.5,PB/2,dash=True)
    s+=dim(x0,bot+16,x0+PB,bot+16,'φ',off=16)
    s+=dim(PCX+PR+18,PCY-PR,PCX+PR+18,PCY+PR,'2φ²',off=-28)+dim(PCX+PR+18,PCY+PR,PCX+PR+18,bot,'2φ',off=-22)
    return s

# ═════════ B · TAWAF — sabit yang mengorbit Ka'bah ═════════
TU=(math.cos(math.radians(-45)),math.sin(math.radians(-45)))
THX,THY=256+r[2]*TU[0],256+r[2]*TU[1]          # pusat lubang, bergeser r2 → tebal sabit r1 … r4
TS=r[4]                                        # sisi Ka'bah = jari-jari lubang
def kabah(cx,cy,S,fill,band):
    x,y=cx-S/2,cy-S/2
    return (f'<rect x="{x:.2f}" y="{y:.2f}" width="{S:.2f}" height="{S:.2f}" rx="{S/PHI**5:.2f}" fill="{fill}"/>'
            f'<rect x="{x:.2f}" y="{y+S/PHI**3:.2f}" width="{S:.2f}" height="{S/PHI**4:.2f}" fill="{band}"/>')
def t_mark(fg,sun,navy=None,uid='t'):
    return (f'<defs><mask id="m{uid}"><rect width="512" height="512" fill="#fff"/>{circ(THX,THY,r[4],fill="#000")}</mask></defs>'
            +circ(256,256,r[5],fill=fg,mask=f'url(#m{uid})')+kabah(THX,THY,TS,navy or fg,sun))
def t_guides():
    s=gl(256-r[5]*.9,256+r[5]*.9,256+r[5]*.9,256-r[5]*.9)
    s+=gc(256,256,r[5],'φ²',205,lpos=.8,dy=-8)+gc(THX,THY,r[4],'φ',0,lpos=.77,dy=-8)
    s+=grect(THX-TS/2,THY-TS/2,TS,TS)
    y=THY-TS/2
    s+=gl(THX-TS/2-14,y+TS/PHI**2,THX+TS/2+14,y+TS/PHI**2)
    s+=dim(THX-TS/2,THY+TS/2+16,THX+TS/2,THY+TS/2+16,'φ',off=15)
    # tebal sabit: paling tipis (r1) & paling tebal (r4)
    a=(256+r[5]*TU[0],256+r[5]*TU[1]); b=(THX+r[4]*TU[0],THY+r[4]*TU[1])
    s+=gc((a[0]+b[0])/2,(a[1]+b[1])/2,r[1]/2)+txt(a[0]+20,a[1]-10,'1/φ²')
    a2=(256-r[5]*TU[0],256-r[5]*TU[1]); b2=(THX-r[4]*TU[0],THY-r[4]*TU[1])
    s+=gc((a2[0]+b2[0])/2,(a2[1]+b2[1])/2,r[4]/2,dash=True)+txt((a2[0]+b2[0])/2,(a2[1]+b2[1])/2+6,'φ')
    return s

# ═════════ C · U FAJAR — huruf U yang mengangkat matahari ═════════
URo=r[4]; URi=r[2]; UW=r[3]                    # luar φ², dalam 1, tebal φ
URS=r[3]/PHI**.0                               # matahari
def u_geo(rs=None,g=None):
    rs=rs if rs is not None else URS; g=r[0] if g is None else g
    dy=math.sqrt((rs+UW/2+g)**2-(URi+UW/2)**2)   # jarak vertikal pusat matahari ↔ pusat ujung lengan
    H=2*r[5]; L=H-(dy+rs)-URo                    # panjang lengan lurus supaya tinggi total = 2·r5
    ytop=256-r[5]; ys=ytop+rs; top=ys+dy; cy=top+L
    return rs,g,ys,top,cy
def u_mark(fg,sun,navy=None,uid='u',rs=None,g=None):
    rs,g,ys,top,cy=u_geo(rs,g); Ro,Ri,w=URo,URi,UW
    d=(f'M{256-Ro:.2f} {top:.2f}V{cy:.2f}A{Ro:.2f} {Ro:.2f} 0 0 0 {256+Ro:.2f} {cy:.2f}V{top:.2f}'
       f'A{w/2:.2f} {w/2:.2f} 0 0 0 {256+Ri:.2f} {top:.2f}V{cy:.2f}A{Ri:.2f} {Ri:.2f} 0 0 1 {256-Ri:.2f} {cy:.2f}V{top:.2f}A{w/2:.2f} {w/2:.2f} 0 0 0 {256-Ro:.2f} {top:.2f}Z')
    return f'<path d="{d}" fill="{fg}"/>'+circ(256,ys,rs,fill=sun)
def u_guides():
    rs,g,ys,top,cy=u_geo(); Ro,Ri,w=URo,URi,UW
    s=grect(256-Ro,256-r[5],2*Ro,2*r[5])
    s+=gc(256,cy,Ro,'φ²',35,lpos=.62,dy=-6)+gc(256,cy,Ri,'1',180,lpos=.5,dy=-6)
    s+=gc(256,ys,rs,'φ',-145,lpos=.5,dy=-6)
    s+=gc(256-Ri-w/2,top,w/2)+gc(256+Ri+w/2,top,w/2)
    s+=dim(256+Ri,top+34,256+Ro,top+34,'φ',off=-22)
    s+=dim(256+Ro+18,256-r[5],256+Ro+18,256+r[5],'2φ³',off=-28)+dim(256-Ro,256+r[5]+16,256+Ro,256+r[5]+16,'2φ²',off=16)
    return s

# ═════════ A1 · P SABIT + KA'BAH — sabit terbuka memangku Ka'bah ═════════
def p_body(fg,uid,hx,hy,hr):
    xs=PCX-PR+PB; f=r[0]
    yf=PCY+math.sqrt((PR+f)**2-(xs+f-PCX)**2)
    tx=PCX+(xs+f-PCX)*PR/(PR+f); ty=PCY+(yf-PCY)*PR/(PR+f)
    yi=PCY+math.sqrt(PR**2-(xs-PCX)**2)
    fillet=f'<path d="M{xs:.2f} {yf:.2f}L{xs:.2f} {yi-2:.2f}L{tx+1:.2f} {ty-2:.2f}L{tx:.2f} {ty:.2f}A{f:.2f} {f:.2f} 0 0 0 {xs:.2f} {yf:.2f}Z" fill="{fg}"/>'
    bot=PCY-PR+PH
    stem=(f'<path d="M{PCX-PR:.2f} {PCY:.2f}H{xs:.2f}V{bot-PB/2:.2f}A{PB/2:.2f} {PB/2:.2f} 0 0 1 {PCX-PR:.2f} {bot-PB/2:.2f}Z" fill="{fg}"/>')
    return (f'<defs><mask id="m{uid}"><rect width="512" height="512" fill="#fff"/>{circ(hx,hy,hr,fill="#000")}</mask></defs>'
            f'<g mask="url(#m{uid})">{circ(PCX,PCY,PR,fill=fg)}{stem}{fillet}</g>')
KS1=PS*2**.5                                   # Ka'bah = persegi di dalam lingkaran r2
def pk_mark(fg,sun,navy=None,uid='d'):
    return p_body(fg,uid,PBX,PBY,PB)+kabah(PBX,PBY,KS1,navy or fg,sun)
def p_frame():
    bot=PCY-PR+PH; x0=PCX-PR
    s=grect(x0,PCY-PR,2*PR,PH)+gl(x0,PCY+PR,PCX+PR,PCY+PR)
    s+=gc(x0+PB/2,bot-PB/2,PB/2)+gc(x0+PB/2,bot-PB*1.5,PB/2,dash=True)
    s+=dim(x0,bot+16,x0+PB,bot+16,'1',off=16)
    s+=dim(PCX+PR+18,PCY-PR,PCX+PR+18,PCY+PR,'2φ',off=-22)+dim(PCX+PR+18,PCY+PR,PCX+PR+18,bot,'2',off=-18)
    return s
def pk_guides():
    s=p_frame()+gc(PCX,PCY,PR,'φ',160,lpos=.55)+gc(PBX,PBY,PB,'1',135,lpos=.86,dx=-16,dy=-2)
    s+=gc(PBX,PBY,PS,dash=True)+grect(PBX-KS1/2,PBY-KS1/2,KS1,KS1)+txt(PBX+PS+20,PBY-PS-2,'1/φ')
    return s

# ═════════ A2 · P TAWAF — mangkuk P jadi sabit yang mengorbit Ka'bah ═════════
QHX,QHY=PCX+r[1]*PU[0],PCY+r[1]*PU[1]          # pusat lubang, geser r1 → tebal r0 … r3
def pt_mark(fg,sun,navy=None,uid='e'):
    return p_body(fg,uid,QHX,QHY,r[3])+kabah(QHX,QHY,r[3],navy or fg,sun)
def pt_guides():
    s=p_frame()+gc(PCX,PCY,PR,'φ',160,lpos=.78,dy=-7)+gc(QHX,QHY,r[3])
    s+=grect(QHX-r[3]/2,QHY-r[3]/2,r[3],r[3])
    a=(PCX+PR*PU[0],PCY+PR*PU[1]); b=(QHX+r[3]*PU[0],QHY+r[3]*PU[1])
    s+=gc((a[0]+b[0])/2,(a[1]+b[1])/2,r[0]/2)+txt(a[0]+26,a[1]-8,'1/φ³')
    a2=(PCX-PR*PU[0],PCY-PR*PU[1]); b2=(QHX-r[3]*PU[0],QHY-r[3]*PU[1])
    s+=gc((a2[0]+b2[0])/2,(a2[1]+b2[1])/2,r[3]/2,dash=True)+txt((a2[0]+b2[0])/2,(a2[1]+b2[1])/2+6,'1')
    return s
KABAH=set('bde')

MARKS={'a':('P Sabit',p_mark,p_guides),'b':('Tawaf',t_mark,t_guides),'c':('U Fajar',u_mark,u_guides),'d':('P Sabit Ka’bah',pk_mark,pk_guides),'e':('P Tawaf',pt_mark,pt_guides)}
def write_all():
    for k,(name,mark,guides) in MARKS.items():
        open(f'{k}-ikon.svg','w').write(svg(tile(BLUE)+mark(WHITE,SUN,NAVY if k in KABAH else None,k+'1')))
        open(f'{k}-ikon-putih.svg','w').write(svg(tile(WHITE)+mark(BLUE,SUN,NAVY,k+'2')))
        open(f'{k}-simbol.svg','w').write(svg(mark(BLUE,SUN,NAVY,k+'3'),'88 88 336 336'))
        open(f'{k}-simbol-putih.svg','w').write(svg(mark(WHITE,SUN,None,k+'4'),'88 88 336 336'))
        open(f'{k}-mono.svg','w').write(svg(mark(NAVY,WHITE if k in KABAH else NAVY,NAVY,k+'5'),'88 88 336 336'))
        open(f'{k}-konstruksi.svg','w').write(svg(mark(GHOST,GSUN,'#B9C6E6',k+'6')+guides(),'40 40 432 432'))
if __name__=='__main__':
    write_all()
    h='<body style="margin:0;padding:24px;background:#fff;display:grid;grid-template-columns:repeat(3,1fr);gap:16px">'
    for k in MARKS: h+=f'<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:10px;align-items:center"><img src="{k}-konstruksi.svg" width="100%" style="border:1px solid #eee"><div><img src="{k}-ikon.svg" width="100%"><div style="display:flex"><img src="{k}-simbol.svg" width="50%"><img src="{k}-mono.svg" width="50%"></div></div></div>'
    open('v2.html','w').write(h)
    print([round(x,2) for x in r])
