// ===========================
// GAME CONFIGURATION
// ===========================
const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 400,
    PADDLE_HEIGHT: 100,
    PADDLE_WIDTH: 10,
    BALL_RADIUS: 8,
    BASE_BALL_SPEED: 5,
    BASE_PLAYER_SPEED: 6,
    BASE_COMPUTER_SPEED: 4.5,
    AI_REACTION_TIME: 35,
    WINNING_SCORE: 11,
    DIFFICULTY: {
        easy: { computerSpeed: 3.5, aiReactionTime: 50 },
        medium: { computerSpeed: 4.5, aiReactionTime: 35 },
        hard: { computerSpeed: 6, aiReactionTime: 20 }
    }
};

// ===========================
// GAME STATE
// ===========================
const gameState = {
    canvas: null,
    ctx: null,
    gameActive: false,
    gamePaused: false,
    difficulty: 'medium',
    keys: {},
    mouseY: 0,
    touchY: 0,
    useMouseControl: false,
    useTouchControl: false,
    rally: 0,
    bestRally: 0,
    frameCount: 0,
    fps: 60,
    lastFrameTime: Date.now()
};

const playerPaddle = {
    x: 10,
    y: 0,
    width: CONFIG.PADDLE_WIDTH,
    height: CONFIG.PADDLE_HEIGHT,
    dy: 0,
    speed: CONFIG.BASE_PLAYER_SPEED
};

const computerPaddle = {
    x: 0,
    y: 0,
    width: CONFIG.PADDLE_WIDTH,
    height: CONFIG.PADDLE_HEIGHT,
    dy: 0,
    speed: CONFIG.BASE_COMPUTER_SPEED,
    reactionTime: CONFIG.AI_REACTION_TIME
};

const ball = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    radius: CONFIG.BALL_RADIUS,
    speed: CONFIG.BASE_BALL_SPEED,
    speedIncrease: 1.02
};

const score = {
    player: 0,
    computer: 0
};

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');

    gameState.canvas.width = CONFIG.CANVAS_WIDTH;
    gameState.canvas.height = CONFIG.CANVAS_HEIGHT;

    playerPaddle.y = gameState.canvas.height / 2 - CONFIG.PADDLE_HEIGHT / 2;
    computerPaddle.x = gameState.canvas.width - CONFIG.PADDLE_WIDTH - 10;
    computerPaddle.y = gameState.canvas.height / 2 - CONFIG.PADDLE_HEIGHT / 2;

    resetBall();
    setupEventListeners();

    const difficultySelect = document.getElementById('difficulty');
    difficultySelect.addEventListener('change', (e) => {
        gameState.difficulty = e.target.value;
        applyDifficulty();
    });

    gameLoop();
    updateStatus();
});

// ===========================
// EVENT LISTENERS
// ===========================
function setupEventListeners() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    gameState.canvas.addEventListener('mousemove', handleMouseMove);
    gameState.canvas.addEventListener('mouseenter', () => {
        gameState.useMouseControl = true;
        gameState.useTouchControl = false;
    });
    gameState.canvas.addEventListener('mouseleave', () => {
        gameState.useMouseControl = false;
        playerPaddle.dy = 0;
    });

    gameState.canvas.addEventListener('touchstart', handleTouchStart, false);
    gameState.canvas.addEventListener('touchmove', handleTouchMove, false);
    gameState.canvas.addEventListener('touchend', handleTouchEnd, false);
}

function handleKeyDown(e) {
    gameState.keys[e.key] = true;

    switch(e.key) {
        case ' ':
            e.preventDefault();
            if (!gameState.gameActive) {
                resetBall();
                gameState.gameActive = true;
                gameState.gamePaused = false;
            } else {
                gameState.gamePaused = !gameState.gamePaused;
            }
            updateStatus();
            break;
        case 'r':
        case 'R':
            e.preventDefault();
            resetGame();
            break;
    }

    gameState.useMouseControl = false;
    gameState.useTouchControl = false;
}

function handleKeyUp(e) {
    gameState.keys[e.key] = false;
    
    if (!gameState.keys['ArrowUp'] && !gameState.keys['ArrowDown']) {
        playerPaddle.dy = 0;
    }
}

function handleMouseMove(e) {
    if (!gameState.useMouseControl) return;

    const rect = gameState.canvas.getBoundingClientRect();
    gameState.mouseY = e.clientY - rect.top;

    const paddleCenter = playerPaddle.y + playerPaddle.height / 2;
    const distance = gameState.mouseY - paddleCenter;

    if (Math.abs(distance) > 5) {
        playerPaddle.dy = distance > 0 ? playerPaddle.speed : -playerPaddle.speed;
    } else {
        playerPaddle.dy *= 0.8;
    }
}

function handleTouchStart(e) {
    gameState.useTouchControl = true;
    gameState.useMouseControl = false;
    handleTouchMove(e);
}

function handleTouchMove(e) {
    if (!gameState.useTouchControl) return;
    e.preventDefault();

    const rect = gameState.canvas.getBoundingClientRect();
    gameState.touchY = e.touches[0].clientY - rect.top;

    const paddleCenter = playerPaddle.y + playerPaddle.height / 2;
    const distance = gameState.touchY - paddleCenter;

    if (Math.abs(distance) > 5) {
        playerPaddle.dy = distance > 0 ? playerPaddle.speed : -playerPaddle.speed;
    }
}

function handleTouchEnd(e) {
    gameState.useTouchControl = false;
    playerPaddle.dy = 0;
}

// ===========================
// GAME LOGIC
// ===========================
function applyDifficulty() {
    const settings = CONFIG.DIFFICULTY[gameState.difficulty];
    computerPaddle.speed = settings.computerSpeed;
    computerPaddle.reactionTime = settings.aiReactionTime;
}

function resetGame() {
    gameState.gameActive = false;
    gameState.gamePaused = false;
    score.player = 0;
    score.computer = 0;
    gameState.rally = 0;
    gameState.bestRally = 0;
    resetBall();
    updateScore();
    updateStatus();
}

function resetBall() {
    ball.x = gameState.canvas.width / 2;
    ball.y = gameState.canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = (Math.random() - 0.5) * ball.speed;
    gameState.rally = 0;
}

function updateStatus() {
    const statusEl = document.getElementById('status');
    if (!gameState.gameActive) {
        statusEl.textContent = 'Press SPACE to start the game';
        statusEl.classList.remove('paused');
    } else if (gameState.gamePaused) {
        statusEl.textContent = '⏸️ PAUSED - Press SPACE to resume';
        statusEl.classList.add('paused');
    } else {
        statusEl.textContent = '🎮 Game is running...';
        statusEl.classList.remove('paused');
    }
}

function checkWinCondition() {
    // Check if anyone reached winning score
    if (score.player >= CONFIG.WINNING_SCORE) {
        gameState.gameActive = false;
        gameState.gamePaused = false;
        document.getElementById('status').textContent = '🎉 PLAYER WINS! Press SPACE to play again';
        return true;
    } else if (score.computer >= CONFIG.WINNING_SCORE) {
        gameState.gameActive = false;
        gameState.gamePaused = false;
        document.getElementById('status').textContent = '🤖 COMPUTER WINS! Press SPACE to play again';
        return true;
    }
    return false;
}

function updateScore() {
    const playerScoreEl = document.getElementById('playerScore');
    const computerScoreEl = document.getElementById('computerScore');
    
    playerScoreEl.textContent = score.player;
    computerScoreEl.textContent = score.computer;
    
    playerScoreEl.classList.remove('update');
    computerScoreEl.classList.remove('update');
    void playerScoreEl.offsetWidth;
    playerScoreEl.classList.add('update');
    computerScoreEl.classList.add('update');

    // Check win condition immediately
    checkWinCondition();
}

function updateStats() {
    document.getElementById('rallyCurrent').textContent = gameState.rally;
    document.getElementById('rallyBest').textContent = gameState.bestRally;

    gameState.frameCount++;
    const now = Date.now();
    if (now - gameState.lastFrameTime >= 1000) {
        gameState.fps = gameState.frameCount;
        gameState.frameCount = 0;
        gameState.lastFrameTime = now;
        document.getElementById('fps').textContent = gameState.fps;
    }
}

function updatePlayerPaddle() {
    if (gameState.keys['ArrowUp']) {
        playerPaddle.dy = -playerPaddle.speed;
        gameState.useMouseControl = false;
    } else if (gameState.keys['ArrowDown']) {
        playerPaddle.dy = playerPaddle.speed;
        gameState.useMouseControl = false;
    }

    playerPaddle.y += playerPaddle.dy;
    playerPaddle.y = Math.max(0, Math.min(playerPaddle.y, gameState.canvas.height - playerPaddle.height));
}

function updateComputerPaddle() {
    const paddleCenter = computerPaddle.y + computerPaddle.height / 2;
    const ballCenter = ball.y;

    if (paddleCenter < ballCenter - computerPaddle.reactionTime) {
        computerPaddle.dy = computerPaddle.speed;
    } else if (paddleCenter > ballCenter + computerPaddle.reactionTime) {
        computerPaddle.dy = -computerPaddle.speed;
    } else {
        computerPaddle.dy = 0;
    }

    computerPaddle.y += computerPaddle.dy;
    computerPaddle.y = Math.max(0, Math.min(computerPaddle.y, gameState.canvas.height - computerPaddle.height));
}

function updateBall() {
    if (!gameState.gameActive || gameState.gamePaused) return;

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y - ball.radius < 0 || ball.y + ball.radius > gameState.canvas.height) {
        ball.dy *= -1;
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
        } else {
            ball.y = gameState.canvas.height - ball.radius;
        }
    }

    if (ball.dx < 0 &&
        ball.x - ball.radius < playerPaddle.x + playerPaddle.width &&
        ball.y > playerPaddle.y &&
        ball.y < playerPaddle.y + playerPaddle.height) {
        
        ball.dx = -ball.dx * ball.speedIncrease;
        ball.x = playerPaddle.x + playerPaddle.width + ball.radius;

        const relativeIntersect = (playerPaddle.y + playerPaddle.height / 2) - ball.y;
        ball.dy = -relativeIntersect / (playerPaddle.height / 2) * ball.speed;

        gameState.rally++;
    }

    if (ball.dx > 0 &&
        ball.x + ball.radius > computerPaddle.x &&
        ball.y > computerPaddle.y &&
        ball.y < computerPaddle.y + computerPaddle.height) {
        
        ball.dx = -ball.dx * ball.speedIncrease;
        ball.x = computerPaddle.x - ball.radius;

        const relativeIntersect = (computerPaddle.y + computerPaddle.height / 2) - ball.y;
        ball.dy = -relativeIntersect / (computerPaddle.height / 2) * ball.speed;

        gameState.rally++;
    }

    if (ball.x - ball.radius < 0) {
        score.computer++;
        if (gameState.rally > gameState.bestRally) {
            gameState.bestRally = gameState.rally;
        }
        updateScore();
        // Only continue if game is still active (not won)
        if (gameState.gameActive) {
            resetBall();
        }
    }

    if (ball.x + ball.radius > gameState.canvas.width) {
        score.player++;
        if (gameState.rally > gameState.bestRally) {
            gameState.bestRally = gameState.rally;
        }
        updateScore();
        // Only continue if game is still active (not won)
        if (gameState.gameActive) {
            resetBall();
        }
    }
}

function draw() {
    const ctx = gameState.ctx;
    const canvas = gameState.canvas;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#00ff88';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#00ff88';
    ctx.fillRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height);

    ctx.fillStyle = '#ff0088';
    ctx.fillRect(computerPaddle.x, computerPaddle.y, computerPaddle.width, computerPaddle.height);

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

// ===========================
// GAME LOOP
// ===========================
function gameLoop() {
    updatePlayerPaddle();
    updateComputerPaddle();
    updateBall();
    updateStats();
    draw();
    requestAnimationFrame(gameLoop);
}
