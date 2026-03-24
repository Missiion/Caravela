// =========================================
// SPRING (Sun rays + flowers + grass)
// =========================================
(function(){
    const rayCanvas    = document.getElementById('sun-canvas');
    const springCanvas = document.getElementById('spring-canvas');
    const rCtx  = rayCanvas.getContext('2d');
    const sCtx  = springCanvas.getContext('2d');

    const NUM_RAYS     = 9;
    const GRASS_BLADES = 220;
    const MAX_FLOWERS  = 70;
    let W, H;
    let grassBlades = [], rays = [], flowers = [];

    function resize(){
        W = rayCanvas.width = springCanvas.width = window.innerWidth;
        H = rayCanvas.height = springCanvas.height = window.innerHeight;
        buildGrass();
    }
    resize();
    window.addEventListener('resize', resize);

    let keyBuffer = '', springActive = false, animating = false;

    document.addEventListener('keydown', (e) => {
        if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        keyBuffer += e.key.toLowerCase();
        if(keyBuffer.length > 6) keyBuffer = keyBuffer.slice(-6);
        if(keyBuffer.endsWith('spring')){
            if(window._snowActive){   window._snowActive=false;   document.getElementById('snow-canvas').style.display='none'; }
            if(window._autumnActive){ window._autumnActive=false; document.getElementById('autumn-canvas').style.display='none'; }
            if(window._summerActive){ window._summerActive=false; document.getElementById('summer-canvas').style.display='none'; }
            springActive = !springActive;
            window._springActive = springActive;
            const d = springActive ? 'block' : 'none';
            rayCanvas.style.display = springCanvas.style.display = d;
            if(springActive){ initFlowers(); if(!animating){ animating=true; draw(); } }
            else { rCtx.clearRect(0,0,W,H); sCtx.clearRect(0,0,W,H); }
            keyBuffer = '';
        }
    });

    function buildRays(){
        rays = [];
        for(let i=0;i<NUM_RAYS;i++){
            const spread = 0.28 + 0.62*(i/(NUM_RAYS-1));
            rays.push({ angle: spread*(Math.PI/2), width: 18+Math.random()*55, phase: Math.random()*Math.PI*2, speed: 0.004+Math.random()*0.006, baseOp: 0.13+Math.random()*0.18 });
        }
    }
    buildRays();
    window.addEventListener('resize', buildRays);

    function drawGodRays(t){
        const ox=W*-0.12, oy=H*-0.08;
        rCtx.clearRect(0,0,W,H);
        for(const r of rays){
            const op = r.baseOp*(0.6+0.4*Math.sin(t*r.speed+r.phase));
            const halfA = Math.atan2(r.width*0.5, H*1.4);
            const a1=r.angle-halfA, a2=r.angle+halfA, len=Math.sqrt(W*W+H*H)*1.5;
            const x1=ox+Math.cos(a1)*len, y1=oy+Math.sin(a1)*len;
            const x2=ox+Math.cos(a2)*len, y2=oy+Math.sin(a2)*len;
            const grad=rCtx.createLinearGradient(ox,oy,ox+Math.cos(r.angle)*len*0.6,oy+Math.sin(r.angle)*len*0.6);
            grad.addColorStop(0,`rgba(255,200,100,${op*1.6})`);
            grad.addColorStop(0.35,`rgba(255,160,60,${op})`);
            grad.addColorStop(1,`rgba(255,120,20,0)`);
            rCtx.beginPath(); rCtx.moveTo(ox,oy); rCtx.lineTo(x1,y1); rCtx.lineTo(x2,y2); rCtx.closePath();
            rCtx.fillStyle=grad; rCtx.fill();
        }
    }

    function buildGrass(){
        grassBlades=[];
        for(let i=0;i<GRASS_BLADES;i++){
            grassBlades.push({ x:(i/GRASS_BLADES)*(W||window.innerWidth)+(Math.random()-0.5)*12, h:18+Math.random()*32, w:1.5+Math.random()*2, phase:Math.random()*Math.PI*2, speed:0.012+Math.random()*0.018, hue:100+Math.floor(Math.random()*30), sat:55+Math.floor(Math.random()*30), light:32+Math.floor(Math.random()*22) });
        }
    }

    function drawGrass(t){
        for(const b of grassBlades){
            const sway=Math.sin(t*b.speed+b.phase)*5;
            sCtx.save(); sCtx.translate(b.x,H); sCtx.beginPath(); sCtx.moveTo(0,0);
            sCtx.quadraticCurveTo(sway*0.5,-b.h*0.55,sway,-b.h);
            const grad=sCtx.createLinearGradient(0,0,sway,-b.h);
            grad.addColorStop(0,`hsla(${b.hue},${b.sat}%,${b.light}%,0.85)`);
            grad.addColorStop(1,`hsla(${b.hue+15},${b.sat+10}%,${b.light+20}%,0.6)`);
            sCtx.strokeStyle=grad; sCtx.lineWidth=b.w; sCtx.lineCap='round'; sCtx.stroke(); sCtx.restore();
        }
    }

    const PALETTES=[
        ['255,182,193','255,105,145','220,90,130'],
        ['255,255,255','240,240,255','210,220,255'],
        ['144,238,144','100,200,120','80,180,100'],
        ['255,160,180','255,80,120','200,60,100'],
        ['210,180,255','180,150,240','160,120,220']
    ];

    function newFlower(){
        const pal=PALETTES[Math.floor(Math.random()*PALETTES.length)], type=Math.random()<0.5?'petal':'blossom';
        return { x:Math.random()*(W||window.innerWidth), y:-15, type, pal, r:4+Math.random()*8, petals:4+Math.floor(Math.random()*3), rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-0.5)*0.04, speed:0.5+Math.random()*1.2, drift:(Math.random()-0.5)*0.4, wobble:Math.random()*Math.PI*2, wobbleSpeed:0.015+Math.random()*0.025, opacity:0.7+Math.random()*0.3, swing:Math.random()*Math.PI*2, swingSpeed:0.008+Math.random()*0.012 };
    }

    function initFlowers(){
        flowers=[];
        for(let i=0;i<MAX_FLOWERS;i++){ const f=newFlower(); f.y=Math.random()*H; flowers.push(f); }
    }

    function drawFlower(f){
        sCtx.save(); sCtx.translate(f.x,f.y); sCtx.rotate(f.rot); sCtx.globalAlpha=f.opacity;
        if(f.type==='petal'){
            sCtx.beginPath(); sCtx.ellipse(0,-f.r*0.6,f.r*0.38,f.r*0.7,0,0,Math.PI*2);
            sCtx.fillStyle=`rgba(${f.pal[0]},0.9)`; sCtx.shadowColor=`rgba(${f.pal[1]},0.5)`; sCtx.shadowBlur=4; sCtx.fill();
        } else {
            for(let p=0;p<f.petals;p++){
                const angle=(p/f.petals)*Math.PI*2;
                sCtx.save(); sCtx.rotate(angle); sCtx.beginPath();
                sCtx.ellipse(0,-f.r*0.55,f.r*0.32,f.r*0.6,0,0,Math.PI*2);
                sCtx.fillStyle=`rgba(${f.pal[p%f.pal.length]},0.85)`;
                sCtx.shadowColor=`rgba(${f.pal[0]},0.4)`; sCtx.shadowBlur=5; sCtx.fill(); sCtx.restore();
            }
            sCtx.beginPath(); sCtx.arc(0,0,f.r*0.22,0,Math.PI*2);
            sCtx.fillStyle=`rgba(255,240,180,0.95)`; sCtx.shadowBlur=0; sCtx.fill();
        }
        sCtx.globalAlpha=1; sCtx.shadowBlur=0; sCtx.restore();
    }

    let t=0;
    function draw(){
        if(!springActive){ animating=false; return; }
        requestAnimationFrame(draw); t++;
        drawGodRays(t); sCtx.clearRect(0,0,W,H);
        for(let i=0;i<flowers.length;i++){
            const f=flowers[i];
            f.wobble+=f.wobbleSpeed; f.swing+=f.swingSpeed; f.rot+=f.rotSpeed;
            f.x+=f.drift+Math.sin(f.wobble)*0.5+Math.sin(f.swing)*0.3; f.y+=f.speed;
            if(f.x<-20)f.x=W+20; if(f.x>W+20)f.x=-20;
            if(f.y>H+20){ flowers[i]=newFlower(); continue; }
            drawFlower(f);
        }
        drawGrass(t);
    }
})();

// =========================================
// AUTUMN (Leaves + floor grass)
// =========================================
(function(){
    const canvas=document.getElementById('autumn-canvas');
    const ctx=canvas.getContext('2d');
    const MAX_LEAVES=70;
    const LEAF_COLORS=['#c0392b','#e74c3c','#e67e22','#d35400','#f39c12','#8B1a1a','#a93226','#b7770d','#c56a00','#6b3a2a'];

    let W,H,bushes=[],leaves=[];
    let animating=false,autumnActive=false,t=0;

    function resize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; buildFloor(); }
    resize(); window.addEventListener('resize',resize);

    let kb='';
    document.addEventListener('keydown',e=>{
        if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
        kb+=e.key.toLowerCase(); if(kb.length>8)kb=kb.slice(-8);
        if(kb.endsWith('autumn')){
            if(window._snowActive){   window._snowActive=false;   document.getElementById('snow-canvas').style.display='none'; }
            if(window._springActive){ window._springActive=false; document.getElementById('sun-canvas').style.display='none'; document.getElementById('spring-canvas').style.display='none'; }
            if(window._summerActive){ window._summerActive=false; document.getElementById('summer-canvas').style.display='none'; }
            autumnActive=!autumnActive; window._autumnActive=autumnActive;
            canvas.style.display=autumnActive?'block':'none';
            if(autumnActive){ initLeaves(); if(!animating){animating=true;draw();} } else ctx.clearRect(0,0,W,H);
            kb='';
        }
    });

    function buildFloor(){
        bushes=[];
        const BLADE_COUNT=280;
        for(let i=0;i<BLADE_COUNT;i++){
            const hueOptions=[10,18,25,35,45,355,5];
            const hue=hueOptions[Math.floor(Math.random()*hueOptions.length)]+(Math.random()-0.5)*8;
            bushes.push({ x:(i/BLADE_COUNT)*(W||window.innerWidth)+(Math.random()-0.5)*14, h:10+Math.random()*38, w:1.4+Math.random()*2.2, phase:Math.random()*Math.PI*2, speed:0.010+Math.random()*0.018, hue, sat:55+Math.random()*35, light:28+Math.random()*28 });
        }
    }

    function drawFloor(){
        for(const b of bushes){
            const sway=Math.sin(t*b.speed+b.phase)*5;
            ctx.save(); ctx.translate(b.x,H); ctx.beginPath(); ctx.moveTo(0,0);
            ctx.quadraticCurveTo(sway*0.5,-b.h*0.55,sway,-b.h);
            const grad=ctx.createLinearGradient(0,0,sway,-b.h);
            grad.addColorStop(0,`hsla(${b.hue},${b.sat}%,${b.light}%,0.9)`);
            grad.addColorStop(1,`hsla(${b.hue+12},${b.sat+8}%,${b.light+18}%,0.65)`);
            ctx.strokeStyle=grad; ctx.lineWidth=b.w; ctx.lineCap='round'; ctx.stroke(); ctx.restore();
        }
    }

    function newLeaf(){
        return { x:Math.random()*W, y:-20, color:LEAF_COLORS[Math.floor(Math.random()*LEAF_COLORS.length)], size:9+Math.random()*14, rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-0.5)*0.05, speed:0.7+Math.random()*1.3, drift:(Math.random()-0.5)*0.4, wobble:Math.random()*Math.PI*2, wobbleSpeed:0.016+Math.random()*0.02, swing:Math.random()*Math.PI*2, swingSpeed:0.007+Math.random()*0.01, type:Math.floor(Math.random()*6), opacity:0.82+Math.random()*0.18 };
    }

    function initLeaves(){
        leaves=[];
        for(let i=0;i<MAX_LEAVES;i++){ const l=newLeaf(); l.y=Math.random()*(H*0.88); leaves.push(l); }
    }

    function drawLeaf(l){
        ctx.save(); ctx.translate(l.x,l.y); ctx.rotate(l.rot);
        ctx.globalAlpha=l.opacity;
        const s=l.size,c=l.color;
        ctx.fillStyle=c; ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.6; ctx.lineCap='round';

        switch(l.type){
            case 0:{
                ctx.beginPath();
                const op=[[-s*.12,-s],[s*.38,-s*.75],[s*.22,-s*.45],[s*.58,-s*.2],[s*.38,s*.15],[s*.52,s*.55],[s*.18,s*.8],[0,s*.65],[-s*.18,s*.8],[-s*.52,s*.55],[-s*.38,s*.15],[-s*.58,-s*.2],[-s*.22,-s*.45],[-s*.38,-s*.75]];
                ctx.moveTo(op[0][0],op[0][1]); for(let i=1;i<op.length;i++) ctx.lineTo(op[i][0],op[i][1]);
                ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(0,-s*.9); ctx.lineTo(0,s*.6); ctx.stroke();
                for(let i=0;i<4;i++){ const ly=-s*.55+i*s*.36; ctx.beginPath(); ctx.moveTo(0,ly); ctx.lineTo(s*.4,ly+s*.05); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,ly); ctx.lineTo(-s*.4,ly+s*.05); ctx.stroke(); }
                break;
            }
            case 1:{
                ctx.beginPath();
                for(let i=0;i<10;i++){ const a=(i/10)*Math.PI*2-Math.PI/2,r2=i%2===0?s:s*.4; i===0?ctx.moveTo(Math.cos(a)*r2*.85,Math.sin(a)*r2):ctx.lineTo(Math.cos(a)*r2*.85,Math.sin(a)*r2); }
                ctx.closePath(); ctx.fill();
                for(let i=0;i<5;i++){ const a=(i/5)*Math.PI*2-Math.PI/2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*s*.82,Math.sin(a)*s); ctx.stroke(); }
                break;
            }
            case 2:{
                ctx.beginPath(); ctx.ellipse(0,0,s*.45,s,0,0,Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.moveTo(0,-s*.92); ctx.lineTo(0,s*.92); ctx.stroke();
                for(let i=-4;i<=4;i++){ const ly=i*(s*.22),xo=s*.4*(1-Math.abs(ly/s)*.5); ctx.beginPath(); ctx.moveTo(0,ly); ctx.lineTo(xo,ly+s*.07); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,ly); ctx.lineTo(-xo,ly+s*.07); ctx.stroke(); }
                break;
            }
            case 3:{
                ctx.beginPath(); ctx.moveTo(0,-s); ctx.bezierCurveTo(s*.5,-s*.5,s*.45,s*.5,0,s); ctx.bezierCurveTo(-s*.45,s*.5,-s*.5,-s*.5,0,-s);
                ctx.fill(); ctx.beginPath(); ctx.moveTo(0,-s*.92); ctx.lineTo(0,s*.92); ctx.stroke();
                break;
            }
            case 4:{
                ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,s,Math.PI+0.25,Math.PI*2-0.25); ctx.closePath(); ctx.fill();
                for(let i=0;i<6;i++){ const a=Math.PI+0.25+(i/5)*(Math.PI-.5); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*s,Math.sin(a)*s); ctx.stroke(); }
                break;
            }
            default:{
                const jp=[[-s*.15,-s],[s*.15,-s],[s*.52,-s*.48],[s*.62,-s*.1],[s*.44,s*.28],[s*.56,s*.65],[s*.18,s*.95],[0,s*.75],[-s*.18,s*.95],[-s*.56,s*.65],[-s*.44,s*.28],[-s*.62,-s*.1],[-s*.52,-s*.48]];
                ctx.beginPath(); ctx.moveTo(jp[0][0],jp[0][1]); for(let i=1;i<jp.length;i++) ctx.lineTo(jp[i][0],jp[i][1]);
                ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(0,-s*.9); ctx.lineTo(0,s*.85); ctx.stroke();
                for(let i=0;i<4;i++){ const ly=-s*.6+i*s*.38; ctx.beginPath(); ctx.moveTo(0,ly); ctx.lineTo(s*.45,ly-s*.05); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,ly); ctx.lineTo(-s*.45,ly-s*.05); ctx.stroke(); }
            }
        }
        ctx.globalAlpha=1; ctx.restore();
    }

    function draw(){
        if(!autumnActive){ animating=false; ctx.clearRect(0,0,W,H); return; }
        requestAnimationFrame(draw); t++; ctx.clearRect(0,0,W,H); drawFloor();
        for(let i=0;i<leaves.length;i++){
            const l=leaves[i];
            l.wobble+=l.wobbleSpeed; l.swing+=l.swingSpeed; l.rot+=l.rotSpeed+Math.sin(l.wobble)*.012;
            l.x+=l.drift+Math.sin(l.wobble)*.6+Math.sin(l.swing)*.3; l.y+=l.speed;
            if(l.x<-30)l.x=W+30; if(l.x>W+30)l.x=-30;
            if(l.y-l.size>=H){ leaves[i]=newLeaf(); continue; }
            drawLeaf(l);
        }
    }
})();

// =========================================
// SUMMER (Sun + water + fish)
// =========================================
(function(){
    const canvas=document.getElementById('summer-canvas');
    const ctx=canvas.getContext('2d');
    const FLOOR_FROM_BOTTOM=35;

    let W,H,fish=[];
    let animating=false,summerActive=false,t=0,sunAngle=0,sunFloat=0;
    const SUN_TOP_OFFSET=130,SUN_LEFT_OFFSET=130,SUN_RADIUS=40,NUM_FISH=14;

    function floorY(){ return H-FLOOR_FROM_BOTTOM; }
    function resize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; spawnFish(); }
    resize(); window.addEventListener('resize',resize);

    let kb='';
    document.addEventListener('keydown',e=>{
        if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
        kb+=e.key.toLowerCase(); if(kb.length>9)kb=kb.slice(-9);
        if(kb.endsWith('summer')){
            if(window._springActive){ window._springActive=false; document.getElementById('sun-canvas').style.display='none'; document.getElementById('spring-canvas').style.display='none'; }
            if(window._snowActive){   window._snowActive=false;   document.getElementById('snow-canvas').style.display='none'; }
            if(window._autumnActive){ window._autumnActive=false; document.getElementById('autumn-canvas').style.display='none'; }
            summerActive=!summerActive; window._summerActive=summerActive;
            canvas.style.display=summerActive?'block':'none';
            if(summerActive){ if(!animating){animating=true;draw();} } else ctx.clearRect(0,0,W,H);
            kb='';
        }
    });

    function spawnFish(){
        fish=[];
        const colors=['#ff6b35','#ff9f1c','#ffbf69','#f72585','#4cc9f0','#f77f00','#06d6a0'];
        for(let i=0;i<NUM_FISH;i++){
            const dir=Math.random()<.5?1:-1,stripH=FLOOR_FROM_BOTTOM;
            fish.push({ x:Math.random()*W, y:(H-stripH)+8+Math.random()*(stripH-16), dir, speed:0.3+Math.random()*.5, size:3+Math.random()*4, color:colors[Math.floor(Math.random()*colors.length)], bob:Math.random()*Math.PI*2, bobSpeed:0.018+Math.random()*.018, tail:Math.random()*Math.PI*2 });
        }
    }

    function drawWater(){
        const fy=floorY(),stripH=FLOOR_FROM_BOTTOM;
        const wg=ctx.createLinearGradient(0,fy,0,H);
        wg.addColorStop(0,'rgba(30,130,190,0)'); wg.addColorStop(0.06,'rgba(45,155,215,0.93)');
        wg.addColorStop(0.5,'rgba(22,112,172,0.97)'); wg.addColorStop(1,'rgba(10,68,135,1)');
        ctx.fillStyle=wg; ctx.fillRect(0,fy,W,stripH);

        ctx.beginPath(); ctx.moveTo(0,fy);
        for(let x=0;x<=W;x+=6) ctx.lineTo(x,fy+Math.sin(x*.018+t*.045)*2.5+Math.sin(x*.007+t*.028)*1.5);
        ctx.lineTo(W,fy+8); ctx.lineTo(0,fy+8); ctx.closePath();
        ctx.fillStyle='rgba(15,95,155,0.50)'; ctx.fill();

        ctx.beginPath(); ctx.moveTo(0,fy+4);
        for(let x=0;x<=W;x+=8) ctx.lineTo(x,fy+4+Math.sin(x*.022+t*.035+1.2)*2+Math.sin(x*.01+t*.02+2)*1.2);
        ctx.lineTo(W,fy+12); ctx.lineTo(0,fy+12); ctx.closePath();
        ctx.fillStyle='rgba(20,110,175,0.30)'; ctx.fill();

        for(let i=0;i<2;i++){
            const ly=fy+stripH*(0.35+i*.35);
            ctx.beginPath(); ctx.moveTo(0,ly);
            for(let x=0;x<=W;x+=10) ctx.lineTo(x,ly+Math.sin(x*.03+t*.03+i)*1.2);
            ctx.strokeStyle=`rgba(140,205,255,${0.055-i*.01})`; ctx.lineWidth=1; ctx.stroke();
        }
    }

    function drawFish(f){
        ctx.save(); ctx.translate(f.x,f.y+Math.sin(f.bob)*2.2); if(f.dir<0)ctx.scale(-1,1);
        const s=f.size,c=f.color; ctx.fillStyle=c;
        const tw=Math.sin(f.tail)*.45;
        ctx.beginPath(); ctx.moveTo(-s*.7,0); ctx.lineTo(-s*1.55,-s*.5+tw*s); ctx.lineTo(-s*1.55,s*.5+tw*s); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0,0,s,s*.4,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(s*.05,-s*.36); ctx.lineTo(s*.28,-s*.72); ctx.lineTo(-s*.12,-s*.36); ctx.closePath(); ctx.globalAlpha=.6; ctx.fill(); ctx.globalAlpha=1;
        ctx.beginPath(); ctx.arc(s*.45,-s*.08,s*.14,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
        ctx.beginPath(); ctx.arc(s*.47,-s*.08,s*.07,0,Math.PI*2); ctx.fillStyle='#111'; ctx.fill();
        ctx.restore();
    }

    function drawSun(){
        const sx=SUN_LEFT_OFFSET,sy=SUN_TOP_OFFSET+Math.sin(sunFloat)*7,sr=SUN_RADIUS,NUM_BEAMS=16;
        for(let i=0;i<NUM_BEAMS;i++){
            const a=sunAngle+(i/NUM_BEAMS)*Math.PI*2,op=0.08+0.07*Math.sin(sunFloat*1.3+i*1.1),len=Math.max(W,H)*1.9,w=0.04+0.03*(i%3===0?1:.5);
            const g=ctx.createLinearGradient(sx,sy,sx+Math.cos(a)*len,sy+Math.sin(a)*len);
            g.addColorStop(0,`rgba(255,230,80,${op*2.8})`); g.addColorStop(0.2,`rgba(255,190,30,${op*1.4})`);
            g.addColorStop(0.6,`rgba(255,140,0,${op*0.5})`); g.addColorStop(1,`rgba(255,100,0,0)`);
            ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+Math.cos(a-w)*len,sy+Math.sin(a-w)*len); ctx.lineTo(sx+Math.cos(a+w)*len,sy+Math.sin(a+w)*len); ctx.closePath(); ctx.fillStyle=g; ctx.fill();
        }
        const gg=ctx.createRadialGradient(sx,sy,sr*.5,sx,sy,sr*4);
        gg.addColorStop(0,'rgba(255,230,80,.32)'); gg.addColorStop(.4,'rgba(255,180,30,.14)'); gg.addColorStop(1,'rgba(255,120,0,0)');
        ctx.beginPath(); ctx.arc(sx,sy,sr*4,0,Math.PI*2); ctx.fillStyle=gg; ctx.fill();
        ctx.save(); ctx.translate(sx,sy); ctx.rotate(sunAngle*.6);
        for(let i=0;i<12;i++){ const a=(i/12)*Math.PI*2; ctx.beginPath(); ctx.arc(Math.cos(a)*sr*1.42,Math.sin(a)*sr*1.42,2.5+Math.sin(sunFloat+i),0,Math.PI*2); ctx.fillStyle=`rgba(255,240,100,${.28+.18*Math.sin(sunFloat*2+i)})`; ctx.fill(); }
        ctx.restore();
        const dg=ctx.createRadialGradient(sx-sr*.2,sy-sr*.15,0,sx,sy,sr);
        dg.addColorStop(0,'#fff8c0'); dg.addColorStop(.4,'#ffe040'); dg.addColorStop(.75,'#ffb800'); dg.addColorStop(1,'#ff8800');
        ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2); ctx.fillStyle=dg; ctx.shadowColor='rgba(255,200,0,.9)'; ctx.shadowBlur=42; ctx.fill(); ctx.shadowBlur=0;
        const sg=ctx.createRadialGradient(sx-sr*.3,sy-sr*.25,0,sx-sr*.1,sy-sr*.1,sr*.55);
        sg.addColorStop(0,'rgba(255,255,255,.58)'); sg.addColorStop(1,'rgba(255,255,255,0)');
        ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2); ctx.fillStyle=sg; ctx.fill();
    }

    function draw(){
        if(!summerActive){ animating=false; ctx.clearRect(0,0,W,H); return; }
        requestAnimationFrame(draw); t++; sunAngle+=.003; sunFloat+=.018;
        ctx.clearRect(0,0,W,H); drawSun(); drawWater();
        const seaTop=H-FLOOR_FROM_BOTTOM+4;
        for(const f of fish){
            f.x+=f.dir*f.speed; f.bob+=f.bobSpeed; f.tail+=.11;
            if(f.x>W+30)f.x=-30; if(f.x<-30)f.x=W+30;
            f.y=Math.max(seaTop+4,Math.min(H-4,f.y));
            drawFish(f);
        }
    }
})();

// =========================================
// SNOW (Flakes + pile)
// =========================================
(function(){
    const canvas=document.getElementById('snow-canvas');
    const ctx=canvas.getContext('2d');
    const pileRes=3; let pile=[];
    let W,H;

    function resize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; initPile(); }
    resize(); window.addEventListener('resize',resize);

    let keyBuffer='',snowActive=false;
    document.addEventListener('keydown',(e)=>{
        if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
        keyBuffer+=e.key.toLowerCase(); if(keyBuffer.length>6)keyBuffer=keyBuffer.slice(-6);
        if(keyBuffer.endsWith('snow')){
            if(window._springActive){ window._springActive=false; document.getElementById('sun-canvas').style.display='none'; document.getElementById('spring-canvas').style.display='none'; }
            if(window._autumnActive){ window._autumnActive=false; document.getElementById('autumn-canvas').style.display='none'; }
            if(window._summerActive){ window._summerActive=false; document.getElementById('summer-canvas').style.display='none'; }
            snowActive=!snowActive; window._snowActive=snowActive;
            canvas.style.display=snowActive?'block':'none';
            if(snowActive){
                initPile(); flakes=[];
                for(let i=0;i<MAX_FLAKES;i++){ let f=newFlake(); f.y=Math.random()*H; flakes.push(f); }
                if(!animating){ animating=true; draw(); }
            }
            keyBuffer='';
        }
    });

    function initPile(){ pile=new Array(Math.ceil((W||window.innerWidth)/pileRes)).fill(0); }

    const SHAPES=[0,0,1,1,2,2,3,4];

    function drawFlakeShape(ctx,f){
        const {x,y,r,shape,rot,opacity}=f;
        ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.globalAlpha=opacity;
        ctx.strokeStyle='rgba(255,255,255,1)'; ctx.fillStyle='rgba(255,255,255,1)';

        if(shape===0){
            ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
        } else if(shape===1){
            ctx.lineWidth=Math.max(0.8,r*0.28); ctx.lineCap='round';
            for(let i=0;i<6;i++){
                ctx.save(); ctx.rotate((i/6)*Math.PI*2); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-r); ctx.stroke();
                const b=r*0.45;
                ctx.beginPath(); ctx.moveTo(0,-r*0.5); ctx.lineTo(b*0.5,-r*0.5-b*0.5); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0,-r*0.5); ctx.lineTo(-b*0.5,-r*0.5-b*0.5); ctx.stroke();
                ctx.restore();
            }
        } else if(shape===2){
            ctx.beginPath();
            for(let i=0;i<12;i++){
                const angle=(i/12)*Math.PI*2-Math.PI/2,rad=i%2===0?r:r*0.45;
                i===0?ctx.moveTo(Math.cos(angle)*rad,Math.sin(angle)*rad):ctx.lineTo(Math.cos(angle)*rad,Math.sin(angle)*rad);
            }
            ctx.closePath(); ctx.fill();
        } else if(shape===3){
            ctx.lineWidth=Math.max(0.7,r*0.25); ctx.lineCap='round';
            for(let i=0;i<3;i++){ ctx.save(); ctx.rotate((i/3)*Math.PI); ctx.beginPath(); ctx.moveTo(0,-r); ctx.lineTo(0,r); ctx.stroke(); ctx.restore(); }
        } else if(shape===4){
            ctx.lineWidth=Math.max(0.6,r*0.2); ctx.beginPath(); ctx.arc(0,0,r*0.65,0,Math.PI*2); ctx.stroke();
            for(let i=0;i<6;i++){ const angle=(i/6)*Math.PI*2; ctx.beginPath(); ctx.arc(Math.cos(angle)*r,Math.sin(angle)*r,r*0.18,0,Math.PI*2); ctx.fill(); }
        }
        ctx.globalAlpha=1; ctx.restore();
    }

    const MAX_FLAKES=200; let flakes=[],animating=false;

    function newFlake(){
        return { x:Math.random()*(W||window.innerWidth), y:-10, r:2+Math.random()*5, speed:0.6+Math.random()*1.6, drift:(Math.random()-0.5)*0.5, opacity:0.5+Math.random()*0.5, wobble:Math.random()*Math.PI*2, wobbleSpeed:0.015+Math.random()*0.025, shape:SHAPES[Math.floor(Math.random()*SHAPES.length)], rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-0.5)*0.02 };
    }

    function getPileHeight(x){ let col=Math.floor(x/pileRes); col=Math.max(0,Math.min(pile.length-1,col)); return pile[col]; }

    function addToPile(x,r){
        const spread=Math.ceil(r*1.4);
        for(let dx=-spread;dx<=spread;dx++){
            let col=Math.floor((x+dx)/pileRes); if(col<0||col>=pile.length)continue;
            const weight=1-Math.abs(dx)/(spread+1);
            pile[col]+=weight*(r*0.16); pile[col]=Math.min((H||window.innerHeight)*0.42,pile[col]);
        }
    }

    function smoothPile(){ for(let i=1;i<pile.length-1;i++) pile[i]=(pile[i-1]+pile[i]*2+pile[i+1])/4; }

    let frameCount=0;
    function draw(){
        if(!snowActive){ animating=false; ctx.clearRect(0,0,W,H); return; }
        requestAnimationFrame(draw); ctx.clearRect(0,0,W,H);

        if(pile.length>0){
            ctx.beginPath(); ctx.moveTo(0,H);
            for(let i=0;i<pile.length;i++) ctx.lineTo(i*pileRes,H-pile[i]);
            ctx.lineTo(W,H); ctx.closePath();
            const grad=ctx.createLinearGradient(0,H*0.55,0,H);
            grad.addColorStop(0,'rgba(210,228,255,0.72)'); grad.addColorStop(1,'rgba(255,255,255,0.96)');
            ctx.fillStyle=grad; ctx.fill();
        }

        for(let i=0;i<flakes.length;i++){
            const f=flakes[i];
            f.wobble+=f.wobbleSpeed; f.rot+=f.rotSpeed;
            f.x+=f.drift+Math.sin(f.wobble)*0.45; f.y+=f.speed;
            if(f.x<-f.r)f.x=W+f.r; if(f.x>W+f.r)f.x=-f.r;
            const groundY=H-getPileHeight(f.x);
            if(f.y+f.r>=groundY){ addToPile(f.x,f.r); flakes[i]=newFlake(); continue; }
            drawFlakeShape(ctx,f);
        }
        frameCount++; if(frameCount%6===0)smoothPile();
    }
})();
