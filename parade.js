(function () {
  const tracks = Array.from(document.querySelectorAll('.dino-parade-track'));
  if (!tracks.length) {
    return;
  }

  function px(value, fallback) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function createScene(track) {
    const dinos = Array.from(track.querySelectorAll('.dino-runner')).map((el, index) => ({
      el,
      x: 0,
      phaseOffset: index * 0.58,
    }));
    const car = track.querySelector('.parade-car');

    if (!dinos.length || !car) {
      return null;
    }

    const scene = {
      track,
      dinos,
      car,
      dir: 1,
      phase: 'approach',
      pauseLeft: 0,
      carApproachDir: -1,
      carFacing: -1,
      carX: 0,
      trackWidth: 0,
      dinoSize: 92,
      dinoGap: 86,
      carWidth: 112,
      dinoSpeed: 64,
      carSpeed: 100,
      carReverseSpeed: 112,
      stopGap: 24,
      honkLeft: 0,
      initialized: false,
    };

    function syncMetrics(keepProgress) {
      const styles = getComputedStyle(track);
      const nextTrackWidth = track.clientWidth || 1;
      const nextDinoSize = px(styles.getPropertyValue('--dino-size'), scene.dinoSize);
      const nextGap = px(styles.getPropertyValue('--dino-gap'), scene.dinoGap);
      const nextCarWidth = car.offsetWidth || px(styles.getPropertyValue('--parade-car-width'), scene.carWidth);
      const widthRatio = scene.trackWidth ? nextTrackWidth / scene.trackWidth : 1;

      scene.trackWidth = nextTrackWidth;
      scene.dinoSize = nextDinoSize;
      scene.dinoGap = nextGap;
      scene.carWidth = nextCarWidth;
      scene.stopGap = Math.max(18, nextDinoSize * 0.18);
      scene.dinoSpeed = Math.max(36, nextTrackWidth * 0.06);
      scene.carSpeed = scene.dinoSpeed * 1.55;
      scene.carReverseSpeed = scene.carSpeed * 1.12;

      if (!scene.initialized) {
        const convoySpan = nextDinoSize + nextGap * (dinos.length - 1);
        const leftPadding = Math.max(12, Math.min(30, (nextTrackWidth - convoySpan) * 0.16));

        dinos.forEach((dino, index) => {
          dino.x = leftPadding + (dinos.length - 1 - index) * nextGap;
        });

        scene.carApproachDir = -1;
        scene.carFacing = -1;
        scene.carX = nextTrackWidth + 32;
        scene.initialized = true;
        return;
      }

      if (keepProgress && Number.isFinite(widthRatio) && widthRatio > 0) {
        dinos.forEach((dino) => {
          dino.x *= widthRatio;
        });
        scene.carX *= widthRatio;
      }
    }

    scene.syncMetrics = syncMetrics;
    track.classList.add('is-scripted');
    syncMetrics(false);

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => syncMetrics(true));
      observer.observe(track);
      scene.resizeObserver = observer;
    } else {
      window.addEventListener('resize', () => syncMetrics(true));
    }

    return scene;
  }

  function resetCar(scene) {
    scene.carApproachDir = -scene.dir;
    scene.carFacing = scene.carApproachDir;
    scene.carX = scene.carApproachDir === -1
      ? scene.trackWidth + 32
      : -scene.carWidth - 32;
    scene.phase = 'approach';
  }

  function carIsOut(scene) {
    if (scene.carApproachDir === -1) {
      return scene.carX > scene.trackWidth + 40;
    }

    return scene.carX + scene.carWidth < -40;
  }

  function triggerHonk(scene) {
    scene.honkLeft = 0.34;
    scene.car.classList.remove('is-honking');
    void scene.car.offsetWidth;
    scene.car.classList.add('is-honking');
  }

  function updateScene(scene, dt, seconds) {
    if (scene.honkLeft > 0) {
      scene.honkLeft -= dt;
      if (scene.honkLeft <= 0) {
        scene.honkLeft = 0;
        scene.car.classList.remove('is-honking');
      }
    }

    if (scene.phase === 'approach') {
      scene.dinos.forEach((dino) => {
        dino.x += scene.dinoSpeed * dt * scene.dir;
      });

      scene.carX += scene.carSpeed * dt * scene.carApproachDir;

      const leader = scene.dir === 1
        ? scene.dinos[0]
        : scene.dinos[scene.dinos.length - 1];

      const distance = scene.dir === 1
        ? scene.carX - (leader.x + scene.dinoSize)
        : leader.x - (scene.carX + scene.carWidth);

      if (distance <= scene.stopGap) {
        if (scene.dir === 1) {
          scene.carX = leader.x + scene.dinoSize + scene.stopGap;
        } else {
          scene.carX = leader.x - scene.stopGap - scene.carWidth;
        }

        scene.phase = 'pause';
        scene.pauseLeft = 0.68;
        triggerHonk(scene);
      }
    } else if (scene.phase === 'pause') {
      scene.pauseLeft -= dt;
      if (scene.pauseLeft <= 0) {
        scene.phase = 'reverse';
      }
    } else if (scene.phase === 'reverse') {
      scene.carX += scene.carReverseSpeed * dt * (-scene.carApproachDir);

      if (carIsOut(scene)) {
        scene.dir *= -1;
        resetCar(scene);
      }
    }

    const dinosAreMoving = scene.phase === 'approach';
    const dinoBounceAmp = dinosAreMoving ? 5 : 0;
    const dinoTiltAmp = dinosAreMoving ? 4.5 : 0;

    scene.dinos.forEach((dino) => {
      const wave = seconds * 8 + dino.phaseOffset;
      const bounce = Math.sin(wave) * dinoBounceAmp;
      const tilt = Math.sin(wave) * dinoTiltAmp;

      dino.el.style.left = dino.x + 'px';
      dino.el.style.transform =
        'translate3d(0, ' + bounce.toFixed(2) + 'px, 0) ' +
        'scaleX(' + scene.dir + ') ' +
        'rotate(' + tilt.toFixed(2) + 'deg)';
    });

    const carBob = scene.phase === 'pause' ? 0 : Math.sin(seconds * 7) * 1.2;
    scene.car.style.left = scene.carX + 'px';
    scene.car.style.transform =
      'translate3d(0, ' + carBob.toFixed(2) + 'px, 0) ' +
      'scaleX(' + scene.carFacing + ')';
  }

  const scenes = tracks.map(createScene).filter(Boolean);
  if (!scenes.length) {
    return;
  }

  let lastTime = performance.now();

  function tick(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    const seconds = now / 1000;
    lastTime = now;

    scenes.forEach((scene) => updateScene(scene, dt, seconds));
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}());
