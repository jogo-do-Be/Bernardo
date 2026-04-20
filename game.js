const GRID_SIZE = 20;
const CELL_SIZE = 30;
const BOARD_PX = GRID_SIZE * CELL_SIZE;
const PIECES_FOLDER = "pieces";
const MAX_SCAN = 200;
const MISS_LIMIT = 8;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("start-btn");
const controlButtons = [...document.querySelectorAll(".controls button")];

canvas.width = BOARD_PX;
canvas.height = BOARD_PX;

let snake;
let direction;
let pendingDirection;
let food;
let score;
let highScore;
let gameTimer = null;
let gameRunning = false;
let tickMs = 160;
let pieceImages = [];

function loadHighScore() {
  const saved = localStorage.getItem("snake_high_score");
  return Number.isFinite(Number(saved)) ? Number(saved) : 0;
}

function saveHighScore(value) {
  localStorage.setItem("snake_high_score", String(value));
}

function setStatus(text, error = false) {
  statusEl.textContent = text;
  statusEl.style.color = error ? "#b33410" : "#1f2f2d";
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function discoverPieceImages() {
  const found = [];
  let misses = 0;

  for (let i = 1; i <= MAX_SCAN && misses < MISS_LIMIT; i += 1) {
    const url = `${PIECES_FOLDER}/${i}.png`;
    try {
      const img = await loadImage(url);
      found.push(img);
      misses = 0;
    } catch {
      misses += 1;
    }
  }

  return found;
}

function getRandomPieceImage() {
  if (!pieceImages.length) return null;
  return pieceImages[randomInt(pieceImages.length)];
}

function spawnFood() {
  let candidate;
  do {
    candidate = {
      x: randomInt(GRID_SIZE),
      y: randomInt(GRID_SIZE),
      image: getRandomPieceImage(),
    };
  } while (snake.some((segment) => sameCell(segment, candidate)));
  return candidate;
}

function resetGame() {
  const middle = Math.floor(GRID_SIZE / 2);
  snake = [
    { x: middle - 1, y: middle },
    { x: middle - 2, y: middle },
    { x: middle - 3, y: middle },
  ];
  direction = { x: 1, y: 0 };
  pendingDirection = { ...direction };
  score = 0;
  tickMs = 160;
  food = spawnFood();
  updateHud();
  draw();
}

function updateHud() {
  scoreEl.textContent = String(score);
  highScoreEl.textContent = String(highScore);
}

function drawBoard() {
  ctx.fillStyle = "#0b1414";
  ctx.fillRect(0, 0, BOARD_PX, BOARD_PX);

  ctx.strokeStyle = "#162424";
  ctx.lineWidth = 1;

  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const p = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, BOARD_PX);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(BOARD_PX, p);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const px = segment.x * CELL_SIZE;
    const py = segment.y * CELL_SIZE;

    ctx.fillStyle = index === 0 ? "#68f1cb" : "#1fd39b";
    ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  });
}

function drawFood() {
  const px = food.x * CELL_SIZE;
  const py = food.y * CELL_SIZE;

  if (food.image) {
    ctx.drawImage(food.image, px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    return;
  }

  ctx.fillStyle = "#ff6b6b";
  ctx.beginPath();
  ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  drawBoard();
  drawFood();
  drawSnake();
}

function scheduleLoop() {
  if (gameTimer) {
    clearInterval(gameTimer);
  }
  gameTimer = setInterval(step, tickMs);
}

function startGame() {
  resetGame();
  gameRunning = true;
  startBtn.textContent = "Reiniciar";
  setStatus("Boa sorte!");
  scheduleLoop();
}

function stopGame() {
  gameRunning = false;
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
}

function gameOver() {
  stopGame();
  setStatus("Fim de jogo. Clique em Reiniciar para jogar novamente.", true);
}

function setDirection(next) {
  if (!gameRunning) return;

  if (next.x === -direction.x && next.y === -direction.y) {
    return;
  }

  pendingDirection = next;
}

function increaseSpeed() {
  const nextTick = Math.max(80, 160 - Math.floor(score / 2));
  if (nextTick !== tickMs) {
    tickMs = nextTick;
    scheduleLoop();
  }
}

function step() {
  direction = pendingDirection;

  const head = snake[0];
  const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  const outOfBounds =
    newHead.x < 0 ||
    newHead.x >= GRID_SIZE ||
    newHead.y < 0 ||
    newHead.y >= GRID_SIZE;

  if (outOfBounds || snake.some((segment) => sameCell(segment, newHead))) {
    draw();
    gameOver();
    return;
  }

  snake.unshift(newHead);

  if (sameCell(newHead, food)) {
    score += 1;
    if (score > highScore) {
      highScore = score;
      saveHighScore(highScore);
    }
    if (snake.length === GRID_SIZE * GRID_SIZE) {
      updateHud();
      draw();
      stopGame();
      setStatus("Voce venceu! Tabuleiro completo.");
      return;
    }
    food = spawnFood();
    increaseSpeed();
  } else {
    snake.pop();
  }

  updateHud();
  draw();
}

function onKeyDown(event) {
  const key = event.key.toLowerCase();

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
  }

  if (key === "arrowup" || key === "w") setDirection({ x: 0, y: -1 });
  if (key === "arrowdown" || key === "s") setDirection({ x: 0, y: 1 });
  if (key === "arrowleft" || key === "a") setDirection({ x: -1, y: 0 });
  if (key === "arrowright" || key === "d") setDirection({ x: 1, y: 0 });
}

function bindControls() {
  document.addEventListener("keydown", onKeyDown);

  controlButtons.forEach((button) => {
    const { dir } = button.dataset;

    button.addEventListener("click", () => {
      if (dir === "up") setDirection({ x: 0, y: -1 });
      if (dir === "down") setDirection({ x: 0, y: 1 });
      if (dir === "left") setDirection({ x: -1, y: 0 });
      if (dir === "right") setDirection({ x: 1, y: 0 });
    });
  });

  startBtn.addEventListener("click", startGame);
}

async function init() {
  highScore = loadHighScore();
  updateHud();
  drawBoard();

  pieceImages = await discoverPieceImages();
  if (pieceImages.length) {
    setStatus(`Imagens encontradas: ${pieceImages.length}. Clique em Iniciar.`);
  } else {
    setStatus("Nenhuma imagem encontrada em /pieces. O jogo vai usar bolinha padrão.");
  }

  startBtn.disabled = false;
  bindControls();
}

init().catch(() => {
  setStatus("Erro ao carregar jogo. Recarregue a página.", true);
  startBtn.disabled = true;
});
