const gameShell = document.getElementById('game-shell');
const fullscreenToggle = document.getElementById('fullscreen-toggle');
const fullscreenIcon = document.getElementById('fullscreen-icon');
const fullscreenLabel = document.getElementById('fullscreen-label');

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
syncFullscreenControl();
