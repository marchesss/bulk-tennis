// game.js - Tennis Bulk (complete)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');
const muteBtn = document.getElementById('muteBtn');
const overlay = document.getElementById('overlay');
const resultText = document.getElementById('resultText');
const retryBtn = document.getElementById('retryBtn');
const menuBtn = document.getElementById('menuBtn');

let W = canvas.width, H = canvas.height;
function resizeCanvas(){
  // keep internal resolution stable but fit visually by CSS
  W = canvas.width = 900;
  H = canvas.height = 500;
}
resizeCanvas();

// sounds (add files into sounds/)
const sounds = {
  hit: new Audio('sounds/hit.mp3'),
  score: new Audio('sounds/score.mp3'),
  wall: new Audio('sounds/wall.mp3'),
};
let muted = false;
muteBtn.addEventListener('click', () => {
  muted = !muted;
  muteBtn.textContent = muted ? 'Unmute' : 'Mute';
  for (let k in sounds) sounds[k].muted = muted;
});

// images
const robotImg = new Image();
robotImg.src = 'images/robot.png'; // make sure this exists

// game state
let player = { x: 24, y: H/2 - 70, w: 16, h: 140 };
let robot =  { x: W - 120, y: H/2 - 80, w: 100, h: 160 };

let ball = {
  x: W/2, y: H/2, r: 12,
  dx: 0, dy: 0,
  gravity: 0.12, friction: 0.999,
  maxSpeed: 12
};

let playerScore = 0, robotScore = 0;
const winScore = 3;
let running = false;
let touchY = null;
let particles = [];

// mobile/desktop control
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  touchY = e.touches[0].clientY - rect.top;
}, {passive:false});
window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  touchY = e.clientY - rect.top;
});

// utility
function play(name){
  if(muted) return;
  if(sounds[name] && sounds[name].currentTime !== undefined){
    try{ sounds[name].currentTime = 0 } catch(e){}
    sounds[name].play();
  }
}

function spawnParticles(x,y, color='255,255,255'){
  for(let i=0;i<16;i++){
    particles.push({
      x,y,
      dx:(Math.random()-0.5)*6,
      dy:(Math.random()-0.9)*6,
      r: Math.random()*3 + 1,
      life: 30 + Math.random()*20,
      color
    });
  }
}

// Reset ball with diagonal start (never vertical)
function resetBall(toLeft){
  ball.x = W/2;
  ball.y = H/2;
  const dir = (typeof toLeft === 'boolean') ? (toLeft ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
  ball.dx = dir * (4 + Math.random()*2);      // horizontal speed
  ball.dy = (Math.random()*3 - 1.5);          // small vertical offset
}

// collision helpers
function clamp(v, a,b){ return Math.max(a, Math.min(b, v)); }

// Start / Restart handlers
startBtn.onclick = () => {
  menu.style.display = 'none';
  overlay.classList.add('hidden');
  canvas.style.display = 'block';
  startGame();
};

retryBtn.onclick = () => {
  playerScore = 0; robotScore = 0;
  overlay.classList.add('hidden');
  resetBall();
  running = true;
  loop();
};

menuBtn.onclick = () => {
  overlay.classList.add('hidden');
  running = false;
  menu.style.display = '';
  canvas.style.display = 'none';
};

// physics & gameplay tweaks
function applyPaddleHit(isPlayer){
  // compute collision point relative to paddle center
  const p = isPlayer ? player : robot;
  const relativeY = (ball.y - (p.y + p.h/2)) / (p.h/2); // -1..1
  const angle = relativeY * (Math.PI/4); // +/-45deg
  const speed = Math.min(Math.sqrt(ball.dx*ball.dx + ball.dy*ball.dy) + 0.8, ball.maxSpeed);
  const sign = isPlayer ? 1 : -1;
  ball.dx = sign * Math.abs(speed * Math.cos(angle));
  ball.dy = speed * Math.sin(angle);
}

function update(){
  // player movement follows touch/mouse
  if(touchY !== null){
    player.y += (touchY - (player.y + player.h/2)) * 0.22;
  }
  // clamp paddles inside canvas
  player.y = clamp(player.y, 8, H - player.h - 8);

  // weaker AI: small reaction + some noise
  const aiTarget = ball.y + (Math.random()-0.5) * 30; // add slight randomness
  robot.y += (aiTarget - (robot.y + robot.h/2)) * 0.03; // weaker factor
  robot.y = clamp(robot.y, 8, H - robot.h - 8);

  // ball physics
  ball.dy += ball.gravity;
  ball.x += ball.dx;
  ball.y += ball.dy;

  // basic air friction
  ball.dx *= ball.friction;
  ball.dy *= ball.friction;

  // limit speed to avoid runaway
  const s = Math.sqrt(ball.dx*ball.dx + ball.dy*ball.dy);
  if(s > ball.maxSpeed){
    ball.dx = ball.dx / s * ball.maxSpeed;
    ball.dy = ball.dy / s * ball.maxSpeed;
  }

  // wall collisions (top/bottom)
  if(ball.y - ball.r < 0){
    ball.y = ball.r;
    ball.dy = -ball.dy * 0.9;
    play('wall');
    spawnParticles(ball.x, ball.y, '200,220,255');
  }
  if(ball.y + ball.r > H){
    ball.y = H - ball.r;
    ball.dy = -ball.dy * 0.9;
    play('wall');
    spawnParticles(ball.x, ball.y, '200,220,255');
  }

  // collision with player paddle
  if(ball.x - ball.r < player.x + player.w &&
     ball.x - ball.r > player.x - 20 && // small tolerance
     ball.y > player.y && ball.y < player.y + player.h){
    applyPaddleHit(true);
    play('hit');
    spawnParticles(ball.x - ball.r, ball.y, '255,255,255');
    // ensure ball moves right after hit
    if(ball.dx < 1) ball.dx = Math.max(ball.dx, 2);
  }

  // collision with robot paddle
  if(ball.x + ball.r > robot.x &&
     ball.x + ball.r < robot.x + robot.w + 20 &&
     ball.y > robot.y && ball.y < robot.y + robot.h){
    applyPaddleHit(false);
    play('hit');
    spawnParticles(ball.x + ball.r, ball.y, '255,255,255');
    // ensure ball moves left after hit
    if(ball.dx > -1) ball.dx = Math.min(ball.dx, -2);
  }

  // score
  if(ball.x < -40){
    robotScore++;
    play('score');
    spawnParticles(W/2, H/2, '255,180,180');
    resetBall(true);
    checkWin();
  }
  if(ball.x > W + 40){
    playerScore++;
    play('score');
    spawnParticles(W/2, H/2, '180,255,180');
    resetBall(false);
    checkWin();
  }

  // particles update
  for(let i = particles.length -1; i >= 0; i--){
    const p = particles[i];
    p.x += p.dx; p.y += p.dy;
    p.dy += 0.08; // gravity on particles
    p.life--;
    if(p.life <= 0) particles.splice(i,1);
  }
}

function draw(){
  // background dynamic subtle grid + vignette
  ctx.clearRect(0,0,W,H);

  // animated gradient background (subtle)
  const g = ctx.createLinearGradient(0,0,W,H);
  g.addColorStop(0, '#081425');
  g.addColorStop(1, '#0e2840');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // midline glow
  ctx.save();
  ctx.strokeStyle = 'rgba(74,170,255,0.08)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8,10]);
  ctx.beginPath();
  ctx.moveTo(W/2, -10);
  ctx.lineTo(W/2, H+10);
  ctx.stroke();
  ctx.restore();

  // paddles glow (player left)
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 18;
  ctx.shadowColor = 'rgba(74,170,255,0.12)';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.restore();

  // robot draw (image with subtle glow)
  ctx.save();
  ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(111,252,204,0.06)';
  if (robotImg.complete) ctx.drawImage(robotImg, robot.x, robot.y, robot.w, robot.h);
  else { ctx.fillStyle='#ddd'; ctx.fillRect(robot.x,robot.y,robot.w,robot.h); }
  ctx.restore();

  // ball trailing blur
  ctx.beginPath();
  ctx.fillStyle = `rgba(255,255,255,0.12)`;
  ctx.arc(ball.x - ball.dx*2.0, ball.y - ball.dy*2.0, ball.r*1.9, 0, Math.PI*2);
  ctx.fill();

  // ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 22;
  ctx.shadowColor = '#00c8ff';
  ctx.fill();
  ctx.shadowBlur = 0;

  // particles
  particles.forEach(p=>{
    ctx.beginPath();
    ctx.fillStyle = `rgba(${p.color || '255,255,255'},${(p.life/50).toFixed(2)})`;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
  });

  // scores
  ctx.font = '26px Inter, Arial';
  ctx.fillStyle = '#dff';
  ctx.fillText(playerScore, W/2 - 64, 42);
  ctx.fillText(robotScore, W/2 + 36, 42);
}

function checkWin(){
  if(playerScore >= winScore || robotScore >= winScore){
    running = false;
    overlay.classList.remove('hidden');
    resultText.textContent = (playerScore > robotScore) ? 'You win!' : 'Robot wins';
    overlay.querySelector('.panel').style.opacity = 1;
  }
}

function loop(){
  if(!running) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

// initial start
function startGame(){
  playerScore = 0; robotScore = 0;
  particles = [];
  resetBall();
  running = true;
  loop();
}

// on load set quiet menu style and bind keyboard
window.addEventListener('load', () => {
  canvas.style.display = 'none';
  overlay.classList.add('hidden');
  muteBtn.textContent = muted ? 'Unmute' : 'Mute';
});

// keyboard control for testing
window.addEventListener('keydown', e => {
  if(e.key === 'm') { muted = !muted; muteBtn.textContent = muted ? 'Unmute' : 'Mute' }
  if(e.key === ' ' && !running && menu.style.display==='none'){ startGame(); }
});
