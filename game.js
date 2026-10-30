// @ts-nocheck
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = 360;
const H = 640;
const GROUND = 570;

// Game settings
const GRAVITY = 1150;
const FLAP_POWER = -380;
const PIPE_SPEED = 145;
const PIPE_WIDTH = 58;
const PIPE_GAP = 160;
const PIPE_INTERVAL = 1.55;

// Game state
let state = "ready";
let bird;
let pipes = [];
let score = 0;
let best = 0;
let lastTime = 0;
let spawnTimer = 0;
let animationTime = 0;

// Load saved high score
try {
  best = Number(localStorage.getItem("pixelBirdBest")) || 0;
} catch (e) {
  best = 0;
}

// Reset game
function resetGame() {
  bird = {
    x: 90,
    y: 285,
    velocity: 0,
    rotation: 0
  };

  pipes = [];
  score = 0;
  spawnTimer = 0;
  animationTime = 0;
  state = "ready";
}

// Bird flap
function flap() {
  bird.velocity = FLAP_POWER;
}

// Input
function handleInput(e) {
  if (e) e.preventDefault();

  if (state === "ready") {
    state = "playing";
    flap();
  } else if (state === "playing") {
    flap();
  } else if (state === "over") {
    resetGame();
    state = "playing";
    flap();
  }
}

canvas.addEventListener("pointerdown", handleInput);

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    handleInput();
  }
});

// Create pipes
function createPipe() {
  const minY = 135;
  const maxY = 390;

  const gapY = Math.floor(
    minY + Math.random() * (maxY - minY)
  );

  pipes.push({
    x: W + 10,
    gapY: gapY,
    scored: false
  });
}

// Collision detection
function collides() {
  const bx = bird.x - 12;
  const by = bird.y - 10;
  const bw = 24;
  const bh = 20;

  // Ground and ceiling
  if (by < 0 || by + bh > GROUND) {
    return true;
  }

  for (const p of pipes) {
    const topHeight = p.gapY - PIPE_GAP / 2;
    const bottomY = p.gapY + PIPE_GAP / 2;

    const overlapsX =
      bx + bw > p.x &&
      bx < p.x + PIPE_WIDTH;

    const hitsTop = by < topHeight;
    const hitsBottom = by + bh > bottomY;

    if (overlapsX && (hitsTop || hitsBottom)) {
      return true;
    }
  }

  return false;
}

// Update game
function update(dt) {
  animationTime += dt;

  if (state !== "playing") return;

  // Bird physics
  bird.velocity += GRAVITY * dt;
  bird.y += bird.velocity * dt;

  bird.rotation = Math.min(
    1.1,
    Math.max(-0.5, bird.velocity / 550)
  );

  // Spawn pipes
  spawnTimer += dt;

  if (spawnTimer >= PIPE_INTERVAL) {
    spawnTimer -= PIPE_INTERVAL;
    createPipe();
  }

  // Move pipes
  for (const p of pipes) {
    p.x -= PIPE_SPEED * dt;

    // Score
    if (!p.scored && p.x + PIPE_WIDTH < bird.x) {
      p.scored = true;
      score++;

      if (score > best) {
        best = score;

        try {
          localStorage.setItem(
            "pixelBirdBest",
            String(best)
          );
        } catch (e) {}
      }
    }
  }

  // Remove pipes outside screen
  pipes = pipes.filter(
    p => p.x + PIPE_WIDTH > -10
  );

  // Check collisions
  if (collides()) {
    state = "over";
  }
}

// Pixel rectangle helper
function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.round(x),
    Math.round(y),
    Math.round(w),
    Math.round(h)
  );
}

// Draw background
function drawBackground() {
  rect(0, 0, W, H, "#70c5ce");

  // Sun
  rect(265, 85, 42, 42, "#ffe58a");
  rect(273, 77, 26, 58, "#ffe58a");
  rect(257, 93, 58, 26, "#ffe58a");

  // Clouds
  const cloudOffset = state === "playing"
    ? (animationTime * 15) % 420
    : 0;

  drawCloud(40 - cloudOffset, 135);
  drawCloud(250 - cloudOffset, 205);
  drawCloud(390 - cloudOffset, 100);

  // Distant hills
  rect(0, 455, W, 115, "#9bdc76");

  for (let x = 0; x < W; x += 65) {
    rect(x, 455, 35, 20, "#9bdc76");
    rect(x + 12, 443, 25, 15, "#9bdc76");
  }
}

function drawCloud(x, y) {
  rect(x + 10, y, 35, 15, "#ffffff");
  rect(x, y + 10, 60, 15, "#ffffff");
  rect(x + 20, y - 8, 22, 15, "#ffffff");
}

// Draw pipes
function drawPipe(p) {
  const topHeight = p.gapY - PIPE_GAP / 2;
  const bottomY = p.gapY + PIPE_GAP / 2;

  // Top pipe body
  rect(p.x + 5, 0, PIPE_WIDTH - 10, topHeight, "#58b83c");
  rect(p.x, topHeight - 22, PIPE_WIDTH, 22, "#379c32");

  rect(p.x + 8, 0, 9, topHeight - 22, "#91df55");
  rect(p.x + 42, 0, 8, topHeight - 22, "#287b2c");

  // Bottom pipe body
  rect(p.x + 5, bottomY, PIPE_WIDTH - 10,
       GROUND - bottomY, "#58b83c");

  rect(p.x, bottomY, PIPE_WIDTH, 22, "#379c32");

  rect(p.x + 8, bottomY + 22, 9,
       GROUND - bottomY - 22, "#91df55");

  rect(p.x + 42, bottomY + 22, 8,
       GROUND - bottomY - 22, "#287b2c");

  // Pipe outlines
  ctx.strokeStyle = "#286b2a";
  ctx.lineWidth = 2;

  ctx.strokeRect(
    p.x + 1, topHeight - 22,
    PIPE_WIDTH - 2, 22
  );

  ctx.strokeRect(
    p.x + 1, bottomY,
    PIPE_WIDTH - 2, 22
  );
}

// Draw bird
function drawBird() {
  ctx.save();

  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  // Body shadow
  rect(-15, -7, 31, 22, "#bd741d");

  // Body
  rect(-14, -10, 29, 21, "#ffcf35");
  rect(-10, -14, 19, 5, "#ffe56b");

  // Wing
  const wingMove =
    state === "playing"
      ? Math.sin(animationTime * 22) * 4
      : Math.sin(animationTime * 5) * 2;

  rect(-10, 0 + wingMove, 16, 10, "#e99b24");
  rect(-7, 2 + wingMove, 11, 4, "#ffe56b");

  // Eye
  rect(5, -8, 8, 9, "#ffffff");
  rect(9, -6, 3, 5, "#202020");

  // Beak
  rect(13, 0, 12, 7, "#f26b35");
  rect(18, 4, 8, 4, "#d94b27");

  ctx.restore();
}

// Draw ground
function drawGround() {
  rect(0, GROUND, W, 70, "#ded28b");
  rect(0, GROUND, W, 12, "#77bd42");
  rect(0, GROUND + 12, W, 5, "#4b9437");

  const offset = state === "playing"
    ? (animationTime * PIPE_SPEED) % 32
    : 0;

  for (let x = -32; x < W + 32; x += 32) {
    rect(x - offset, GROUND + 25, 16, 5, "#c5b777");
    rect(x + 12 - offset, GROUND + 43, 12, 5, "#c5b777");
  }
}

// Draw text
function text(str, x, y, size, color = "#ffffff") {
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Pixel-style text shadow
  ctx.fillStyle = "#38545a";
  ctx.fillText(str, x + 2, y + 3);

  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// Draw score
function drawScore() {
  if (state === "playing") {
    text(String(score), W / 2, 65, 42);
  }
}

// Draw start screen
function drawReadyScreen() {
  text("PIXEL BIRD", W / 2, 185, 34, "#ffe56b");
  text("TAP TO START", W / 2, 355, 20);
  text("AVOID THE PIPES!", W / 2, 390, 13);
  text("BEST: " + best, W / 2, 430, 16);
}

// Draw game over
function drawGameOver() {
  rect(35, 190, 290, 225, "#f3e7b0");
  rect(39, 194, 282, 217, "#ffffff");

  text("GAME OVER", W / 2, 230, 27, "#e74b3c");
  text("SCORE: " + score, W / 2, 285, 21, "#333333");
  text("BEST: " + best, W / 2, 325, 17, "#333333");

  rect(85, 355, 190, 40, "#56a832");
  text("TAP TO RETRY", W / 2, 375, 15);
}

// Main drawing
function draw() {
  ctx.clearRect(0, 0, W, H);

  drawBackground();

  for (const p of pipes) {
    drawPipe(p);
  }

  drawGround();
  drawBird();
  drawScore();

  if (state === "ready") {
    drawReadyScreen();
  }

  if (state === "over") {
    drawGameOver();
  }
}

// Game loop
function gameLoop(timestamp) {
  const dt = Math.min(
    (timestamp - lastTime) / 1000 || 0,
    0.033
  );

  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

// Start
resetGame();
requestAnimationFrame(gameLoop);
