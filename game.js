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
const painelJogoEl = document.querySelector(".painel-jogo");
const headlineEl = document.getElementById("headline");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const piecesCountEl = document.getElementById("pieces-count");
const controlButtons = [...document.querySelectorAll(".dir-btn")];

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
let hasStarted = false;
let paused = false;
let tickMs = 160;
let pieceImages = [];
let touchStart = null;

function loadHighScore() {
  const saved = localStorage.getItem("snake_high_score");
  return Number.isFinite(Number(saved)) ? Number(saved) : 0;
}

function saveHighScore(value) {
  localStorage.setItem("snake_high_score", String(value));
}

function setStatus(text, variant = "ok", forcedTitle = "") {
  statusEl.textContent = text;
  statusEl.classList.remove("is-ok", "is-error", "is-paused");

  let title = forcedTitle;
  if (!title) {
    if (variant === "error") title = "FIM DE JOGO";
    else if (variant === "paused") title = "PAUSADO";
    else if (gameRunning) title = "JOGANDO";
    else title = "PRONTO";
  }

  headlineEl.textContent = title;

  if (variant === "error") {
    statusEl.classList.add("is-error");
    return;
  }

  if (variant === "paused") {
    statusEl.classList.add("is-paused");
    return;
  }

  statusEl.classList.add("is-ok");
}

function setPlayingUi(isPlaying) {
  painelJogoEl.classList.toggle("jogando", isPlaying);
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function clearLoop() {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
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
  paused = false;
  food = spawnFood();
  updateHud();
  draw();
}

function updateHud() {
  scoreEl.textContent = String(score);
  highScoreEl.textContent = String(highScore);
}

function drawBoard() {
  ctx.fillStyle = "#061106";
  ctx.fillRect(0, 0, BOARD_PX, BOARD_PX);

  ctx.strokeStyle = "rgba(54, 146, 58, 0.25)";
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

    const tone = index === 0 ? "#9dff71" : "#52e14b";
    ctx.fillStyle = tone;
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

  ctx.fillStyle = "#ff5252";
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
  clearLoop();
  gameTimer = setInterval(step, tickMs);
}

function startGame() {
  resetGame();
  hasStarted = true;
  gameRunning = true;
  startBtn.textContent = "NOVO JOGO";
  pauseBtn.disabled = false;
  pauseBtn.textContent = "PAUSAR";
  setStatus("Boa sorte!", "ok", "JOGANDO");
  setPlayingUi(true);
  scheduleLoop();
}

function stopGame() {
  gameRunning = false;
  paused = false;
  clearLoop();
  pauseBtn.textContent = "JOGAR DE NOVO";
  pauseBtn.disabled = !hasStarted;
  setPlayingUi(false);
}

function pauseGame() {
  if (!gameRunning) return;
  paused = true;
  gameRunning = false;
  clearLoop();
  pauseBtn.textContent = "CONTINUAR";
  setStatus("Jogo pausado.", "paused", "PAUSADO");
  setPlayingUi(false);
}

function resumeGame() {
  if (!paused || !hasStarted) return;
  paused = false;
  gameRunning = true;
  pauseBtn.textContent = "PAUSAR";
  setStatus("Boa sorte!", "ok", "JOGANDO");
  setPlayingUi(true);
  scheduleLoop();
}

function togglePause() {
  if (!hasStarted) return;
  if (!gameRunning && !paused) {
    startGame();
    return;
  }
  if (gameRunning) {
    pauseGame();
    return;
  }
  if (paused) {
    resumeGame();
  }
}

function gameOver() {
  stopGame();
  setStatus("Fim de jogo. Toque em Novo Jogo.", "error", "FIM DE JOGO");
}

function setDirection(next) {
  if (!gameRunning) return;

  if (next.x === -pendingDirection.x && next.y === -pendingDirection.y) {
    return;
  }

  pendingDirection = next;
}

function increaseSpeed() {
  const nextTick = Math.max(72, 160 - score * 2);
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
      setStatus("Você venceu!", "ok", "VITÓRIA");
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

function setDirectionByName(dir) {
  if (dir === "up") setDirection({ x: 0, y: -1 });
  if (dir === "down") setDirection({ x: 0, y: 1 });
  if (dir === "left") setDirection({ x: -1, y: 0 });
  if (dir === "right") setDirection({ x: 1, y: 0 });
}

function onTouchStart(event) {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}

function onTouchEnd(event) {
  if (!touchStart || !gameRunning) return;

  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (Math.max(absX, absY) < 18) return;

  if (absX > absY) {
    setDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
  } else {
    setDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
  }

  touchStart = null;
}

function bindControls() {
  document.addEventListener("keydown", onKeyDown);

  controlButtons.forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      setDirectionByName(button.dataset.dir);
    });
  });

  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });

  startBtn.addEventListener("click", startGame);
  pauseBtn.addEventListener("click", togglePause);
}

async function init() {
  highScore = loadHighScore();
  score = 0;
  updateHud();
  drawBoard();

  pieceImages = await discoverPieceImages();

  if (pieceImages.length) {
    piecesCountEl.textContent = `${pieceImages.length} imagens carregadas em /pieces.`;
    setStatus("Imagens prontas. Toque em Novo Jogo.", "ok", "PRONTO");
  } else {
    piecesCountEl.textContent = "Nenhuma imagem encontrada em /pieces.";
    setStatus("Sem imagens. Usando bolinha padrão.", "ok", "PRONTO");
  }

  setPlayingUi(false);
  startBtn.disabled = false;
  bindControls();
}

init().catch(() => {
  setStatus("Erro ao carregar jogo. Recarregue a página.", "error", "ERRO");
  piecesCountEl.textContent = "Falha ao carregar recursos.";
  startBtn.disabled = true;
  pauseBtn.disabled = true;
});
