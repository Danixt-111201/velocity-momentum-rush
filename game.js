'use strict';
/* VELOCITY: MOMENTUM RUSH - DIGITAL ACTIVITY 03
   PHYSICS: change these top-level constants live during the class demo.
   Map is separate, in level-map.js, and never hard-coded in engine logic.
*/
const PHYSICS = Object.freeze({
  GRAVITY: 1700,                  // px/s^2
  NORMAL_JUMP_HEIGHT: 82,       // px
  NORMAL_JUMP_DISTANCE: 80,     // px (2 grid cells)
  CHARGED_JUMP_HEIGHT: 215,     // px
  CHARGED_JUMP_DISTANCE: 280,   // px
  SPRING_JUMP_HEIGHT: 270,      // px
  SPRING_JUMP_DISTANCE: 420,    // px
  CHARGE_MILLISECONDS: 320,
  COYOTE_SECONDS: 0.10,
  INPUT_BUFFER_SECONDS: 0.13,
  ENEMY_SPEED: 58               // px/s
});
const TILE=40, VIEW_WIDTH=1120, VIEW_HEIGHT=560;
const canvas=document.querySelector('#game'), ctx=canvas.getContext('2d');
const overlay=document.querySelector('#overlay');
const el=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const LEVEL_ROWS=window.VELOCITY_LEVEL.trim().split('\n').map(v=>v.trimEnd());
if(!LEVEL_ROWS.length||LEVEL_ROWS.some(r=>r.length!==LEVEL_ROWS[0].length))throw Error('El mapa ASCII debe ser rectangular.');
const COLS=LEVEL_ROWS[0].length, WORLD_W=COLS*TILE;
const stageLimit=28*TILE;
const entities={solids:[],platforms:[],walls:[],spikes:[],springs:[],rings:[],enemies:[],ramps:[],flag:null,start:null};
for(let row=0;row<LEVEL_ROWS.length;row++)for(let col=0;col<COLS;col++){
  const sym=LEVEL_ROWS[row][col],x=col*TILE,y=row*TILE;
  switch(sym){
  case '#':entities.solids.push({x,y,w:TILE,h:TILE});break;
  case '=':entities.platforms.push({x,y,w:TILE,h:11});break;
  case 'W':entities.walls.push({x,y,w:TILE,h:TILE});break;
  case '^':entities.spikes.push({x,y:y+16,w:TILE,h:24});break;
  case 'S':entities.springs.push({x:x+3,y:y+TILE,w:TILE-6});break;
  case 'O':entities.rings.push({x:x+TILE/2,y:y+TILE/2,taken:false});break;
  case 'E':entities.enemies.push({x:x+TILE/2,y:y+TILE,speed:PHYSICS.ENEMY_SPEED,base:x+TILE/2,min:x-60,max:x+60});break;
  case '/':entities.ramps.push({x,y1:y+TILE,y2:y,w:TILE});break;
  case 'F':entities.flag={x:x+TILE/2,y:(row+1)*TILE};break;
  case 'P':entities.start={x:x+TILE/2,y:(row+1)*TILE};break;
  }
}
if(!entities.start||!entities.flag)throw Error('El mapa requiere P (inicio) y F (bandera).');
let state='menu',player,camera=0,elapsed=0,frames=0,previous=0,lastGroundTime=-1,inputBufferUntil=-1;
let restarts=0,collected=0,jumps=0,attempts=0,direction=1,chargeAt=null,particles=[],audioCtx=null;
let showGuides=true,shudder=0;
const totalRings=entities.rings.length;
const ambient=[['#0d1e3e','#153f54','#1a3e44'],['#122b4d','#144752','#114044'],['#271d48','#4a2b56','#244b55']];
const stages=[{from:0,to:stageLimit},{from:stageLimit,to:stageLimit*2},{from:stageLimit*2,to:WORLD_W}];
function init(resetAll=false){
  player={x:entities.start.x,feet:480,prevFeet:480,vx:0,vy:0,goal:entities.start.x,air:false,type:'',radius:15};
  if(resetAll){restarts=0;collected=0;elapsed=0;jumps=0;attempts=0;entities.rings.forEach(r=>r.taken=false)}
  camera=0;direction=1;chargeAt=null;inputBufferUntil=-1;lastGroundTime=0;
}
function isWithin(x,left,right){return x>=left-10&&x<=right+10}
// Candidate landing surfaces directly below the player's current x.
function surfaceTops(x){const a=[];
  for(const t of entities.solids)if(isWithin(x,t.x,t.x+t.w))a.push(t.y);
  for(const t of entities.platforms)if(isWithin(x,t.x,t.x+t.w))a.push(t.y);
  for(const t of entities.ramps)if(x>=t.x-5&&x<=t.x+t.w+5){const q=clamp((x-t.x)/t.w,0,1);a.push(t.y1+(t.y2-t.y1)*q)}
  return a.sort((a,b)=>a-b);
}
function surfaceAt(x,feet){return surfaceTops(x).some(y=>Math.abs(y-feet)<5)}
function burst(x,y,color,n=10){for(let i=0;i<n;i++)particles.push({x,y,dx:(Math.random()-.5)*210,dy:(Math.random()-.7)*220,r:Math.random()*4+1,life:.45+Math.random()*.4,color})}
function sound(freq=470,dur=.08,kind='sine'){
  if(!audioCtx){try{audioCtx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}}
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=kind;o.frequency.value=freq;g.gain.setValueAtTime(.06,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);
}
function resetAfterHazard(){restarts++;shudder=9;burst(player.x,player.feet-18,'#ff819c',14);player.x=entities.start.x;player.feet=480;player.prevFeet=480;player.air=false;player.vx=0;player.vy=0;player.goal=player.x;chargeAt=null;inputBufferUntil=-1;lastGroundTime=elapsed;}
function launch(type,force=false){
  if(state!=='playing')return false;
  if(player.air && !force && elapsed-lastGroundTime>PHYSICS.COYOTE_SECONDS)return false;
  const arr=type==='normal'?[PHYSICS.NORMAL_JUMP_HEIGHT,PHYSICS.NORMAL_JUMP_DISTANCE]:type==='charged'?[PHYSICS.CHARGED_JUMP_HEIGHT,PHYSICS.CHARGED_JUMP_DISTANCE]:[PHYSICS.SPRING_JUMP_HEIGHT,PHYSICS.SPRING_JUMP_DISTANCE];
  const [height,dist]=arr,flightTime=2*Math.sqrt(2*height/PHYSICS.GRAVITY);
  player.air=true;player.vy=-Math.sqrt(2*PHYSICS.GRAVITY*height);player.vx=(direction*dist)/flightTime;player.goal=clamp(player.x+direction*dist,15,WORLD_W-15);player.type=type;
  inputBufferUntil=-1;jumps++;if(type==='charged')sound(620,.14,'sawtooth');else if(type==='spring')sound(850,.2);else sound(435,.07);
  burst(player.x,player.feet,'#84efde',type==='normal'?4:12);return true;
}
function jumpInput(){if(state!=='playing')return;if(!launch('normal'))inputBufferUntil=elapsed+PHYSICS.INPUT_BUFFER_SECONDS}
function startCharge(){if(state==='playing'&&chargeAt===null&&(!player.air||elapsed-lastGroundTime<=PHYSICS.COYOTE_SECONDS))chargeAt=performance.now()}
function releaseCharge(){if(chargeAt===null)return;const held=performance.now()-chargeAt;chargeAt=null;if(held>=PHYSICS.CHARGE_MILLISECONDS)launch('charged');else sound(220,.06)}
function springHit(){if(player.air)return false;for(const s of entities.springs)if(player.x>s.x-9&&player.x<s.x+s.w+9&&Math.abs(player.feet-s.y)<7){launch('spring',true);burst(player.x,s.y,'#ffadd3',18);return true}return false}
function hitBoxes(){
  if(player.feet>VIEW_HEIGHT+50){resetAfterHazard();return true}
  for(const s of entities.spikes)if(player.x+9>s.x&&player.x-9<s.x+s.w&&player.feet>s.y+4&&player.feet-31<s.y+s.h){resetAfterHazard();return true}
  for(const e of entities.enemies)if(Math.abs(player.x-e.x)<28&&Math.abs(player.feet-20-(e.y-19))<31){resetAfterHazard();return true}
  return false;
}
function move(dt){
  elapsed+=dt;
  for(const e of entities.enemies){e.x+=e.speed*dt;if(e.x>=e.max){e.x=e.max;e.speed=-Math.abs(e.speed)}if(e.x<=e.min){e.x=e.min;e.speed=Math.abs(e.speed)}}
  if(player.air){
    const prevX=player.x,prevY=player.feet;player.vy+=PHYSICS.GRAVITY*dt;player.feet+=player.vy*dt;
    player.x=player.vx>0?Math.min(player.goal,player.x+player.vx*dt):Math.max(player.goal,player.x+player.vx*dt);
    if(Math.abs(player.x-player.goal)<.001)player.vx=0;
    // Wall: a low normal jump is blocked without causing a death.
    for(const w of entities.walls)if(player.x+12>w.x&&player.x-12<w.x+w.w&&player.feet>w.y+3&&player.feet-29<w.y+w.h){player.x=prevX<=w.x?w.x-13:w.x+w.w+13;player.vx=0;player.goal=player.x}
    if(player.vy>=0){for(const y of surfaceTops(player.x)){if(prevY<=y+2&&player.feet>=y){player.feet=y;player.vy=0;player.vx=0;player.air=false;player.goal=player.x;lastGroundTime=elapsed;burst(player.x,y,'#74efd8',3);springHit();if(!player.air&&inputBufferUntil>=elapsed)launch('normal');break}}}
  } else {
    lastGroundTime=elapsed;
    if(!surfaceAt(player.x,player.feet)){player.air=true;player.vy=0;player.vx=0}
  }
  if(hitBoxes())return;
  for(const r of entities.rings)if(!r.taken&&Math.hypot(player.x-r.x,player.feet-20-r.y)<29){r.taken=true;collected++;burst(r.x,r.y,'#ffdf7f',12);sound(940,.11)}
  if(player.x>=entities.flag.x-18&&player.feet<=entities.flag.y+60 &&player.feet>=entities.flag.y-55){finish()}
  camera=clamp(camera+(clamp(player.x-310,0,WORLD_W-VIEW_WIDTH)-camera)*Math.min(1,dt*8),0,WORLD_W-VIEW_WIDTH);
  shudder*=Math.max(0,1-dt*12);
  for(const p of particles){p.x+=p.dx*dt;p.y+=p.dy*dt;p.dy+=350*dt;p.life-=dt}
  particles=particles.filter(p=>p.life>0);
  el('progressBar').style.width=`${100*(player.x/WORLD_W)}%`;
}
function finish(){state='win';document.body.classList.remove('playing');overlay.classList.remove('hidden');el('modalTitle').textContent='¡Nivel completado!';el('modalText').textContent=`Tiempo: ${elapsed.toFixed(1)} s · Anillos: ${collected}/${totalRings} · Reinicios: ${restarts}.`;el('modalExtra').textContent='Las tres secciones forman un único nivel. Cambia el mapa en level-map.js o las constantes en game.js.';el('play').textContent='Jugar de nuevo';sound(1050,.35)}
function start(){if(state==='win')init(true);state='playing';overlay.classList.add('hidden');document.body.classList.add('playing');previous=0}
function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
function sky(){const sec=clamp(Math.floor((camera+VIEW_WIDTH*.45)/stageLimit),0,2),pal=ambient[sec],g=ctx.createLinearGradient(0,0,0,VIEW_HEIGHT);g.addColorStop(0,pal[0]);g.addColorStop(.7,pal[1]);g.addColorStop(1,pal[2]);ctx.fillStyle=g;ctx.fillRect(0,0,VIEW_WIDTH,VIEW_HEIGHT);
 for(let i=0;i<26;i++){const x=((i*211-(camera*.16))%(VIEW_WIDTH+110)+(VIEW_WIDTH+110))%(VIEW_WIDTH+110)-40;const y=40+(i*67)%270;ctx.fillStyle='#a5d6ea18';ctx.beginPath();ctx.arc(x,y,(i%5)+2,0,7);ctx.fill()}
 for(let n=0;n<12;n++){const x=n*125-(camera*.12%125);const h=90+(n*73)%130;ctx.fillStyle=n%2?'#142d4759':'#1d425455';ctx.beginPath();ctx.moveTo(x,480);ctx.lineTo(x+65,480-h);ctx.lineTo(x+130,480);ctx.fill()}
}
function world(){const left=camera,right=camera+VIEW_WIDTH;
 ctx.save();ctx.translate(-camera,0);
 // Gridless platforms are shaded by their surface colors.
 for(const g of entities.solids)if(g.x<right&&g.x+g.w>left){ctx.fillStyle='#284258';ctx.fillRect(g.x,g.y,g.w,g.h);ctx.fillStyle='#68d6af';ctx.fillRect(g.x,g.y,g.w,7);ctx.fillStyle='#406780';ctx.fillRect(g.x+3,g.y+21,g.w-6,3)}
 for(const w of entities.walls)if(w.x<right&&w.x+w.w>left){roundRect(w.x,w.y,w.w,w.h,1,'#8094ab','#b1c5d6');ctx.fillStyle='#50677e';ctx.fillRect(w.x+8,w.y+6,24,3)}
 for(const p of entities.platforms)if(p.x<right&&p.x+p.w>left){ctx.fillStyle='#34566a';ctx.fillRect(p.x,p.y,p.w,12);ctx.fillStyle='#86f0bc';ctx.fillRect(p.x,p.y,p.w,6)}
 for(const r of entities.ramps)if(r.x<right&&r.x+r.w>left){ctx.fillStyle='#37696a';ctx.beginPath();ctx.moveTo(r.x,r.y1);ctx.lineTo(r.x+r.w,r.y2);ctx.lineTo(r.x+r.w,480);ctx.lineTo(r.x,480);ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#83f5b9';ctx.beginPath();ctx.moveTo(r.x,r.y1);ctx.lineTo(r.x+r.w,r.y2);ctx.stroke()}
 for(const h of entities.spikes)if(h.x<right&&h.x+h.w>left){for(let j=0;j<2;j++){ctx.fillStyle='#fe718a';ctx.beginPath();ctx.moveTo(h.x+j*20,h.y+24);ctx.lineTo(h.x+j*20+10,h.y);ctx.lineTo(h.x+j*20+20,h.y+24);ctx.fill();ctx.strokeStyle='#ffb4cb';ctx.stroke()}}
 for(const s of entities.springs)if(s.x<right&&s.x+s.w>left){roundRect(s.x-1,s.y-15,s.w+2,14,4,'#ee517d','#ffadd5');ctx.fillStyle='#ffe5a1';ctx.fillRect(s.x+6,s.y-20,s.w-12,5);ctx.strokeStyle='#fff2cf';ctx.beginPath();for(let q=0;q<4;q++){const x=s.x+7+q*7;ctx.moveTo(x,s.y-13);ctx.lineTo(x+5,s.y-2)}ctx.stroke()}
 for(const r of entities.rings)if(!r.taken&&r.x>left-20&&r.x<right+20){ctx.save();ctx.translate(r.x,r.y+Math.sin(elapsed*4+r.x)*3);ctx.strokeStyle='#ffdb65';ctx.lineWidth=7;ctx.shadowColor='#ffdd65';ctx.shadowBlur=19;ctx.beginPath();ctx.ellipse(0,0,12,15,0,0,7);ctx.stroke();ctx.restore()}
 for(const e of entities.enemies)if(e.x>left-40&&e.x<right+40){ctx.fillStyle='#ff6683';ctx.shadowColor='#ff6683';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(e.x,e.y-22,20,0,7);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#4b2542';ctx.beginPath();ctx.arc(e.x-6,e.y-25,3,0,7);ctx.arc(e.x+6,e.y-25,3,0,7);ctx.fill()}
 if(entities.flag){const x=entities.flag.x,y=entities.flag.y+80;ctx.lineWidth=5;ctx.strokeStyle='#effcff';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-124);ctx.stroke();ctx.fillStyle='#7cf4b1';ctx.beginPath();ctx.moveTo(x,y-124);ctx.lineTo(x+47,y-108);ctx.lineTo(x,y-94);ctx.fill()}
 // Non-verbal visual guidance; no on-screen text or tooltips.
 if(showGuides){ctx.save();ctx.setLineDash([6,9]);ctx.strokeStyle='#f5e294bb';ctx.lineWidth=3;
 for(const [x,y,toX,toY] of [[395,305,480,310],[stageLimit+160,355,stageLimit+345,354],[stageLimit*2+230,352,stageLimit*2+410,310]]){
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(toX,toY);ctx.stroke();ctx.beginPath();ctx.moveTo(toX,toY);ctx.lineTo(toX-12,toY-9);ctx.lineTo(toX-12,toY+9);ctx.closePath();ctx.fillStyle='#fff1a6';ctx.fill()}
 ctx.restore()}
 for(const p of particles){ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill()}ctx.globalAlpha=1;
 // Character: simple blue mascot, white eyes, scarf moves with direction.
 const px=player.x,py=player.feet-23;ctx.save();ctx.shadowColor='#80eaff';ctx.shadowBlur=17;ctx.fillStyle='#78e9f4';ctx.beginPath();ctx.arc(px,py,16,0,7);ctx.fill();ctx.shadowBlur=0;roundRect(px-13,py-8,26,15,6,'#173d60');roundRect(px-8,py-5,16,5,2,'#ecffff');ctx.fillStyle='#ffda79';ctx.beginPath();ctx.moveTo(px-direction*10,py+2);ctx.lineTo(px-direction*28,py+5+Math.sin(elapsed*13)*3);ctx.lineTo(px-direction*10,py+8);ctx.fill();ctx.restore();
 if(chargeAt!==null){const p=clamp((performance.now()-chargeAt)/PHYSICS.CHARGE_MILLISECONDS,0,1);ctx.strokeStyle='#fff1a3';ctx.lineWidth=5;ctx.beginPath();ctx.arc(px,py,27,-Math.PI/2,-Math.PI/2+p*Math.PI*2);ctx.stroke()}
 ctx.restore();
}
function draw(){ctx.clearRect(0,0,VIEW_WIDTH,VIEW_HEIGHT);ctx.save();if(shudder>.2)ctx.translate(Math.sin(frames*2.3)*shudder*.25,0);sky();world();ctx.restore();}
function frame(ms){const dt=previous?clamp((ms-previous)/1000,0,.025):0;previous=ms;frames++;if(state==='playing')move(dt);draw();requestAnimationFrame(frame)}
const held=new Set();window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if([' ','arrowleft','arrowright','arrowup','c','r','h','enter'].includes(k))e.preventDefault();if(held.has(k)&&k!=='arrowleft'&&k!=='arrowright')return;held.add(k);
 if(k==='arrowleft'||k==='a')direction=-1;if(k==='arrowright'||k==='d')direction=1;
 if(k===' '||k==='arrowup'||k==='w')jumpInput();if(k==='c')startCharge();if(k==='r'){if(state==='playing'){attempts++;resetAfterHazard()}else if(state==='win'){init(true);start()}}if(k==='h')showGuides=!showGuides;if(k==='enter'&&state!=='playing')start();});
window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();held.delete(k);if(k==='c')releaseCharge()});
window.addEventListener('blur',()=>{held.clear();chargeAt=null});
el('play').addEventListener('click',start);el('restart').addEventListener('click',()=>{init(true);state='menu';overlay.classList.remove('hidden');el('modalTitle').textContent='Velocity: Momentum Rush';el('modalText').textContent='Tres secciones conectadas. Descubre las reglas del salto, cruza los peligros y alcanza la bandera.';el('play').textContent='Comenzar'});
init(true);requestAnimationFrame(frame);
// Development-only inspector for automatic smoke tests and classroom debugging.
window.VelocityDebug={get state(){return{mode:state,x:player.x,y:player.feet,camera,restarts,elapsed,collected,worldWidth:WORLD_W}},
  position(x,feet=480){player.x=x;player.feet=feet;player.prevFeet=feet;player.vx=player.vy=0;player.goal=x;player.air=false;camera=clamp(x-310,0,WORLD_W-VIEW_WIDTH)},
  normal(){jumpInput()},charged(){launch('charged')},spring(){launch('spring',true)},begin(){start()},
  guide(v){showGuides=v},setPreviewSection(i){camera=i*VIEW_WIDTH;player.x=80+i*VIEW_WIDTH;player.feet=480;player.vx=player.vy=0;player.air=false},
  setPhysics(key,val){if(Object.hasOwn(PHYSICS,key))console.warn('PHYSICS is frozen: edit constant in game.js and refresh instead')},
  map:LEVEL_ROWS};
