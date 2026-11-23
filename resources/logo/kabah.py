"""Pejuang Umrah — putaran Ka'bah: tiga konsep di atas satu gambar Ka'bah isometrik.
Ka'bah: kotak pembatas persegi 2w × 2w · atap : dinding = 1 : φ · miring sisi 1 : φ² · sabuk emas di potongan emas dinding.
"""
import math
from logo import PHI,r,BLUE,SUN,NAVY,WHITE,PINK,svg,tile,circ,gc,txt,gl,grect,dim
LANGIT='#CFE0FF'
S=1/PHI**2
STYLE={
 'biru': dict(faces=('#123088',NAVY,LANGIT),band=SUN,line=WHITE,dot=SUN,sun=SUN,bg=BLUE,sep=0),
 'putih':dict(faces=(BLUE,NAVY,LANGIT),band=SUN,line=BLUE,dot=SUN,sun=SUN,bg=WHITE,sep=0),
 'mono': dict(faces=(NAVY,NAVY,NAVY),band='#E9F1FF',line=NAVY,dot=NAVY,sun=NAVY,bg='#E9F1FF',sep=5),
 'hantu':dict(faces=('#C3D3F5','#AFC2EC','#E1EAFB'),band='#FFE2A6',line='#C9D8F8',dot='#FFE2A6',sun='#FFE9BB',bg='#FAFCFF',sep=0),
}
def poly(pts,fill,stroke=None,sw=0):
    d='M'+'L'.join(f'{x:.2f} {y:.2f}' for x,y in pts)+'Z'
    st=f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if sw else ''
    return f'<path d="{d}" fill="{fill}"{st}/>'
def add(a,b,k=1): return (a[0]+b[0]*k,a[1]+b[1]*k)
def cube_pts(cx,cy,w):
    h=2*w/PHI; F=(cx,cy+w); L=(-w,-w*S); R=(w,-w*S); U=(0,-h); FU=add(F,U)
    return h,F,L,R,U,FU
def kabah3(cx,cy,w,st,halo=0):
    """(cx,cy) pusat kotak pembatas 2w × 2w"""
    h,F,L,R,U,FU=cube_pts(cx,cy,w); f=st['faces']; o=''
    if halo:
        hexa=[F,add(F,R),add(add(F,R),U),add(add(FU,L),R),add(add(F,L),U),add(F,L)]
        o+=poly(hexa,st['bg'],st['bg'],halo*2)
    sep=st['sep']; sc=st['bg'] if sep else None
    soft=dict(stroke=None,sw=0)
    def face(pts,fill): return poly(pts,fill,sc or fill,sep or 4)
    o+=face([F,add(F,L),add(add(F,L),U),FU],f[0])+face([F,add(F,R),add(add(F,R),U),FU],f[1])
    o+=face([FU,add(FU,L),add(add(FU,L),R),add(FU,R)],f[2])
    a=add(FU,(0,h/PHI**4)); b=add(FU,(0,h/PHI**2))
    o+=poly([add(a,L),a,add(a,R),add(b,R),b,add(b,L)],st['band'])
    p=add(F,R,1/PHI**3); q=add(F,R,2/PHI**3); dh=h/PHI**2; base=h/PHI**5
    o+=poly([add(p,(0,-base)),add(q,(0,-base)),add(q,(0,-base-dh)),add(p,(0,-base-dh))],st['band'])
    return o
def cube_guides(cx,cy,w,dimx=None,side=1,slope=True,width=True):
    """label dalam satuan w (setengah lebar Ka'bah = 1)"""
    h,F,L,R,U,FU=cube_pts(cx,cy,w)
    x=dimx if dimx is not None else cx-side*(w+22)
    s=grect(cx-w,cy-w,2*w,2*w)+gl(min(x,cx-w)-8,FU[1],max(x,cx+w)+8,FU[1])
    s+=gl(min(x,cx-w),cy-w,max(x,cx-w),cy-w)+gl(min(x,cx-w),cy+w,max(x,cx-w),cy+w) if dimx is not None else ''
    s+=dim(x,cy-w,x,FU[1],'2/φ²',off=side*30)+dim(x,FU[1],x,cy+w,'2/φ',off=side*26)
    if width: s+=dim(cx-w,cy-w-16,cx+w,cy-w-16,'2',off=-22)
    if slope:
        a=F; b=add(F,R)
        s+=gl(a[0],a[1],b[0],a[1],dash=False,w=1.3)+gl(b[0],a[1],b[0],b[1],dash=False,w=1.3)
        s+=txt((a[0]+b[0])/2,a[1]+24,'1')+txt(b[0]+28,(a[1]+b[1])/2+6,'1/φ²')
    y=FU[1]+h/PHI**2
    s+=gl(cx-9,y,cx+9,y,dash=False,w=1.8)
    return s

# ═════════ D · ORBIT — Ka'bah, lintasan tawaf, dan satu titik: kamu ═════════
TW=r[4]; TAC=r[5]; TBC=r[3]; TT=r[1]; TDOT=r[2]; TANG=30
TCX=256.0
_dotb=TW-TW*S+TBC+TT/2                                       # bawah lintasan, relatif pusat kubus
TCY=256-(_dotb-TW)/2
def t_base(): return (TCX,TCY+TW-TW*S)
def t_dot():
    bx,by=t_base(); a=math.radians(TANG); return bx+TAC*math.cos(a),by+TBC*math.sin(a)
def tawaf(st,uid='t'):
    bx,by=t_base(); dx,dy=t_dot()
    o=f'<ellipse cx="{bx:.2f}" cy="{by:.2f}" rx="{TAC:.2f}" ry="{TBC:.2f}" fill="none" stroke="{st["line"]}" stroke-width="{TT:.2f}"/>'
    o+=kabah3(TCX,TCY,TW,st,halo=TT/2)
    return o+circ(dx,dy,TDOT+TT/2,fill=st['bg'])+circ(dx,dy,TDOT,fill=st['dot'])
def tawaf_guides():
    bx,by=t_base(); dx,dy=t_dot(); xl=bx-TAC-TT/2
    s=cube_guides(TCX,TCY,TW,dimx=xl-20,slope=False)
    s+=f'<ellipse cx="{bx:.2f}" cy="{by:.2f}" rx="{TAC:.2f}" ry="{TBC:.2f}" fill="none" stroke="{PINK}" stroke-width="1.4" stroke-dasharray="5 4"/>'
    s+=circ(bx,by,3,fill=PINK)+gl(bx,by,bx+TAC,by,dash=False,w=1.3)+gl(bx,by,bx,by+TBC,dash=False,w=1.3)
    s+=txt(bx+TAC*.66,by-9,'φ')+txt(bx-24,by+TBC*.66,'1/φ')
    s+=dim(xl,by+TBC+TT/2+16,xl+TT,by+TBC+TT/2+16,'1/φ³',off=18)+gl(xl,by,xl,by+TBC+TT/2+16)+gl(xl+TT,by,xl+TT,by+TBC+TT/2+16)
    s+=gc(dx,dy,TDOT,'1/φ²',0,lpos=1.75,dy=6)
    return s
T_BBOX=(TCX-TAC-TT/2,TCY-TW,TCX+TAC*math.cos(math.radians(TANG))+TDOT,TCY+_dotb)

# ═════════ E · FAJAR — matahari terbit di balik Ka'bah ═════════
FW=2*r[5]/PHI**2; FCX=256-FW/PHI/2; FCY=256+FW/PHI/2
def fajar(st,uid='f'):
    return circ(FCX+FW/PHI,FCY-FW/PHI,FW,fill=st['sun'])+kabah3(FCX,FCY,FW,st,halo=FW/PHI**5)
def fajar_guides():
    sx,sy=FCX+FW/PHI,FCY-FW/PHI
    s=cube_guides(FCX,FCY,FW,width=False)
    s+=gc(sx,sy,FW,'1',-40,lpos=.6,dy=-8)
    s+=circ(FCX,FCY,3,fill=PINK)+gl(FCX,FCY,sx,FCY,dash=False,w=1.3)+gl(sx,FCY,sx,sy,dash=False,w=1.3)
    s+=txt((FCX+sx)/2,FCY+22,'1/φ')+txt(sx+26,(FCY+sy)/2+6,'1/φ')
    return s
F_BBOX=(FCX-FW,FCY-FW*PHI,FCX+FW*PHI,FCY+FW)

# ═════════ F · LANGKAH — titik-titik langkah menuju pintu Ka'bah ═════════
LW=r[4]
LDOTS=[r[1]*PHI**.5,r[1],r[0]*PHI**.5,r[0],r[0]/PHI**.5,r[0]/PHI]
def _l_local():
    """koordinat relatif pusat kubus"""
    ex,ey=-0.15*LW,0.30*LW; A=1.50*LW; B=1.05*LW
    ang=170.0; out=[]
    for i,rad in enumerate(LDOTS):
        a=math.radians(ang); out.append((ex+A*math.cos(a),ey+B*math.sin(a),rad))
        if i<len(LDOTS)-1:
            need=(rad+LDOTS[i+1])*1.45
            lo,hi=0.5,120.0
            for _ in range(40):
                m=(lo+hi)/2; a2=math.radians(ang-m)
                d=math.hypot(A*math.cos(a2)-A*math.cos(a),B*math.sin(a2)-B*math.sin(a))
                if d<need: lo=m
                else: hi=m
            ang-=lo
    return out
_lp=_l_local()
_lx0=min([-LW]+[x-q for x,y,q in _lp]); _lx1=max([LW]+[x+q for x,y,q in _lp]); _ly1=max([LW]+[y+q for x,y,q in _lp])
LCX=256-(_lx0+_lx1)/2; LCY=256-(-LW+_ly1)/2
def l_pts(): return [(LCX+x,LCY+y,q) for x,y,q in _lp]
def langkah(st,uid='l'):
    o=kabah3(LCX,LCY,LW,st)
    for i,(x,y,rad) in enumerate(l_pts()): o+=circ(x,y,rad,fill=st['dot'] if i==0 else st['line'])
    return o
def langkah_guides():
    s=cube_guides(LCX,LCY,LW,side=-1,slope=False)
    P=l_pts(); lab=[None,'1/φ³',None,'1/φ⁴',None,'1/φ⁵']
    for i,((x,y,rad),t) in enumerate(zip(P,lab)):
        s+=gc(x,y,rad)
        if t: s+=txt(x-6,y+rad+24,t)
    return s
L_BBOX=(LCX+_lx0,LCY-LW,LCX+_lx1,LCY+_ly1)

MARKS={'t':('Orbit',tawaf,tawaf_guides),'f':('Fajar',fajar,fajar_guides),'l':('Langkah',langkah,langkah_guides)}
BBOX={'t':T_BBOX,'f':F_BBOX,'l':L_BBOX}
if __name__=='__main__':
    h='<body style="margin:0;padding:20px;background:#f3f5f9;display:grid;grid-template-columns:repeat(4,1fr);gap:18px;font:13px sans-serif">'
    for k,(n,m,g) in MARKS.items():
        ts=[svg(tile(BLUE)+m(STYLE['biru'],k+'1')),svg(tile(WHITE)+m(STYLE['putih'],k+'2')),svg(tile('#E9F1FF')+m(STYLE['mono'],k+'3')),svg(tile('#FAFCFF')+m(STYLE['hantu'],k+'4')+g())]
        for t in ts: h+=f'<div>{t}<div style="display:flex;gap:8px;align-items:end;margin:8px 0"><div style="width:56px">{t}</div><div style="width:32px">{t}</div><div style="width:22px">{t}</div></div>{n}</div>'
    open('k.html','w').write(h)
