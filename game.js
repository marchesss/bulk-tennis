const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restart");

// Звуки
const hitSound = new Audio("sounds/hit.mp3");
const scoreSound = new Audio("sounds/score.mp3");
const wallSound = new Audio("sounds/wall.mp3");

// Робот
let robotImg = new Image();
robotImg.src = "images/robot.png";

// Игроки
let player = { x: 20, y: canvas.height / 2 - 60, width: 15, height: 120, speed: 10 };
let robot = { x: canvas.width - 120, y: canvas.height / 2 - 80, width: 100, height: 160 };

// Мяч с физикой
let ball = { x: canvas.width/2, y: canvas.height/2, radius: 12, dx: 5, dy: 3, gravity: 0.2, friction: 0.995 };

let playerScore = 0;
let robotScore = 0;
const winScore = 3;
let gameOver = false;
let touchY = null;

// Частицы при ударе
let particles = [];

// Управление
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  touchY = e.touches[0].clientY - rect.top;
}, { passive: false });

window.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  touchY = e.clientY - rect.top;
});

// Сброс мяча
function resetBall() {
  ball.x = canvas.width/2;
  ball.y = canvas.height/2;
  ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
  ball.dy = (Math.random() * 4) - 2;
}

// Победа
function checkWin() {
  if(playerScore === winScore || robotScore === winScore) {
    gameOver = true;
    restartBtn.style.display = "block";
  }
}

// Кнопки
restartBtn.onclick = () => {
  playerScore = 0;
  robotScore = 0;
  gameOver = false;
  resetBall();
  restartBtn.style.display = "none";
  loop();
}

startBtn.onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  loop();
}

// Частицы
function createParticles(x, y) {
  for(let i=0;i<10;i++){
    particles.push({
      x: x,
      y: y,
      dx: (Math.random()-0.5)*4,
      dy: (Math.random()-0.5)*4,
      radius: Math.random()*3+2,
      alpha:1
    });
  }
}

// Отрисовка
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Динамичный фон
  let gradient = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
  gradient.addColorStop(0,'#0c1a30');
  gradient.addColorStop(1,'#101f4f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Линия посередине
  ctx.strokeStyle = "#4af";
  ctx.setLineDash([10,10]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(canvas.width/2,0);
  ctx.lineTo(canvas.width/2,canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Игрок
  ctx.fillStyle = "#fff";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#4af";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Робот
  ctx.drawImage(robotImg, robot.x, robot.y, robot.width, robot.height);

  // Мяч
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
  ctx.fillStyle = "#fff";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#6fc";
  ctx.fill();
  ctx.shadowBlur=0;
  ctx.closePath();

  // Частицы
  particles.forEach((p,i)=>{
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
    ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
    ctx.fill();
    ctx.closePath();
    p.x += p.dx;
    p.y += p.dy;
    p.alpha -=0.02;
    if(p.alpha<=0) particles.splice(i,1);
  });

  // Счет
  ctx.font = "26px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(playerScore, canvas.width/2 - 60, 40);
  ctx.fillText(robotScore, canvas.width/2 + 40, 40);
}

// Обновление
function update(){
  if(touchY !== null){
    player.y += (touchY - (player.y + player.height/2))*0.2;
  }

  // Слабый ИИ
  robot.y += ((ball.y - (robot.y + robot.height/2))*0.025);

  // Физика мяча
  ball.dy += ball.gravity;
  ball.x += ball.dx;
  ball.y += ball.dy;
  ball.dx *= ball.friction;
  ball.dy *= ball.friction;

  // Столкновение с стенами
  if(ball.y-ball.radius <0){ ball.y=ball.radius; ball.dy=-ball.dy; wallSound.play(); }
  if(ball.y+ball.radius > canvas.height){ ball.y=canvas.height-ball.radius; ball.dy=-ball.dy; wallSound.play(); }

  // Столкновение с игроком
  if(ball.x-ball.radius < player.x+player.width && ball.y>player.y && ball.y<player.y+player.height){
    ball.dx=-ball.dx; hitSound.play(); createParticles(ball.x,ball.y);
  }

  // Столкновение с роботом
  if(ball.x+ball.radius > robot.x && ball.y>robot.y && ball.y<robot.y+robot.height){
    ball.dx=-ball.dx; hitSound.play(); createParticles(ball.x,ball.y);
  }

  // Гол
  if(ball.x<0){ robotScore++; scoreSound.play(); resetBall(); checkWin(); }
  if(ball.x>canvas.width){ playerScore++; scoreSound.play(); resetBall(); checkWin(); }
}

// Цикл игры
function loop(){
  if(!gameOver){
    update();
    draw();
    requestAnimationFrame(loop);
  }
}
