const snippets = {
      gameLoop: `// Main Three.js runner loop
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const rawDelta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (!isGameOver) {
    let timeScale = 1.0;
    if (activePowerups.slowmoTimer > 0) {
      activePowerups.slowmoTimer -= rawDelta;
      timeScale = 0.5;
      slowmoTimerEl.innerText = Math.max(0, activePowerups.slowmoTimer).toFixed(1) + 's';
      if (activePowerups.slowmoTimer <= 0) badgeSlowmo.classList.remove('active');
    }

    let scoreMultiplier = 1;
    if (activePowerups.multiplierTimer > 0) {
      activePowerups.multiplierTimer -= rawDelta;
      scoreMultiplier = 2;
      multTimerEl.innerText = Math.max(0, activePowerups.multiplierTimer).toFixed(1) + 's';
      if (activePowerups.multiplierTimer <= 0) badgeMult.classList.remove('active');
    }

    const delta = rawDelta * timeScale;
    currentSpeed = Math.min(START_SPEED + distance * 0.024, MAX_SPEED);
    speedDisplay.innerText = ((currentSpeed / START_SPEED) * timeScale).toFixed(1) + 'X';
    distance += currentSpeed * delta * 0.55 * scoreMultiplier;
    scoreDisplay.innerText = String(Math.floor(distance)).padStart(6, '0');
    checkZoneTransition(distance);

    const targetX = LANES[currentLane];
    playerRoot.position.x = THREE.MathUtils.lerp(playerRoot.position.x, targetX, 0.24);
    const laneDiff = targetX - playerRoot.position.x;
    playerRoot.rotation.z = -laneDiff * 0.12;

    if (isSliding) {
      slideTimer -= delta;
      if (slideTimer <= 0) isSliding = false;
    }

    if (isJumping) {
      velocityY += gravity * delta;
      playerY += velocityY * delta;
      if (playerY <= 0) {
        playerY = 0;
        velocityY = 0;
        isJumping = false;
      }
      rightArmPivot.rotation.x = 2.8;
      leftArmPivot.rotation.x = -0.5;
      rightLegPivot.rotation.x = -0.7;
      leftLegPivot.rotation.x = 0.3;
    } else if (isSliding) {
      heroModel.rotation.x = THREE.MathUtils.lerp(heroModel.rotation.x, -Math.PI / 2.5, 0.28);
      heroModel.position.y = THREE.MathUtils.lerp(heroModel.position.y, 0.4, 0.28);
      leftLegPivot.rotation.x = -1.1;
      rightLegPivot.rotation.x = -1.1;
      leftArmPivot.rotation.x = 0.4;
      rightArmPivot.rotation.x = 0.4;
      playerY = 0;
    } else {
      heroModel.rotation.x = THREE.MathUtils.lerp(heroModel.rotation.x, 0, 0.2);
      heroModel.position.y = THREE.MathUtils.lerp(heroModel.position.y, 0, 0.2);
      runCycle += delta * (currentSpeed * 0.24);
      const legAngle = Math.sin(runCycle) * 0.85;
      leftLegPivot.rotation.x = legAngle;
      rightLegPivot.rotation.x = -legAngle;
      leftArmPivot.rotation.x = -legAngle * 0.9;
      rightArmPivot.rotation.x = legAngle * 0.9;
      playerY = Math.abs(Math.sin(runCycle * 2)) * 0.1;
    }

    playerRoot.position.y = playerY;

    if (activePowerups.shield) {
      shieldMesh.rotation.y += delta * 3;
    }

    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];
      coin.position.z += currentSpeed * delta;
      coin.rotation.y += delta * 3.5;
      coin.rotation.x += delta * 2;
      if (coin.position.z > 20) {
        scene.remove(coin);
        coins.splice(i, 1);
      }
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
      const powerup = powerups[i];
      powerup.position.z += currentSpeed * delta;
      powerup.rotation.y += delta * 3;
      if (powerup.position.z > 20) {
        scene.remove(powerup);
        powerups.splice(i, 1);
      }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obstacle = obstacles[i];
      obstacle.position.z += currentSpeed * delta;
      if (obstacle.position.z > 20) {
        scene.remove(obstacle);
        obstacles.splice(i, 1);
      }
    }

    furthestSpawnZ += currentSpeed * delta;
    while (furthestSpawnZ > -390) {
      furthestSpawnZ -= getFairSpacing();
      spawnWaveAt(furthestSpawnZ);
    }
    trackMat.map.offset.y -= currentSpeed * delta * 0.042;
    checkCollisions();
  }

  camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerRoot.position.x * 0.45, 0.1);
  renderer.render(scene, camera);
}`,
      collisions: `// Collect items, apply power-ups and resolve obstacle hits
function checkCollisions() {
  const playerX = playerRoot.position.x;
  const playerFeetY = playerY;
  const playerHeadY = isSliding ? 0.85 : playerFeetY + 2.35;

  // Pick up score bits
  for (let i = coins.length - 1; i >= 0; i--) {
    const item = coins[i];
    if (Math.abs(item.position.z - playerRoot.position.z) < 1.3 &&
        Math.abs(item.position.x - playerX) < 1.4) {
      coinCount++;
      coinDisplay.innerText = 'x' + String(coinCount).padStart(2, '0');
      distance += 10;
      AudioFX.coin();
      scene.remove(item);
      coins.splice(i, 1);
    }
  }

  // Activate collected power-ups
  for (let i = powerups.length - 1; i >= 0; i--) {
    const item = powerups[i];
    if (Math.abs(item.position.z - playerRoot.position.z) < 1.4 &&
        Math.abs(item.position.x - playerX) < 1.5) {
      applyPowerup(item.userData.type);
      scene.remove(item);
      powerups.splice(i, 1);
    }
  }

  // Test lane and vertical clearance for each obstacle
  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];
    const zDistance = Math.abs(obstacle.position.z - playerRoot.position.z);
    if (zDistance < 1.3) {
      const xDistance = Math.abs(obstacle.position.x - playerX);
      if (xDistance < 1.5) {
        let collides = false;

        if (obstacle.userData.type === 'overhead') {
          if (playerHeadY > obstacle.userData.clearance) collides = true;
        } else if (obstacle.userData.type === 'spike') {
          if (playerFeetY < obstacle.userData.height - 0.2) collides = true;
        } else if (obstacle.userData.type === 'tall') {
          collides = true;
        }

        if (collides) {
          if (activePowerups.shield) {
            activePowerups.shield = false;
            shieldMesh.visible = false;
            badgeShield.classList.remove('active');
            AudioFX.shieldBreak();
            scene.remove(obstacle);
            obstacles.splice(i, 1);
            break;
          } else {
            triggerGameOver();
            break;
          }
        }
      }
    }
  }
}`,
      highscore: `// Persist scores locally and sync them through Supabase
const HighscoreManager = {
  storageKey: 'pixel_protocol_scores',

  getScores() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw).slice(0, 50) : [];
    } catch (error) {
      return [];
    }
  },

  addScore(score) {
    if (score <= 0) return;
    const scores = this.getScores();
    scores.push({ player_name: 'YOU', score: Math.floor(score) });
    scores.sort((left, right) => right.score - left.score);
    const topScores = scores.slice(0, 50);
    localStorage.setItem(this.storageKey, JSON.stringify(topScores));
    return topScores;
  },

  isConfigured() {
    const config = window.SUPABASE_CONFIG || {};
    return Boolean(config.url && config.anonKey &&
      !config.url.includes('YOUR_') && !config.anonKey.includes('YOUR_'));
  },

  async loadLeaderboard(currentScore) {
    if (!this.isConfigured()) {
      this.renderTable(this.getScores(), currentScore);
      return;
    }

    const config = window.SUPABASE_CONFIG;
    const url = config.url.replace(/\\/$/, '') +
      '/rest/v1/arcade_leaderboard' +
      '?select=player_name,score,created_at' +
      '&order=score.desc,created_at.asc&limit=50';
    try {
      const response = await fetch(url, {
        headers: { apikey: config.anonKey }
      });
      if (!response.ok) throw new Error('Leaderboard request failed');
      const rows = await response.json();
      this.renderTable(rows.map(row => ({
        player_name: row.player_name,
        score: row.score,
        date: new Date(row.created_at).toLocaleDateString('de-DE')
      })), currentScore);
    } catch (error) {
      this.renderTable(this.getScores(), currentScore);
    }
  },

  async submitScore(score, playerName) {
    if (!this.isConfigured()) throw new Error('Supabase ist noch nicht konfiguriert.');
    const config = window.SUPABASE_CONFIG;
    const response = await fetch(
      config.url.replace(/\\/$/, '') + '/rest/v1/rpc/submit_arcade_score',
      {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_player_name: playerName,
        p_score: Math.floor(score)
      })
      }
    );

    if (!response.ok) {
      let details = '';
      try {
        const error = await response.json();
        details = error.message || error.details || error.hint || '';
      } catch (error) {
        details = response.statusText;
      }
      throw new Error(details || 'Score submission failed');
    }

    const rows = await response.json();
    this.renderTable(rows, score);
    return rows;
  },

  renderTable(scores, currentScore) {
    const body = document.getElementById('highscore-body');
    body.innerHTML = '';
    scores.slice(0, 50).forEach((item, index) => {
      const row = document.createElement('tr');
      if (Math.floor(currentScore) === item.score) row.style.color = '#ffcc00';
      [
        '#' + (index + 1),
        item.player_name || 'PLAYER',
        String(item.score).padStart(6, '0'),
        item.date || new Date(item.created_at).toLocaleDateString('de-DE')
      ].forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
  }
};`,
      chessMoves: `// Show only rule-checked destinations for the selected piece
function selectSquare(square) {
  const piece = game.get(square);
  if (!piece || piece.color !== game.turn()) return;

  selectedSquare = square;
  legalTargetSquares = game.moves({ square, verbose: true }).map((move) => ({
    square: move.to,
    capture: Boolean(move.captured)
  }));
  updateBoardHighlights();
}

function updateBoardHighlights() {
  const squares = board.shadowRoot.querySelectorAll('[data-square]');
  for (const square of squares) {
    square.removeAttribute('data-legal-target');
    square.removeAttribute('data-legal-capture');
  }

  for (const target of legalTargetSquares) {
    const destination = board.shadowRoot.querySelector(
      '[data-square="' + target.square + '"]'
    );
    destination?.setAttribute(
      target.capture ? 'data-legal-capture' : 'data-legal-target',
      ''
    );
  }
}`
    };

    let currentKey = 'gameLoop';

    function renderSnippet(key) {
      const display = document.getElementById('code-display');
      if (!display) return;

      if (window.hljs) {
        display.innerHTML = window.hljs.highlight(snippets[key], { language: 'javascript' }).value;
      } else {
        display.textContent = snippets[key];
      }
    }

    renderSnippet(currentKey);

    function switchSnippet(key) {
      if (!Object.hasOwn(snippets, key)) return;
      currentKey = key;
      document.querySelectorAll('[data-snippet]').forEach((button) => {
        const isActive = button.dataset.snippet === key;
        button.setAttribute('aria-pressed', String(isActive));
        if (isActive) {
          button.className = "shrink-0 whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-mono font-medium text-[#00F2FE] bg-white/[0.08] border border-white/[0.08] transition-all";
        } else {
          button.className = "shrink-0 whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-mono font-medium text-gray-400 hover:text-white transition-all";
        }
      });

      renderSnippet(key);
    }

    function copySnippetCode() {
      const textToCopy = snippets[currentKey];
      navigator.clipboard.writeText(textToCopy).then(() => {
        const copyText = document.getElementById('copy-text');
        copyText.textContent = 'Copied!';
        setTimeout(() => {
          copyText.textContent = 'Copy';
        }, 2000);
      });
    }

    const themeToggle = document.getElementById('theme-toggle');
    const THEME_KEY = 'portfolio-theme';

    function applyTheme(theme) {
      const isDark = theme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('light', !isDark);
      localStorage.setItem(THEME_KEY, theme);

      if (themeToggle) {
        const icon = themeToggle.querySelector('.material-symbols-outlined');
        if (icon) {
          icon.textContent = isDark ? 'dark_mode' : 'light_mode';
        }
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      }
    }

    const savedTheme = localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(savedTheme);

    themeToggle?.addEventListener('click', () => {
      const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(nextTheme);
    });

    document.querySelectorAll('[data-snippet]').forEach((button) => {
      button.addEventListener('click', () => switchSnippet(button.dataset.snippet));
    });

    document.getElementById('copy-code-btn')?.addEventListener('click', copySnippetCode);
    const copyrightYear = document.getElementById('copyright-year');
    if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();

    const staggerGroups = document.querySelectorAll('[data-reveal-stagger]');
    staggerGroups.forEach((group) => {
      [...group.children].forEach((item, index) => {
        item.setAttribute('data-scroll-reveal', '');
        item.style.setProperty('--reveal-delay', `${Math.min(index * 90, 270)}ms`);
      });
    });

    const revealItems = [...document.querySelectorAll('[data-scroll-reveal]')];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    } else {
      document.documentElement.classList.add('has-scroll-reveal');
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revealItems.forEach((item) => revealObserver.observe(item));
    }

    const primaryNavigation = document.getElementById('primary-navigation');
    const navigationIndicator = primaryNavigation?.querySelector('.nav-indicator');
    const sectionLinks = [...(primaryNavigation?.querySelectorAll('[data-scroll-target]') ?? [])];
    const observedSections = sectionLinks
      .map((link) => document.getElementById(link.dataset.scrollTarget))
      .filter((section) => section && section.id !== 'top');
    let activeNavigationTarget = null;
    let navigationFramePending = false;
    let pendingNavigationTarget = null;
    let scrollSettleTimer = null;

    function setActiveNavigation(target) {
      const activeLink = sectionLinks.find((link) => link.dataset.scrollTarget === target);
      if (!activeLink || target === activeNavigationTarget) return;
      activeNavigationTarget = target;

      sectionLinks.forEach((link) => {
        if (link === activeLink) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });

      if (!navigationIndicator || primaryNavigation.offsetParent === null) return;
      navigationIndicator.style.width = `${activeLink.offsetWidth}px`;
      navigationIndicator.style.transform = `translate3d(${activeLink.offsetLeft}px, 0, 0)`;

      if (primaryNavigation.scrollWidth > primaryNavigation.clientWidth) {
        const navigationBounds = primaryNavigation.getBoundingClientRect();
        const linkBounds = activeLink.getBoundingClientRect();
        if (linkBounds.left < navigationBounds.left + 8) {
          primaryNavigation.scrollLeft -= navigationBounds.left + 8 - linkBounds.left;
        } else if (linkBounds.right > navigationBounds.right - 8) {
          primaryNavigation.scrollLeft += linkBounds.right - navigationBounds.right + 8;
        }
      }
    }

    function updateNavigationFromScroll() {
      if (pendingNavigationTarget) return;

      const scrollMarker = window.scrollY + window.innerHeight * 0.3;
      let currentTarget = 'top';

      observedSections.forEach((section) => {
        if (section.offsetTop <= scrollMarker) currentTarget = section.id;
      });
      setActiveNavigation(currentTarget);
    }

    function scheduleNavigationUpdate() {
      if (pendingNavigationTarget) {
        window.clearTimeout(scrollSettleTimer);
        scrollSettleTimer = window.setTimeout(finishNavigationScroll, 180);
        return;
      }
      if (navigationFramePending) return;
      navigationFramePending = true;
      window.requestAnimationFrame(() => {
        navigationFramePending = false;
        updateNavigationFromScroll();
      });
    }

    function finishNavigationScroll() {
      window.clearTimeout(scrollSettleTimer);
      pendingNavigationTarget = null;
      updateNavigationFromScroll();
    }

    sectionLinks.forEach((link) => {
      link.addEventListener('click', () => {
        pendingNavigationTarget = link.dataset.scrollTarget;
        setActiveNavigation(pendingNavigationTarget);
        window.clearTimeout(scrollSettleTimer);
        scrollSettleTimer = window.setTimeout(finishNavigationScroll, 180);
      });
    });
    window.addEventListener('scroll', scheduleNavigationUpdate, { passive: true });
    window.addEventListener('scrollend', finishNavigationScroll);
    window.addEventListener('resize', () => {
      updateNavigationFromScroll();
      if (activeNavigationTarget) {
        const activeLink = sectionLinks.find((link) => link.dataset.scrollTarget === activeNavigationTarget);
        if (activeLink && navigationIndicator && primaryNavigation.offsetParent !== null) {
          navigationIndicator.style.width = `${activeLink.offsetWidth}px`;
          navigationIndicator.style.transform = `translate3d(${activeLink.offsetLeft}px, 0, 0)`;
        }
      }
    });
    window.addEventListener('load', updateNavigationFromScroll, { once: true });
    setActiveNavigation('top');
    updateNavigationFromScroll();

    // Bot-protected email construction
    const emailParts = { user: 'n08914231', domain: 'gmail.com' };
    const fullEmail = emailParts.user + '@' + emailParts.domain;

    const contactLink = document.getElementById('contact-email-link');
    const contactDisplay = document.getElementById('contact-email-display');
    if (contactLink && contactDisplay) {
      contactDisplay.textContent = fullEmail;
      contactLink.href = 'mailto:' + fullEmail;
    }

    const impressumEmailDisplay = document.getElementById('impressum-email-display');
    if (impressumEmailDisplay) {
      impressumEmailDisplay.textContent = fullEmail;
    }
