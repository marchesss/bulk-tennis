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

// Мяч
let ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, dx: 6, dy: 6 };

let playerScore = 0;
let robotScore = 0;
const winScore = 3;
let gameOver = false;
let touchY = null;

// Управление на мобильных
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  touchY = e.touches[0].clientY - rect.top;
}, { passive: false });

window.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  touchY = e.clientY - rect.top;
});

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx = -ball.dx;
  ball.dy = (Math.random() * 6) - 3;
}

function checkWin() {
  if (playerScore === winScore || robotScore === winScore) {
    gameOver = true;
    restartBtn.style.display = "block";
  }
}

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

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Анимация фона
  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0d1326");
  gradient.addColorStop(1, "#203a70");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Средняя линия
  ctx.strokeStyle = "#4af";
  ctx.setLineDash([15, 15]);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Игрок
  ctx.fillStyle = "white";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Робот
  ctx.drawImage(robotImg, robot.x, robot.y, robot.width, robot.height);

  // Мяч
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#4af";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.closePath();

  // Счет
  ctx.font = "28px Arial";
  ctx.fillText(`${playerScore}`, canvas.width / 2 - 60, 40);
  ctx.fillText(`${robotScore}`, canvas.width / 2 + 40, 40);
}

function update() {
  if (touchY !== null) {
    player.y += (touchY - (player.y + player.height / 2)) * 0.2;
  }
  robot.y += ((ball.y - (robot.y + robot.height / 2)) * 0.05);

  ball.x += ball.dx;
  ball.y += ball.dy;

  // Столкновение со стенами
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
    ball.dy = -ball.dy;
    wallSound.play();
  }

  // Столкновение с игроком
  if (ball.x - ball.radius < player.x + player.width &&
      ball.y > player.y && ball.y < player.y + player.height) {
    ball.dx = -ball.dx;
    hitSound.play();
  }

  // Столкновение с роботом
  if (ball.x + ball.radius > robot.x &&
      ball.y > robot.y && ball.y < robot.y + robot.height) {
    ball.dx = -ball.dx;
    hitSound.play();
  }

  // Гол
  if (ball.x < 0) {
    robotScore++;
    scoreSound.play();
    resetBall();
    checkWin();
  }

  if (ball.x > canvas.width) {
    playerScore++;
    scoreSound.play();
    resetBall();
    checkWin();
  }
}

function loop() {
  if (!gameOver) {
    update();
    draw();
    requestAnimationFrame(loop);
  }
}
