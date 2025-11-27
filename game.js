let gameRunning = false;
let score = 0;
let lives = 3;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ballImg = new Image();
ballImg.src = "images/ball.png";

const bulkImg = new Image();
bulkImg.src = "images/bulk.png";

let bulk = {
    x: canvas.width / 2 - 40,
    y: canvas.height - 120,
    width: 80,
    height: 80
};

let ball = {
    x: canvas.width / 2,
    y: 50,
    size: 40,
    speedY: 4
};

// ----------------------------
// START GAME BUTTON
// ----------------------------
document.getElementById("startBtn").addEventListener("click", startGame);

function startGame() {
    if (gameRunning) return;
    score = 0;
    lives = 3;
    gameRunning = true;
    ball.y = 50;
    requestAnimationFrame(gameLoop);
}

// ----------------------------
// TOUCH / MOUSE CONTROLS
// ----------------------------
function movePlayer(e) {
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let rect = canvas.getBoundingClientRect();
    let x = clientX - rect.left;

    bulk.x = x - bulk.width / 2;

    if (bulk.x < 0) bulk.x = 0;
    if (bulk.x + bulk.width > canvas.width) bulk.x = canvas.width - bulk.width;
}

canvas.addEventListener("mousemove", movePlayer);
canvas.addEventListener("touchmove", movePlayer);

// ----------------------------
// GAME LOOP
// ----------------------------
function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bulk
    ctx.drawImage(bulkImg, bulk.x, bulk.y, bulk.width, bulk.height);

    // Draw ball
    ctx.drawImage(ballImg, ball.x - 20, ball.y - 20, ball.size, ball.size);

    ball.y += ball.speedY;

    // Collision
    if (
        ball.y + ball.size > bulk.y &&
        ball.x > bulk.x &&
        ball.x < bulk.x + bulk.width
    ) {
        score++;
        resetBall();
    }

    // Missed
    if (ball.y > canvas.height) {
        lives--;
        resetBall();
        if (lives <= 0) {
            gameRunning = false;
            alert("Game Over! Score: " + score);
            return;
        }
    }

    requestAnimationFrame(gameLoop);
}

function resetBall() {
    ball.y = 50;
    ball.x = Math.random() * (canvas.width - 40) + 20;
}
