
// Juego estilo Haxball (local, 2 jugadores en el mismo teclado)
// Controles: Jugador A = W A S D, Jugador B = Flechas

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// Campo
const goalWidth = 160;
const field = {x:0,y:0,w:W,h:H};

// Físicas
const friction = 0.995;
const deltaStep = 1/60;

// Entidades
function Vec(x,y){this.x=x;this.y=y}
Vec.prototype.add = function(v){this.x+=v.x;this.y+=v.y;return this}
Vec.prototype.scale = function(s){this.x*=s;this.y*=s;return this}
Vec.prototype.len = function(){return Math.hypot(this.x,this.y)}
Vec.prototype.normalize = function(){let l=this.len()||1;this.x/=l;this.y/=l;return this}

class Body{
  constructor(x,y,r,m,color){this.pos=new Vec(x,y);this.vel=new Vec(0,0);this.r=r;this.m=m;this.color=color}
  update(dt){this.pos.add(new Vec(this.vel.x*dt,this.vel.y*dt));}
  draw(){ctx.beginPath();ctx.arc(this.pos.x,this.pos.y,this.r,0,Math.PI*2);ctx.fillStyle=this.color;ctx.fill();ctx.closePath();}
}

const ball = new Body(W/2,H/2,12,1,'#fff');
const playerA = new Body(W*0.25,H/2,22,10,'#2b6cff');
const playerB = new Body(W*0.75,H/2,22,10,'#ff4b4b');

let scoreA=0, scoreB=0;

// Input
const keys = {};
window.addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

// Reset
function resetPositions(goalScored){
  playerA.pos = new Vec(W*0.25,H/2);
  playerA.vel = new Vec(0,0);
  playerB.pos = new Vec(W*0.75,H/2);
  playerB.vel = new Vec(0,0);
  ball.pos = new Vec(W/2,H/2);
  ball.vel = new Vec((Math.random()-0.5)*120,(Math.random()-0.5)*120);
  if(goalScored){setTimeout(()=>{},400)}
}

document.getElementById('resetBtn').addEventListener('click',()=>{scoreA=0;scoreB=0;updateHUD();resetPositions();});

// Colisiones
function resolveCollision(a,b){
  const dx = b.pos.x - a.pos.x;
  const dy = b.pos.y - a.pos.y;
  const dist = Math.hypot(dx,dy) || 0.0001;
  const overlap = a.r + b.r - dist;
  if(overlap>0){
    const nx = dx/dist, ny = dy/dist;
    const totalMass = a.m + b.m;
    a.pos.x -= nx * (overlap * (b.m/totalMass));
    a.pos.y -= ny * (overlap * (b.m/totalMass));
    b.pos.x += nx * (overlap * (a.m/totalMass));
    b.pos.y += ny * (overlap * (a.m/totalMass));
    const relVelX = b.vel.x - a.vel.x;
    const relVelY = b.vel.y - a.vel.y;
    const relVelAlongNormal = relVelX*nx + relVelY*ny;
    if(relVelAlongNormal>0) return;
    const e = 0.9;
    const j = -(1+e)*relVelAlongNormal / (1/a.m + 1/b.m);
    const impulseX = j*nx; const impulseY = j*ny;
    a.vel.x -= impulseX / a.m; a.vel.y -= impulseY / a.m;
    b.vel.x += impulseX / b.m; b.vel.y += impulseY / b.m;
  }
}

// Rebotes con paredes y porterías
function handleWalls(body){
  const leftBound = 0; 
  const rightBound = W; 
  const topBound = 0; 
  const bottomBound = H;
  const goalTop = (H - goalWidth)/2; 
  const goalBottom = (H + goalWidth)/2;

  if(body === ball){
    if(body.pos.x - body.r < leftBound){
      if(body.pos.y>goalTop && body.pos.y<goalBottom){
        scoreB++;
        updateHUD();
        resetPositions(true);
        return;
      } else {
        body.pos.x = body.r; body.vel.x *= -0.7;
      }
    }
    if(body.pos.x + body.r > rightBound){
      if(body.pos.y>goalTop && body.pos.y<goalBottom){
        scoreA++;
        updateHUD();
        resetPositions(true);
        return;
      } else {
        body.pos.x = rightBound - body.r; body.vel.x *= -0.7;
      }
    }
  } else {
    if(body.pos.x - body.r < leftBound){body.pos.x = body.r; body.vel.x *= -0.7}
    if(body.pos.x + body.r > rightBound){body.pos.x = rightBound - body.r; body.vel.x *= -0.7}
  }

  if(body.pos.y - body.r < topBound){body.pos.y = body.r; body.vel.y *= -0.7}
  if(body.pos.y + body.r > bottomBound){body.pos.y = bottomBound - body.r; body.vel.y *= -0.7}
}

function updateHUD(){document.getElementById('scoreA').textContent = scoreA;document.getElementById('scoreB').textContent = scoreB}

function playerInput(player, up, left, down, right){
  const speed = 300;
  let accel = new Vec(0,0);
  if(keys[up]) accel.y -= 1;
  if(keys[down]) accel.y += 1;
  if(keys[left]) accel.x -= 1;
  if(keys[right]) accel.x += 1;
  if(accel.x!==0 || accel.y!==0){accel.normalize().scale(speed); player.vel.add(new Vec(accel.x*deltaStep,accel.y*deltaStep));
    const max = 420; if(player.vel.len()>max) player.vel.normalize().scale(max);
  } else {
    player.vel.scale(0.98);
    if(player.vel.len()<3) player.vel = new Vec(0,0);
  }
}

let last = performance.now();
function step(ts){
  const dt = Math.min(0.05,(ts-last)/1000);
  last = ts;

  playerInput(playerA,'w','a','s','d');
  playerInput(playerB,'arrowup','arrowleft','arrowdown','arrowright');

  playerA.update(dt);
  playerB.update(dt);
  ball.update(dt);

  playerA.vel.scale(friction);
  playerB.vel.scale(friction);
  ball.vel.scale(friction);

  resolveCollision(playerA,ball);
  resolveCollision(playerB,ball);
  resolveCollision(playerA,playerB);

  handleWalls(ball);
  handleWalls(playerA);
  handleWalls(playerB);

  draw();

  requestAnimationFrame(step);
}

function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle = '#ffffff70'; ctx.lineWidth=2; ctx.beginPath();
  ctx.rect(0,0,W,H); ctx.stroke(); ctx.closePath();
  ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke(); ctx.closePath();
  ctx.beginPath(); ctx.arc(W/2,H/2,60,0,Math.PI*2); ctx.stroke(); ctx.closePath();
  const gw = goalWidth; ctx.fillStyle = '#00000080';
  ctx.fillRect(0,(H-gw)/2,6,gw); ctx.fillRect(W-6,(H-gw)/2,6,gw);

  ball.draw();
  playerA.draw();
  playerB.draw();

  ctx.beginPath(); ctx.moveTo(ball.pos.x,ball.pos.y); ctx.lineTo(ball.pos.x+ball.vel.x*0.06, ball.pos.y+ball.vel.y*0.06); ctx.strokeStyle='#fff'; ctx.stroke(); ctx.closePath();
}

resetPositions(false);
updateHUD();
requestAnimationFrame(step);

(function createTouchControls(){
  if(window.innerWidth>800) return;
  const panel = document.createElement('div');
  panel.style.position='fixed';panel.style.left=10;panel.style.bottom=10;panel.style.zIndex=9999;panel.style.display='flex';panel.style.gap='6px';
  ['W','A','S','D'].forEach(k=>{const b=document.createElement('button');b.textContent=k; b.style.opacity=0.85; b.style.padding='10px'; b.addEventListener('touchstart',e=>keys[k.toLowerCase()]=true); b.addEventListener('touchend',e=>keys[k.toLowerCase()]=false); panel.appendChild(b)});
  document.body.appendChild(panel);
})();

/*
let socket;

function iniciarWebSocket() {
  const wsUrl = "ws://192.168.208.27:3000";
  console.log("Intentando conectar a WebSocket en", wsUrl);
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("WebSocket conectado");
  };

  socket.onmessage = (event) => {
    document.getElementById("chat").value += event.data + "\n";


    try {
      let data = JSON.parse(event.data);

      switch (data.tipo) {
        case 'ataque':
          aplicarAtaque(data.fila, data.columna, data.dano);
          break;
        case 'abrir_cofre':
          abrirCofre(data.fila, data.columna);
          break;
        case "updateDungeon":

          updateDungeonFromJSON(data.dungeon);
          break;
        case 'usar_fuente':
          usarFuente(data.fila, data.columna);
          break;
        default:
          console.log("Mensaje desconocido:", data);
      }
    } catch (e) {
      console.error("Error al procesar mensaje WebSocket:", e);
    }
  };

  socket.onclose = () => {
    console.log("WebSocket cerrado");
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}


function send() {
  const msg = document.getElementById("msg").value;
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(msg);
    document.getElementById("msg").value = "";
  } else {
    alert("WebSocket no está conectado.");
  }
}*/