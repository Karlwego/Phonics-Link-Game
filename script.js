const LEVELS = [
  {
    id: "long-vowels",
    name: "长元音",
    shortHint: "A / E / I / O / U 长元音家族",
    description: "把属于同一长元音发音家族的字母组合连起来。",
    completeMessage: "长元音关卡完成了，下一关是 R 组合。",
    groups: [
      { key: "A", label: "A", tokens: ["A", "ai", "ay", "a-e", "eigh"] },
      { key: "E", label: "E", tokens: ["E", "e-e", "ee", "ea", "ie", "Y"] },
      { key: "I", label: "I", tokens: ["I", "i-e", "igh", "ie", "Y"] },
      { key: "O", label: "O", tokens: ["O", "o-e", "oa", "ol"] },
      { key: "U", label: "U", tokens: ["U", "u-e", "ui", "ue", "ew"] },
    ],
  },
  {
    id: "r-combos",
    name: "R组合",
    shortHint: "带 R 的常见发音组合",
    description: "把属于同一 R 组合发音家族的字母组合连起来。",
    completeMessage: "R 组合关卡完成了，下一关是 L 组合。",
    groups: [
      { key: "啊", label: "啊", tokens: ["啊", "ar"] },
      { key: "哦", label: "哦", tokens: ["哦", "or", "ore", "oar"] },
      { key: "饿", label: "饿", tokens: ["饿", "er", "ir", "ur"] },
      { key: "e尔", label: "e尔", tokens: ["e尔", "air", "are"] },
      { key: "E尔", label: "E尔", tokens: ["E尔", "eer", "ear", "ere"] },
    ],
  },
  {
    id: "l-combos",
    name: "L组合",
    shortHint: "带 L 的常见发音组合",
    description: "把属于同一 L 组合发音家族的字母组合连起来。",
    completeMessage: "L 组合关卡完成了，下一关是奇葩元音组合。",
    groups: [
      { key: "哦", label: "哦", tokens: ["哦", "al", "all"] },
      { key: "O", label: "O", tokens: ["O", "ol", "oll", "oal"] },
      { key: "L", label: "L", tokens: ["L", "el", "ell"] },
      { key: "i偶", label: "i偶", tokens: ["i偶", "il", "ill"] },
      { key: "u偶", label: "u偶", tokens: ["u偶", "ul", "ull"] },
      { key: "A偶", label: "A偶", tokens: ["A偶", "ale", "ail"] },
      { key: "E偶", label: "E偶", tokens: ["E偶", "eal", "eel"] },
      { key: "I偶", label: "I偶", tokens: ["I偶", "ile"] },
      { key: "U偶", label: "U偶", tokens: ["U偶", "uel", "ule", "ewl"] },
    ],
  },
  {
    id: "odd-vowels",
    name: "奇葩元音组合",
    shortHint: "不规则元音与特殊组合",
    description: "把属于同一奇葩元音发音家族的字母组合连起来。",
    completeMessage: "奇葩元音组合关卡完成了，所有关卡都通关了。",
    groups: [
      { key: "哦", label: "哦", tokens: ["哦", "aw", "au"] },
      { key: "哦以", label: "哦以", tokens: ["哦以", "oi", "oy"] },
      { key: "奥", label: "奥", tokens: ["奥", "ou", "ow"] },
      { key: "呜", label: "呜", tokens: ["呜", "oo"] },
      { key: "吮", label: "吮", tokens: ["吮", "tion", "sion", "cien", "tien"] },
    ],
  },
];

const BOARD_ROWS = 6;
const BOARD_COLS = 8;
const TOTAL_TILES = BOARD_ROWS * BOARD_COLS;
const INITIAL_HINTS = 3;
const SCORE_PER_MATCH = 200;
const LEVEL_TIME_LIMIT_SECONDS = 120;
const COMBO_BONUS_STEP = 50;
const COMBO_BONUS_START = 3;
const COMBO_BREAK_MISSES = 2;
const TIME_BONUS_PER_SECOND = 10;

const boardElement = document.querySelector("#board");
const canvas = document.querySelector("#link-canvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const remainingElement = document.querySelector("#remaining");
const hintsElement = document.querySelector("#hints");
const timerElement = document.querySelector("#timer");
const comboElement = document.querySelector("#combo");
const messageElement = document.querySelector("#message");
const groupsListElement = document.querySelector("#groups-list");
const levelDescriptionElement = document.querySelector("#level-description");
const levelNameElement = document.querySelector("#level-name");
const subtitleElement = document.querySelector("#subtitle");
const levelSwitcherElement = document.querySelector("#level-switcher");
const floatingTextLayer = document.querySelector("#floating-text-layer");
const summaryOverlay = document.querySelector("#summary-overlay");
const summaryTagElement = document.querySelector("#summary-tag");
const summaryTitleElement = document.querySelector("#summary-title");
const summaryMessageElement = document.querySelector("#summary-message");
const summaryBaseScoreElement = document.querySelector("#summary-base-score");
const summaryComboScoreElement = document.querySelector("#summary-combo-score");
const summaryTimeScoreElement = document.querySelector("#summary-time-score");
const summaryTotalScoreElement = document.querySelector("#summary-total-score");
const summaryPrimaryButton = document.querySelector("#summary-primary-btn");
const summarySecondaryButton = document.querySelector("#summary-secondary-btn");
const newGameButton = document.querySelector("#new-game-btn");
const shuffleButton = document.querySelector("#shuffle-btn");
const hintButton = document.querySelector("#hint-btn");
const skipButton = document.querySelector("#skip-btn");
const soundButton = document.querySelector("#sound-btn");

let tiles = [];
let selectedTileId = null;
let score = 0;
let hints = INITIAL_HINTS;
let currentLevelIndex = 0;
let timeRemaining = LEVEL_TIME_LIMIT_SECONDS;
let timerId = null;
let comboStreak = 0;
let missesSinceSuccess = 0;
let gameActive = true;
let summaryVisible = false;
let levelStats = createEmptyLevelStats();
let pendingSummaryAction = null;
let soundEnabled = true;
let audioContext = null;
let audioUnlocked = false;

const SPECIAL_TOKEN_FAMILIES = {
  "long-vowels": {
    ie: ["I", "E"],
    Y: ["I", "E"],
  },
};

function createEmptyLevelStats() {
  return {
    baseScore: 0,
    comboScore: 0,
    timeScore: 0,
  };
}

function getCurrentLevel() {
  return LEVELS[currentLevelIndex];
}

function getTokenFamilyKeys(levelId, token, fallbackFamilyKey) {
  const specialFamilies = SPECIAL_TOKEN_FAMILIES[levelId]?.[token];
  if (!specialFamilies) {
    return [fallbackFamilyKey];
  }

  const families = [...specialFamilies];
  if (!families.includes(fallbackFamilyKey)) {
    families.unshift(fallbackFamilyKey);
  }
  return families;
}

function tileSharesFamily(firstTile, secondTile) {
  if (!firstTile || !secondTile) {
    return false;
  }

  return firstTile.familyKeys.some((familyKey) => secondTile.familyKeys.includes(familyKey));
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function setMessage(text) {
  messageElement.textContent = text;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getComboBonus(streak) {
  if (streak < COMBO_BONUS_START) {
    return 0;
  }

  return (streak - COMBO_BONUS_START + 1) * COMBO_BONUS_STEP;
}

function updateSoundButton() {
  soundButton.textContent = `声音: ${soundEnabled ? "开" : "关"}`;
}

function getAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  return audioContext;
}

function unlockAudio() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  audioUnlocked = true;
}

function createGainNode(context, value, destination = context.destination) {
  const gainNode = context.createGain();
  gainNode.gain.value = value;
  gainNode.connect(destination);
  return gainNode;
}

function playMatchSound() {
  if (!soundEnabled) {
    return;
  }

  const context = getAudioContext();
  if (!context || !audioUnlocked) {
    return;
  }

  const start = context.currentTime;
  const master = createGainNode(context, 0.18);

  const laser = context.createOscillator();
  laser.type = "sawtooth";
  laser.frequency.setValueAtTime(2100, start);
  laser.frequency.exponentialRampToValueAtTime(520, start + 0.16);

  const laserGain = createGainNode(context, 0, master);
  laserGain.gain.setValueAtTime(0.001, start);
  laserGain.gain.exponentialRampToValueAtTime(0.9, start + 0.01);
  laserGain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

  const body = context.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(980, start);
  body.frequency.exponentialRampToValueAtTime(420, start + 0.2);

  const bodyGain = createGainNode(context, 0, master);
  bodyGain.gain.setValueAtTime(0.001, start);
  bodyGain.gain.exponentialRampToValueAtTime(0.28, start + 0.015);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

  laser.connect(laserGain);
  body.connect(bodyGain);
  laser.start(start);
  body.start(start);
  laser.stop(start + 0.2);
  body.stop(start + 0.22);
}

function playComboExplosionSound() {
  if (!soundEnabled) {
    return;
  }

  const context = getAudioContext();
  if (!context || !audioUnlocked) {
    return;
  }

  const start = context.currentTime;
  const master = createGainNode(context, 0.16);

  const bufferSize = Math.floor(context.sampleRate * 0.22);
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    const progress = i / bufferSize;
    const decay = Math.exp(-7 * progress);
    data[i] = (Math.random() * 2 - 1) * decay;
  }

  const noise = context.createBufferSource();
  noise.buffer = buffer;

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, start);
  filter.frequency.exponentialRampToValueAtTime(180, start + 0.22);

  const noiseGain = createGainNode(context, 0, master);
  noiseGain.gain.setValueAtTime(0.001, start);
  noiseGain.gain.exponentialRampToValueAtTime(0.9, start + 0.01);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

  noise.connect(filter);
  filter.connect(noiseGain);
  noise.start(start);

  const thump = context.createOscillator();
  thump.type = "triangle";
  thump.frequency.setValueAtTime(180, start);
  thump.frequency.exponentialRampToValueAtTime(60, start + 0.18);

  const thumpGain = createGainNode(context, 0, master);
  thumpGain.gain.setValueAtTime(0.001, start);
  thumpGain.gain.exponentialRampToValueAtTime(0.6, start + 0.015);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

  thump.connect(thumpGain);
  thump.start(start);
  thump.stop(start + 0.2);
}

function playErrorSound() {
  if (!soundEnabled) {
    return;
  }

  const context = getAudioContext();
  if (!context || !audioUnlocked) {
    return;
  }

  const start = context.currentTime;
  const master = createGainNode(context, 0.1);

  [0, 0.16].forEach((offset) => {
    const oscillator = context.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(180 + offset * 80, start + offset);

    const gain = createGainNode(context, 0, master);
    gain.gain.setValueAtTime(0.001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.5, start + offset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.11);

    oscillator.connect(gain);
    oscillator.start(start + offset);
    oscillator.stop(start + offset + 0.12);
  });
}

function playWinSound() {
  if (!soundEnabled) {
    return;
  }

  const context = getAudioContext();
  if (!context || !audioUnlocked) {
    return;
  }

  const start = context.currentTime;
  const master = createGainNode(context, 0.12);
  const clapTimes = [0, 0.12, 0.26, 0.42, 0.58, 0.78];

  clapTimes.forEach((offset, index) => {
    const bufferSize = Math.floor(context.sampleRate * 0.08);
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      const decay = Math.exp((-10 * i) / bufferSize);
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;

    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1600 + index * 140;
    filter.Q.value = 0.8;

    const gain = createGainNode(context, 0.22, master);
    source.connect(filter);
    filter.connect(gain);
    source.start(start + offset);
  });
}

function updateHeader() {
  const level = getCurrentLevel();
  levelNameElement.textContent = level.name;
  subtitleElement.textContent = `当前是${level.name}关卡。${level.description}遵循传统连连看规则，路径最多只能拐两次。每关限时 2 分钟。`;
  levelDescriptionElement.textContent = `${level.shortHint}，3 连击起每次额外加分，剩余时间每秒可换 10 分。`;
  updateSoundButton();
}

function renderLevelSwitcher() {
  levelSwitcherElement.innerHTML = "";

  LEVELS.forEach((level, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-pill";
    if (index === currentLevelIndex) {
      button.classList.add("active");
    }
    button.innerHTML = `<strong>第 ${index + 1} 关 · ${level.name}</strong><span>${level.shortHint}</span>`;
    button.addEventListener("click", () => switchLevel(index));
    levelSwitcherElement.appendChild(button);
  });
}

function renderGroups() {
  const level = getCurrentLevel();
  groupsListElement.innerHTML = "";

  for (const group of level.groups) {
    const item = document.createElement("li");
    item.textContent = `${group.label}: ${group.tokens.join(" / ")}`;
    groupsListElement.appendChild(item);
  }

  if (level.id === "long-vowels") {
    const item = document.createElement("li");
    item.textContent = `特殊双归属: ie / Y 可同时与 I 家族和 E 家族配对`;
    groupsListElement.appendChild(item);
  }
}

function buildDeck() {
  const groups = getCurrentLevel().groups;
  const groupKeys = groups.map((group) => group.key);
  const familyAssignments = [];

  while (familyAssignments.length < TOTAL_TILES / 2) {
    familyAssignments.push(groupKeys[familyAssignments.length % groupKeys.length]);
  }

  const pairFamilies = shuffle([...familyAssignments]);
  const deck = [];
  const familyTileCounts = new Map();

  pairFamilies.forEach((familyKey) => {
    familyTileCounts.set(familyKey, (familyTileCounts.get(familyKey) ?? 0) + 2);
  });

  let pairIndex = 0;
  familyTileCounts.forEach((tileCount, familyKey) => {
    const group = groups.find((item) => item.key === familyKey);
    const familyTokens = [];

    for (let index = 0; index < tileCount; index += 1) {
      familyTokens.push(group.tokens[index % group.tokens.length]);
    }

    shuffle(familyTokens);

    for (let index = 0; index < familyTokens.length; index += 2) {
      let firstToken = familyTokens[index];
      let secondToken = familyTokens[index + 1];

      if (firstToken === secondToken) {
        const swapIndex = familyTokens.findIndex(
          (token, tokenIndex) => tokenIndex > index + 1 && token !== firstToken,
        );

        if (swapIndex !== -1) {
          [familyTokens[index + 1], familyTokens[swapIndex]] = [familyTokens[swapIndex], familyTokens[index + 1]];
          secondToken = familyTokens[index + 1];
        }
      }

      deck.push(
        { pairId: pairIndex, familyKey, token: firstToken },
        { pairId: pairIndex, familyKey, token: secondToken },
      );
      pairIndex += 1;
    }
  });

  const levelId = getCurrentLevel().id;
  return shuffle(deck).map((tile, index) => {
    const familyKeys = getTokenFamilyKeys(levelId, tile.token, tile.familyKey);
    return {
      ...tile,
      familyKeys,
      special: familyKeys.length > 1,
      id: index,
      row: Math.floor(index / BOARD_COLS),
      col: index % BOARD_COLS,
      removed: false,
    };
  });
}

function isTokenDistributionSolvable(tileSet) {
  const familyCounts = new Map();

  tileSet.forEach((tile) => {
    if (tile.removed) {
      return;
    }

    if (!familyCounts.has(tile.familyKey)) {
      familyCounts.set(tile.familyKey, new Map());
    }

    const tokenCounts = familyCounts.get(tile.familyKey);
    tokenCounts.set(tile.token, (tokenCounts.get(tile.token) ?? 0) + 1);
  });

  for (const tokenCounts of familyCounts.values()) {
    let total = 0;
    let maxCount = 0;

    for (const count of tokenCounts.values()) {
      total += count;
      if (count > maxCount) {
        maxCount = count;
      }
    }

    if (maxCount > total / 2) {
      return false;
    }
  }

  return true;
}

function resizeCanvas() {
  const rect = boardElement.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  clearPath();
}

function clearPath() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function updateStats() {
  scoreElement.textContent = String(score);
  remainingElement.textContent = String(tiles.filter((tile) => !tile.removed).length);
  hintsElement.textContent = String(hints);
  timerElement.textContent = formatTime(timeRemaining);

  const comboBonus = getComboBonus(comboStreak);
  comboElement.textContent = comboBonus > 0 ? `${comboStreak} (+${comboBonus})` : String(comboStreak);
  timerElement.classList.toggle("warning", timeRemaining <= 20);
}

function startTimer() {
  stopTimer();
  timerId = window.setInterval(() => {
    if (!gameActive) {
      return;
    }

    timeRemaining -= 1;
    updateStats();

    if (timeRemaining <= 0) {
      timeRemaining = 0;
      updateStats();
      handleTimeUp();
    }
  }, 1000);
}

function showFloatingText(text, x, y, variant = "combo-pop") {
  const floatNode = document.createElement("div");
  floatNode.className = `floating-text ${variant}`;
  floatNode.textContent = text;
  floatNode.style.left = `${x}px`;
  floatNode.style.top = `${y}px`;
  floatingTextLayer.appendChild(floatNode);
  window.setTimeout(() => floatNode.remove(), 1000);
}

function hideSummary() {
  summaryVisible = false;
  summaryOverlay.classList.add("hidden");
  summaryOverlay.setAttribute("aria-hidden", "true");
  pendingSummaryAction = null;
}

function showSummary({
  tag,
  title,
  message,
  primaryText,
  secondaryText,
  onPrimary,
  onSecondary,
}) {
  summaryVisible = true;
  summaryTagElement.textContent = tag;
  summaryTitleElement.textContent = title;
  summaryMessageElement.textContent = message;
  summaryBaseScoreElement.textContent = String(levelStats.baseScore);
  summaryComboScoreElement.textContent = String(levelStats.comboScore);
  summaryTimeScoreElement.textContent = String(levelStats.timeScore);
  summaryTotalScoreElement.textContent = String(levelStats.baseScore + levelStats.comboScore + levelStats.timeScore);
  summaryPrimaryButton.textContent = primaryText;
  summarySecondaryButton.textContent = secondaryText;
  pendingSummaryAction = { onPrimary, onSecondary };
  summaryOverlay.classList.remove("hidden");
  summaryOverlay.setAttribute("aria-hidden", "false");
}

function renderBoard() {
  boardElement.style.gridTemplateColumns = `repeat(${BOARD_COLS}, minmax(0, 1fr))`;
  boardElement.style.gridTemplateRows = `repeat(${BOARD_ROWS}, minmax(0, 1fr))`;
  boardElement.innerHTML = "";

  tiles.forEach((tile) => {
    const button = document.createElement("button");
    button.className = "tile";
    button.dataset.id = String(tile.id);
    button.dataset.row = String(tile.row);
    button.dataset.col = String(tile.col);
    button.type = "button";

    if (tile.removed || !gameActive || summaryVisible) {
      if (tile.removed) {
        button.classList.add("removed");
      }
      button.disabled = true;
      if (tile.removed) {
        button.tabIndex = -1;
        button.setAttribute("aria-hidden", "true");
      }
    } else {
      if (tile.special) {
        button.classList.add("special");
      }
      button.innerHTML = `
        <span class="token">${tile.token}</span>
      `;
      button.addEventListener("click", () => handleTileClick(tile.id));
    }

    if (!tile.removed && selectedTileId === tile.id) {
      button.classList.add("selected");
    }

    boardElement.appendChild(button);
  });

  resizeCanvas();
  updateStats();
}

function createGrid() {
  const grid = Array.from({ length: BOARD_ROWS + 2 }, () =>
    Array.from({ length: BOARD_COLS + 2 }, () => 0),
  );

  tiles.forEach((tile) => {
    if (!tile.removed) {
      grid[tile.row + 1][tile.col + 1] = 1;
    }
  });

  return grid;
}

function canPair(firstTile, secondTile) {
  if (!firstTile || !secondTile) {
    return false;
  }

  if (firstTile.id === secondTile.id || firstTile.removed || secondTile.removed) {
    return false;
  }

  return tileSharesFamily(firstTile, secondTile);
}

function findPath(firstTile, secondTile) {
  if (!canPair(firstTile, secondTile)) {
    return null;
  }

  const grid = createGrid();
  const start = { row: firstTile.row + 1, col: firstTile.col + 1 };
  const end = { row: secondTile.row + 1, col: secondTile.col + 1 };
  const directions = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];
  const queue = [
    {
      row: start.row,
      col: start.col,
      direction: -1,
      turns: -1,
      path: [{ row: start.row, col: start.col }],
    },
  ];
  const visited = new Map();

  while (queue.length > 0) {
    const current = queue.shift();

    for (let direction = 0; direction < directions.length; direction += 1) {
      const nextTurns = current.direction === direction ? current.turns : current.turns + 1;
      if (nextTurns > 2) {
        continue;
      }

      let nextRow = current.row + directions[direction].dr;
      let nextCol = current.col + directions[direction].dc;

      while (
        nextRow >= 0 &&
        nextRow < BOARD_ROWS + 2 &&
        nextCol >= 0 &&
        nextCol < BOARD_COLS + 2
      ) {
        if (grid[nextRow][nextCol] === 1 && !(nextRow === end.row && nextCol === end.col)) {
          break;
        }

        const visitKey = `${nextRow},${nextCol},${direction}`;
        const bestTurns = visited.get(visitKey);

        if (bestTurns === undefined || bestTurns > nextTurns) {
          const nextPath = [...current.path, { row: nextRow, col: nextCol }];
          visited.set(visitKey, nextTurns);

          if (nextRow === end.row && nextCol === end.col) {
            return compressPath(nextPath);
          }

          queue.push({
            row: nextRow,
            col: nextCol,
            direction,
            turns: nextTurns,
            path: nextPath,
          });
        }

        nextRow += directions[direction].dr;
        nextCol += directions[direction].dc;
      }
    }
  }

  return null;
}

function compressPath(path) {
  if (path.length <= 2) {
    return path;
  }

  const compact = [path[0]];

  for (let i = 1; i < path.length - 1; i += 1) {
    const prev = compact[compact.length - 1];
    const current = path[i];
    const next = path[i + 1];
    const sameRow = prev.row === current.row && current.row === next.row;
    const sameCol = prev.col === current.col && current.col === next.col;

    if (!sameRow && !sameCol) {
      compact.push(current);
    }
  }

  compact.push(path[path.length - 1]);
  return compact;
}

function getTileCenter(point) {
  if (point.row === 0 || point.row === BOARD_ROWS + 1 || point.col === 0 || point.col === BOARD_COLS + 1) {
    const rect = boardElement.getBoundingClientRect();
    const cellWidth = rect.width / BOARD_COLS;
    const cellHeight = rect.height / BOARD_ROWS;
    return {
      x: (point.col - 0.5) * cellWidth,
      y: (point.row - 0.5) * cellHeight,
    };
  }

  const selector = `.tile[data-row="${point.row - 1}"][data-col="${point.col - 1}"]`;
  const tileElement = boardElement.querySelector(selector);
  const boardRect = boardElement.getBoundingClientRect();
  const tileRect = tileElement.getBoundingClientRect();

  return {
    x: tileRect.left - boardRect.left + tileRect.width / 2,
    y: tileRect.top - boardRect.top + tileRect.height / 2,
  };
}

function drawPath(path) {
  clearPath();
  if (!path) {
    return;
  }

  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#ff8c42";
  ctx.shadowColor = "rgba(255, 140, 66, 0.35)";
  ctx.shadowBlur = 16;

  ctx.beginPath();
  path.forEach((point, index) => {
    const center = getTileCenter(point);
    if (index === 0) {
      ctx.moveTo(center.x, center.y);
    } else {
      ctx.lineTo(center.x, center.y);
    }
  });
  ctx.stroke();
}

function findAnyMatch() {
  const activeTiles = tiles.filter((tile) => !tile.removed);
  for (let i = 0; i < activeTiles.length; i += 1) {
    for (let j = i + 1; j < activeTiles.length; j += 1) {
      if (!tileSharesFamily(activeTiles[i], activeTiles[j])) {
        continue;
      }

      const path = findPath(activeTiles[i], activeTiles[j]);
      if (path) {
        return { first: activeTiles[i], second: activeTiles[j], path };
      }
    }
  }

  return null;
}

function resetComboState() {
  comboStreak = 0;
  missesSinceSuccess = 0;
}

function registerMismatch() {
  if (comboStreak === 0) {
    return false;
  }

  missesSinceSuccess += 1;
  if (missesSinceSuccess >= COMBO_BREAK_MISSES) {
    comboStreak = 0;
    missesSinceSuccess = 0;
    updateStats();
    return true;
  }

  return false;
}

function applyTimeBonus() {
  const timeScore = timeRemaining * TIME_BONUS_PER_SECOND;
  levelStats.timeScore = timeScore;
  score += timeScore;
  updateStats();

  const boardRect = boardElement.getBoundingClientRect();
  showFloatingText(`时间奖励 +${timeScore}`, boardRect.width / 2, 80, "time-pop");
}

function handleTimeUp() {
  stopTimer();
  gameActive = false;
  selectedTileId = null;
  clearPath();
  renderBoard();
  setMessage("时间到，本关挑战结束。");

  const canAdvance = currentLevelIndex < LEVELS.length - 1;
  showSummary({
    tag: `第 ${currentLevelIndex + 1} 关`,
    title: `${getCurrentLevel().name}挑战结束`,
    message: canAdvance
      ? "时间已经用完了。这一关的基础分和连击分已结算。你可以直接进入下一关继续练习，也可以重开本关。"
      : "时间已经用完了。这一关的基础分和连击分已结算。你可以重开本关，或者从第一关再练一轮。",
    primaryText: canAdvance ? "进入下一关" : "从第一关再来",
    secondaryText: "重开本关",
    onPrimary: () => {
      if (canAdvance) {
        currentLevelIndex += 1;
        startGame(false);
        return;
      }

      currentLevelIndex = 0;
      startGame(true);
    },
    onSecondary: () => {
      startGame(true);
    },
  });
}

function maybeAdvanceLevel() {
  const level = getCurrentLevel();
  stopTimer();
  gameActive = false;
  applyTimeBonus();
  playWinSound();

  if (currentLevelIndex < LEVELS.length - 1) {
    setMessage(level.completeMessage);
    showSummary({
      tag: `第 ${currentLevelIndex + 1} 关完成`,
      title: `${level.name}通关`,
      message: `${level.completeMessage} 剩余时间已经按每秒 10 分结算进总分。`,
      primaryText: "进入下一关",
      secondaryText: "重开本关",
      onPrimary: () => {
        currentLevelIndex += 1;
        startGame(false);
      },
      onSecondary: () => startGame(true),
    });
    return;
  }

  setMessage(`${level.completeMessage} 最终得分 ${score}。`);
  showSummary({
    tag: "全部通关",
    title: "恭喜全部通关",
    message: `你完成了全部 ${LEVELS.length} 个关卡，剩余时间奖励也已经结算。最终总分是 ${score}。`,
    primaryText: "从第一关再来",
    secondaryText: "重开当前关",
    onPrimary: () => {
      currentLevelIndex = 0;
      startGame(true);
    },
    onSecondary: () => startGame(true),
  });
}

function handleSkipLevel() {
  if (!gameActive || summaryVisible) {
    return;
  }

  stopTimer();
  gameActive = false;
  selectedTileId = null;
  clearPath();
  renderBoard();

  const level = getCurrentLevel();
  setMessage(`${level.name}的核心规则已经练习过了，进入下一关继续。`);

  if (currentLevelIndex < LEVELS.length - 1) {
    showSummary({
      tag: `第 ${currentLevelIndex + 1} 关练习完成`,
      title: `${level.name}已完成练习`,
      message: "你选择直接进入下一关。当前已经获得的基础分和连击分会保留，但这次不会结算剩余时间奖励。",
      primaryText: "进入下一关",
      secondaryText: "重开本关",
      onPrimary: () => {
        currentLevelIndex += 1;
        startGame(false);
      },
      onSecondary: () => startGame(true),
    });
    return;
  }

  showSummary({
    tag: "全部练习完成",
    title: "本轮练习已完成",
    message: `你已经完成了当前所有关卡的练习。最终累计得分是 ${score}。`,
    primaryText: "从第一关再来",
    secondaryText: "重开当前关",
    onPrimary: () => {
      currentLevelIndex = 0;
      startGame(true);
    },
    onSecondary: () => startGame(true),
  });
}

function removeMatch(firstTile, secondTile, path) {
  drawPath(path);

  window.setTimeout(() => {
    const first = tiles.find((tile) => tile.id === firstTile.id);
    const second = tiles.find((tile) => tile.id === secondTile.id);
    if (!first || !second) {
      return;
    }

    first.removed = true;
    second.removed = true;
    selectedTileId = null;
    comboStreak += 1;
    missesSinceSuccess = 0;

    const comboBonus = getComboBonus(comboStreak);
    score += SCORE_PER_MATCH + comboBonus;
    levelStats.baseScore += SCORE_PER_MATCH;
    levelStats.comboScore += comboBonus;
    playMatchSound();

    const lastPoint = path[path.length - 1];
    const center = getTileCenter(lastPoint);
    showFloatingText(`+${SCORE_PER_MATCH}`, center.x, center.y - 12, "combo-pop");
    if (comboBonus > 0) {
      playComboExplosionSound();
      showFloatingText(`COMBO +${comboBonus}`, center.x, center.y - 48, "combo-pop");
    }

    clearPath();
    renderBoard();

    if (tiles.every((tile) => tile.removed)) {
      maybeAdvanceLevel();
      return;
    }

    const available = findAnyMatch();
    if (!available) {
      setMessage("消除成功，但当前没有可连接组合了，试试点击“洗牌”。");
      return;
    }

    if (comboBonus > 0) {
      setMessage(`消除成功，${comboStreak} 连击达成，本次额外奖励 ${comboBonus} 分。`);
    } else {
      setMessage("消除成功，继续寻找同一发音家族吧。");
    }
  }, 260);
}

function highlightHint(firstId, secondId) {
  [firstId, secondId].forEach((id) => {
    const tileElement = boardElement.querySelector(`.tile[data-id="${id}"]`);
    if (!tileElement) {
      return;
    }

    tileElement.classList.add("hint");
    window.setTimeout(() => tileElement.classList.remove("hint"), 1800);
  });
}

function handleTileClick(tileId) {
  if (!gameActive || summaryVisible) {
    return;
  }

  const clickedTile = tiles.find((tile) => tile.id === tileId);
  if (!clickedTile || clickedTile.removed) {
    return;
  }

  if (selectedTileId === null) {
    selectedTileId = tileId;
    renderBoard();
    setMessage(`已选择 ${clickedTile.token}，再选一个同发音家族的方块。`);
    return;
  }

  if (selectedTileId === tileId) {
    selectedTileId = null;
    renderBoard();
    setMessage("已取消选择。");
    return;
  }

  const selectedTile = tiles.find((tile) => tile.id === selectedTileId);

  if (!canPair(selectedTile, clickedTile)) {
    const comboBroken = registerMismatch();
    playErrorSound();
    selectedTileId = tileId;
    renderBoard();
    if (comboBroken) {
      setMessage("连续两次没能配对，combo 已中断，我帮你切换到了新的选择。");
    } else if (comboStreak > 0) {
      setMessage("这两个不属于同一发音家族，combo 风险增加了。");
    } else {
      setMessage("这两个不属于同一发音家族，我帮你切换到了新的选择。");
    }
    return;
  }

  const path = findPath(selectedTile, clickedTile);
  if (!path) {
    const comboBroken = registerMismatch();
    playErrorSound();
    selectedTileId = tileId;
    renderBoard();
    if (comboBroken) {
      setMessage("连续两次没能配对，combo 已中断，这一对虽然同家族但线路不通。");
    } else if (comboStreak > 0) {
      setMessage("它们发音匹配，但线路被挡住了，再失误一次 combo 就会断。");
    } else {
      setMessage("它们发音匹配，但当前线路被挡住了，换一对试试看。");
    }
    return;
  }

  removeMatch(selectedTile, clickedTile, path);
}

function shuffleRemainingTiles() {
  const activeTiles = tiles.filter((tile) => !tile.removed).map((tile) => ({
    familyKey: tile.familyKey,
    familyKeys: [...tile.familyKeys],
    special: tile.special,
    token: tile.token,
  }));

  if (activeTiles.length <= 2) {
    return;
  }

  shuffle(activeTiles);
  let activeIndex = 0;

  tiles = tiles.map((tile) => {
    if (tile.removed) {
      return tile;
    }

    const replacement = activeTiles[activeIndex];
    activeIndex += 1;
    return {
      ...tile,
      familyKey: replacement.familyKey,
      familyKeys: [...replacement.familyKeys],
      special: replacement.special,
      token: replacement.token,
    };
  });

  selectedTileId = null;
  renderBoard();
}

function ensurePlayableBoard() {
  let safetyCounter = 0;

  while (safetyCounter < 80) {
    if (isTokenDistributionSolvable(tiles) && findAnyMatch()) {
      return;
    }

    if (!isTokenDistributionSolvable(tiles)) {
      tiles = buildDeck();
      renderBoard();
    } else {
      shuffleRemainingTiles();
    }

    safetyCounter += 1;
  }
}

function startGame(resetScore = true) {
  stopTimer();
  hideSummary();
  gameActive = true;
  if (resetScore) {
    score = 0;
  }
  hints = INITIAL_HINTS;
  timeRemaining = LEVEL_TIME_LIMIT_SECONDS;
  selectedTileId = null;
  levelStats = createEmptyLevelStats();
  resetComboState();
  updateHeader();
  renderLevelSwitcher();
  renderGroups();
  tiles = buildDeck();
  renderBoard();
  ensurePlayableBoard();
  renderBoard();
  startTimer();
  setMessage(`${getCurrentLevel().name}关卡开始了，限时 2 分钟，先找到同一发音家族的两个方块。`);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    unlockAudio();
  }
  updateSoundButton();
}

function switchLevel(levelIndex) {
  currentLevelIndex = levelIndex;
  startGame(true);
}

function useHint() {
  if (!gameActive || summaryVisible) {
    return;
  }

  if (hints <= 0) {
    setMessage("提示次数已经用完了。");
    return;
  }

  const match = findAnyMatch();
  if (!match) {
    setMessage("当前没有可消除组合，先洗牌再继续。");
    return;
  }

  hints -= 1;
  updateStats();
  highlightHint(match.first.id, match.second.id);
  setMessage(`提示：试试 ${match.first.token} 和 ${match.second.token}，它们属于 ${match.first.familyKey} 家族。`);
}

function handleShuffle() {
  if (!gameActive || summaryVisible) {
    return;
  }

  shuffleRemainingTiles();
  ensurePlayableBoard();
  renderBoard();
  setMessage("棋盘已经重新洗牌。");
}

summaryPrimaryButton.addEventListener("click", () => {
  if (!pendingSummaryAction?.onPrimary) {
    return;
  }
  const action = pendingSummaryAction.onPrimary;
  hideSummary();
  action();
});

summarySecondaryButton.addEventListener("click", () => {
  if (!pendingSummaryAction?.onSecondary) {
    return;
  }
  const action = pendingSummaryAction.onSecondary;
  hideSummary();
  action();
});

window.addEventListener("resize", resizeCanvas);
newGameButton.addEventListener("click", () => startGame(true));
shuffleButton.addEventListener("click", handleShuffle);
hintButton.addEventListener("click", useHint);
skipButton.addEventListener("click", handleSkipLevel);
soundButton.addEventListener("click", toggleSound);
window.addEventListener(
  "pointerdown",
  () => {
    unlockAudio();
  },
  { once: true },
);

startGame(true);
