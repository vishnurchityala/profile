(function () {
  const modal = document.getElementById('dino-game-modal');
  const openBtn = document.getElementById('open-dino-game');
  const closeBtn = document.getElementById('dino-game-close-btn');
  const closeControl = document.getElementById('dino-game-close-control');
  const backdrop = document.getElementById('dino-game-backdrop');
  const startBtn = document.getElementById('dino-game-start-btn');
  const resetBtn = document.getElementById('dino-game-reset-btn');
  const board = document.getElementById('dino-game-board');
  const scoreEl = document.getElementById('dino-game-score');
  const timeEl = document.getElementById('dino-game-time');
  const stateEl = document.getElementById('dino-game-state');
  const statusEl = document.getElementById('dino-game-status');
  const startBtnLabel = startBtn ? startBtn.querySelector('span') : null;

  if (!modal || !openBtn || !closeBtn || !closeControl || !backdrop || !startBtn || !resetBtn || !board || !scoreEl || !timeEl || !stateEl || !statusEl) {
    return;
  }

  const DINO_ASSETS = [
    'dinos/dino-rainbow.png',
    'dinos/dino-red.png',
    'dinos/dino-orange.png',
    'dinos/dino-yellow.png',
    'dinos/dino-green.png',
    'dinos/dino-blue.png',
    'dinos/dino-black.png',
  ];

  const TARGET_SCORE = 7;
  const TOTAL_SECONDS = 60;
  const HOLE_COUNT = 15;
  const MAX_VISIBLE_DINOS = 2;
  const WAVE_SIZE_MIN = 1;
  const WAVE_SIZE_MAX = 2;
  const WAVE_DELAY_MIN = 480;
  const WAVE_DELAY_MAX = 920;
  const DINO_UP_MIN = 720;
  const DINO_UP_MAX = 1300;

  let holes = [];
  let score = 0;
  let timeLeft = TOTAL_SECONDS;
  let running = false;
  let countdownTimer = null;
  let spawnTimer = null;

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function setStatus(message, variant) {
    statusEl.textContent = message;
    statusEl.classList.remove('is-win', 'is-lose');
    if (variant) {
      statusEl.classList.add(variant);
    }
  }

  function updateHud() {
    scoreEl.textContent = score + ' / ' + TARGET_SCORE;
    timeEl.textContent = timeLeft + 's';
  }

  function setState(label) {
    stateEl.textContent = label;
  }

  function setStartButton(label, disabled) {
    if (startBtnLabel) {
      startBtnLabel.textContent = label;
    }
    startBtn.disabled = disabled;
    startBtn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
  }

  function setControls(mode) {
    if (mode === 'running') {
      setStartButton('RUNNING', true);
      return;
    }
    if (mode === 'complete') {
      setStartButton('PLAY AGAIN', false);
      return;
    }
    setStartButton('START', false);
  }

  function clearHole(hole) {
    const timerId = Number(hole.dataset.hideTimer || '');
    if (Number.isFinite(timerId) && timerId > 0) {
      window.clearTimeout(timerId);
    }
    delete hole.dataset.hideTimer;
    delete hole.dataset.hit;
    hole.classList.remove('is-up', 'is-hit');
  }

  function clearBoard() {
    holes.forEach(clearHole);
  }

  function clearLoopTimers() {
    if (countdownTimer) {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
    }
    if (spawnTimer) {
      window.clearTimeout(spawnTimer);
      spawnTimer = null;
    }
  }

  function finishGame(didWin) {
    running = false;
    clearLoopTimers();
    clearBoard();

    if (didWin) {
      setState('WIN');
      setStatus('Mission cleared. You caught 7 dinos.', 'is-win');
    } else {
      setState('FAILED');
      setStatus('Time up. Catch 7 dinos to win.', 'is-lose');
    }
    setControls('complete');
  }

  function chooseWaveHoles(requestedCount) {
    const closedHoles = holes.filter((hole) => !hole.classList.contains('is-up'));
    if (!closedHoles.length) {
      return [];
    }

    const limit = Math.min(requestedCount, closedHoles.length);
    const shuffled = closedHoles.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  function countVisibleDinos() {
    return holes.filter((hole) => hole.classList.contains('is-up')).length;
  }

  function popFromHole(hole) {
    const dino = hole.querySelector('.dino-pop');
    if (!dino) {
      return;
    }

    const timerId = Number(hole.dataset.hideTimer || '');
    if (Number.isFinite(timerId) && timerId > 0) {
      window.clearTimeout(timerId);
    }

    dino.src = DINO_ASSETS[randomInt(0, DINO_ASSETS.length - 1)];
    hole.dataset.hit = '0';
    hole.classList.remove('is-hit');
    hole.classList.add('is-up');

    const hideTimer = window.setTimeout(() => {
      if (!running || hole.dataset.hit === '1') {
        return;
      }
      hole.classList.remove('is-up');
      delete hole.dataset.hideTimer;
    }, randomInt(DINO_UP_MIN, DINO_UP_MAX));

    hole.dataset.hideTimer = String(hideTimer);
  }

  function spawnWave() {
    const visibleCount = countVisibleDinos();
    if (visibleCount >= MAX_VISIBLE_DINOS) {
      return;
    }

    const availableSlots = MAX_VISIBLE_DINOS - visibleCount;
    const waveSize = Math.min(availableSlots, randomInt(WAVE_SIZE_MIN, WAVE_SIZE_MAX));
    const waveHoles = chooseWaveHoles(waveSize);
    if (!waveHoles.length) {
      return;
    }
    waveHoles.forEach(popFromHole);
  }

  function scheduleSpawn() {
    if (!running) {
      return;
    }

    spawnTimer = window.setTimeout(() => {
      if (!running) {
        return;
      }

      spawnWave();
      scheduleSpawn();
    }, randomInt(WAVE_DELAY_MIN, WAVE_DELAY_MAX));
  }

  function startGame() {
    if (running) {
      return;
    }

    clearLoopTimers();
    clearBoard();
    running = true;
    score = 0;
    timeLeft = TOTAL_SECONDS;
    updateHud();
    setState('RUNNING');
    setStatus('Go. Cave waves are live. Catch 7 dinos before time runs out.');
    setControls('running');

    countdownTimer = window.setInterval(() => {
      if (!running) {
        return;
      }

      timeLeft -= 1;
      if (timeLeft < 0) {
        timeLeft = 0;
      }
      updateHud();

      if (timeLeft <= 0) {
        finishGame(score >= TARGET_SCORE);
      }
    }, 1000);

    spawnWave();
    scheduleSpawn();
  }

  function resetGame() {
    running = false;
    clearLoopTimers();
    clearBoard();
    score = 0;
    timeLeft = TOTAL_SECONDS;
    updateHud();
    setState('READY');
    setStatus('Press Start. Dinos will pop from caves in waves.');
    setControls('ready');
  }

  function hitHole(hole) {
    if (!running || !hole.classList.contains('is-up') || hole.dataset.hit === '1') {
      return;
    }

    hole.dataset.hit = '1';
    hole.classList.add('is-hit');
    score += 1;
    updateHud();

    const hideTimer = Number(hole.dataset.hideTimer || '');
    if (Number.isFinite(hideTimer) && hideTimer > 0) {
      window.clearTimeout(hideTimer);
      delete hole.dataset.hideTimer;
    }

    window.setTimeout(() => {
      hole.classList.remove('is-up', 'is-hit');
    }, 140);

    if (score >= TARGET_SCORE) {
      finishGame(true);
    }
  }

  function buildBoard() {
    if (holes.length) {
      return;
    }

    const fragment = document.createDocumentFragment();
    const nextHoles = [];

    for (let index = 0; index < HOLE_COUNT; index += 1) {
      const hole = document.createElement('button');
      hole.type = 'button';
      hole.className = 'dino-hole';
      hole.setAttribute('aria-label', 'Cave ' + (index + 1));

      const mouth = document.createElement('span');
      mouth.className = 'dino-hole-mouth';
      mouth.setAttribute('aria-hidden', 'true');

      const dino = document.createElement('img');
      dino.className = 'dino-pop';
      dino.alt = '';
      dino.loading = 'lazy';
      dino.src = DINO_ASSETS[index % DINO_ASSETS.length];

      hole.appendChild(mouth);
      hole.appendChild(dino);
      hole.addEventListener('click', () => hitHole(hole));
      hole.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        hitHole(hole);
      });

      nextHoles.push(hole);
      fragment.appendChild(hole);
    }

    board.innerHTML = '';
    board.appendChild(fragment);
    holes = nextHoles;
  }

  function openModal() {
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    resetGame();
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
    resetGame();
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  startBtn.addEventListener('click', startGame);
  resetBtn.addEventListener('click', resetGame);

  closeControl.addEventListener('click', closeModal);
  closeControl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  buildBoard();
  resetGame();
}());
