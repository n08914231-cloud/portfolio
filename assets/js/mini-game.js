const gameShell = document.getElementById('game-shell');
const fullscreenToggle = document.getElementById('fullscreen-toggle');
const fullscreenIcon = document.getElementById('fullscreen-icon');
const fullscreenLabel = document.getElementById('fullscreen-label');
const miniThemeToggle = document.getElementById('mini-theme-toggle');
const leaderboardBody = document.getElementById('mini-leaderboard-body');
const leaderboardStatus = document.getElementById('mini-leaderboard-status');

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('light', !isDark);
  localStorage.setItem('portfolio-theme', theme);

  if (miniThemeToggle) {
    const icon = miniThemeToggle.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = isDark ? 'dark_mode' : 'light_mode';
    }
    miniThemeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    miniThemeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }
}

const savedTheme = localStorage.getItem('portfolio-theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
applyTheme(savedTheme);

miniThemeToggle?.addEventListener('click', () => {
  const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(nextTheme);
});

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function renderLeaderboard(rows) {
  leaderboardBody.innerHTML = '';

  if (!rows || rows.length === 0) {
    leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-gray-400">No records yet</td></tr>';
    return;
  }

  rows.slice(0, 10).forEach((entry, index) => {
    const row = document.createElement('tr');
    [
      { value: `#${index + 1}`, className: 'text-gray-400' },
      { value: String(entry.player_name || 'PLAYER').toUpperCase() },
      { value: String(entry.score ?? 0).padStart(6, '0') },
      { value: formatDate(entry.created_at || entry.date) }
    ].forEach(({ value, className }) => {
      const cell = document.createElement('td');
      if (className) cell.className = className;
      cell.textContent = value;
      row.appendChild(cell);
    });
    leaderboardBody.appendChild(row);
  });
}

async function loadMiniLeaderboard() {
  const config = window.SUPABASE_CONFIG || {};

  if (!config.url || !config.anonKey || config.url.includes('YOUR_') || config.anonKey.includes('YOUR_')) {
    leaderboardStatus.textContent = 'Local';
    try {
      const localScores = JSON.parse(localStorage.getItem('pixel_protocol_scores') || '[]');
      renderLeaderboard(localScores.map((item) => ({
        player_name: item.player_name || 'YOU',
        score: item.score,
        created_at: item.date
      })));
    } catch (error) {
      renderLeaderboard([]);
    }
    return;
  }

  leaderboardStatus.textContent = 'Live';

  try {
    const response = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/arcade_leaderboard?select=player_name,score,created_at&order=score.desc,created_at.asc&limit=10`, {
      headers: {
        apikey: config.anonKey
      }
    });

    if (!response.ok) throw new Error('Leaderboard failed');

    const rows = await response.json();
    renderLeaderboard(rows);
  } catch (error) {
    leaderboardStatus.textContent = 'Local';
    try {
      const localScores = JSON.parse(localStorage.getItem('pixel_protocol_scores') || '[]');
      renderLeaderboard(localScores.map((item) => ({
        player_name: item.player_name || 'YOU',
        score: item.score,
        created_at: item.date
      })));
    } catch (fallbackError) {
      renderLeaderboard([]);
    }
  }
}

function syncFullscreenControl() {
  const isFullscreen = document.fullscreenElement === gameShell;
  fullscreenToggle.setAttribute('aria-label', isFullscreen ? 'Vollbild verlassen' : 'Vollbild starten');
  fullscreenToggle.title = isFullscreen ? 'Vollbild verlassen' : 'Vollbild starten';
  fullscreenIcon.textContent = isFullscreen ? 'fullscreen_exit' : 'fullscreen';
  fullscreenLabel.textContent = isFullscreen ? 'Vollbild verlassen' : 'Vollbild';
}

fullscreenToggle.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement === gameShell) {
      await document.exitFullscreen();
    } else if (gameShell.requestFullscreen) {
      await gameShell.requestFullscreen();
    }
  } catch (error) {
    fullscreenToggle.title = 'Vollbild wird von diesem Browser nicht unterstützt';
  }
});

document.addEventListener('fullscreenchange', syncFullscreenControl);
loadMiniLeaderboard();
syncFullscreenControl();
