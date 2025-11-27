// Tennis Bulk — stable working version

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 500;

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const resultScreen = document.getElementById("resultScreen");
const resultText = document.getElementById("resultText");
const retryBtn = document.getElementById("retryBtn");

let W = canvas.width;
let H = canvas.height;

// Robot skin
const robotImg = new Image();
robotImg.src = "images/robot.png"; // make sure exists

// Player & Robot
let player = { x: 20, y: H/2 - 60, w: 18, h: 120 };
let robot  = { x: W - 120, y: H/2 - 80, w: 100, h: 160 };

// Ball
let ball = {
  x: W/2,
  y: H/2,
  r: 12,
  dx: 6,
  dy: 3
};

let playerScore = 0;
let robotScore = 0;
const winScore = 3;

let running = false;
let touchY = null;

// MOBILE CONTROL
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  touchY = e.touches[0].clientY - rect.top;
}, { passive: false });

window.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  touchY = e.clientY - rect.top;
});

// RESET BALL
function resetBall() {
  ball.x = W/2;
  ball.y = H/2;

  let dir = Math.random() < 0.5 ? -1 : 1;
  ball.dx = dir * (5 + Math.random() * 2);
  ball.dy = (Math.random() * 4 - 2);
}

// DRAW
function draw() {
  ctx.clearRect(0, 0, W, H);

  // midline
  ctx.strokeStyle = "#4af";
  ctx.setLineDash([12, 12]);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(W/2, 0);
  ctx.lineTo(W/2, H);
  ctx.stroke();
  ctx.setLineDash([]);

  // player pad
  ctx.fillStyle = "#fff";
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // robot
  ctx.drawImage(robotImg, robot.x, robot.y, robot.w, robot.h);

  // ball glow
  ctx.shadowBlur = 25;
  ctx.shadowColor = "#4af";

  // ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.shadowBlur = 0;

  // score
  ctx.font = "32px Arial";
  ctx.fillText(playerScore, W/2 - 60, 40);
  ctx.fillText(robotScore, W/2 + 40, 40);
}

// UPDATE
function update() {
  // Player control
  if (touchY !== null) {
    player.y += (touchY - (player.y + player.h/2)) * 0.2;
  }

  // Robot AI (weaker)
  robot.y += (ball.y - (robot.y + robot.h/2)) * 0.03;

  // ball movement
  ball.x += ball.dx;
  ball.y += ball.dy;

  // bounce walls
  if (ball.y - ball.r < 0 || ball.y + ball.r > H) {
    ball.dy = -ball.dy;
  }

  // collide with player
  if (ball.x - ball.r < player.x + player.w &&
      ball.y > player.y &&
      ball.y < player.y + player.h) {

    let rel = (ball.y - (player.y + player.h/2)) / (player.h/2);
    let angle = rel * (Math.PI/3);

    let speed = Math.sqrt(ball.dx*ball.dx + ball.dy*ball.dy) + 0.5;

    ball.dx = Math.abs(speed * Math.cos(angle));
    ball.dy = speed * Math.sin(angle);
  }

  // collide robot
  if (ball.x + ball.r > robot.x &&
      ball.y > robot.y &&
      ball.y < robot.y + robot.h) {

    let rel = (ball.y - (robot.y + robot.h/2)) / (robot.h/2);
    let angle = rel * (Math.PI/3);

    let speed = Math.sqrt(ball.dx*ball.dx + ball.dy*ball.dy) + 0.5;

    ball.dx = -Math.abs(speed * Math.cos(angle));
    ball.dy = speed * Math.sin(angle);
  }

  // Score left
  if (ball.x < 0) {
    robotScore++;
    resetBall();
    checkWin();
  }

  // Score right
  if (ball.x > W) {
    playerScore++;
    resetBall();
    checkWin();
  }
}

function checkWin() {
  if (playerScore === winScore) showResult("YOU WIN!");
  if (robotScore === winScore) showResult("YOU LOSE!");
}

function showResult(msg) {
  running = false;
  resultText.textContent = msg;
  resultScreen.classList.remove("hidden");
}

// LOOP
function loop() {
  if (!running) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

// START BUTTON — WORKING ON PC + MOBILE
startBtn.addEventListener("click", () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  playerScore = 0;
  robotScore = 0;
  resetBall();
  running = true;
  loop();
});

// RETRY BUTTON
retryBtn.addEventListener("click", () => {
  resultScreen.classList.add("hidden");
  playerScore = 0;
  robotScore = 0;
  resetBall();
  running = true;
  loop();
});
