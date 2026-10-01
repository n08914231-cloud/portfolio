import { Chess } from 'https://esm.sh/chess.js@1.4.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const config = window.SUPABASE_CONFIG || {};
const client = config.url && config.anonKey
  ? createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  : null;
const board = document.getElementById('chess-board');
const status = document.getElementById('chess-status');
const statusDot = document.getElementById('chess-status-dot');
const turnCaption = document.getElementById('chess-turn-caption');
const turnLabel = document.getElementById('chess-turn');
const moveCount = document.getElementById('chess-move-count');
const moveList = document.getElementById('chess-move-list');
const resultBanner = document.getElementById('chess-result');
const boardHint = document.getElementById('chess-board-hint');
const themeToggle = document.getElementById('chess-theme-toggle');
const resetLocalButton = document.getElementById('chess-reset-local');
const localGameStorageKey = 'noah-dev-chess-local-v1';
const resultDisplayMs = 10000;

await customElements.whenDefined('chess-board');

board.moveSpeed = 220;
board.snapbackSpeed = 180;
board.snapSpeed = 90;

let game = new Chess();
let gameMode = 'shared';
let savedMoves = [];
let isSubmitting = false;
let isLoading = false;
let gameLoaded = false;
let selectedSquare = null;
let lastDropAt = -Infinity;
let lastPointerTapAt = -Infinity;
let lastMoveSquares = [];
let legalTargetSquares = [];
let autoResetInterval = null;
let autoResetKey = '';
const boardPointerStarts = new Map();

const boardThemeSheet = new CSSStyleSheet();
boardThemeSheet.replaceSync(`
  :host {
    --light-color: #eeeed2;
    --dark-color: #769656;
    --highlight-color: rgba(246, 246, 105, 0.78);
  }
  [data-square] {
    cursor: pointer;
    transition: background-color 140ms ease, box-shadow 140ms ease;
  }
  [data-square]:has([part~="piece"]) {
    cursor: grab;
  }
  [data-square]:has([part~="piece"]):hover {
    box-shadow: inset 0 0 0 3px rgba(0, 242, 254, 0.42);
  }
  [data-square][data-last-move] {
    background-color: rgba(246, 246, 105, 0.78) !important;
  }
  [data-square][data-selected] {
    background-color: rgba(246, 246, 105, 0.9) !important;
    box-shadow: inset 0 0 0 3px rgba(38, 72, 44, 0.48);
  }
  [data-square][data-legal-target]::after {
    content: "";
    position: absolute;
    z-index: 2;
    top: 50%;
    left: 50%;
    width: 32%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: rgba(24, 42, 20, 0.62);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.72);
    pointer-events: none;
    transform: translate(-50%, -50%);
  }
  [data-square][data-legal-capture]::after {
    width: 84%;
    background: transparent;
    border: 6px solid rgba(24, 42, 20, 0.68);
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.72);
  }
  [data-square][data-in-check] {
    background: radial-gradient(ellipse at center, rgba(255, 45, 45, 0.9) 0%, rgba(255, 45, 45, 0.62) 58%, transparent 82%) !important;
  }
`);
board.shadowRoot.adoptedStyleSheets = [...board.shadowRoot.adoptedStyleSheets, boardThemeSheet];

function showStatus(message, state = 'neutral') {
  status.textContent = message;
  statusDot.classList.toggle('bg-emerald-400', state === 'live');
  statusDot.classList.toggle('bg-rose-400', state === 'error');
  statusDot.classList.toggle('bg-gray-500', state === 'neutral');
}

function renderMoves(moves, winningPly = -1) {
  moveList.replaceChildren();
  if (!moves.length) {
    const empty = document.createElement('li');
    empty.className = 'col-span-3 text-gray-500';
    empty.textContent = 'No moves yet — make the first move as White.';
    moveList.append(empty);
    return;
  }

  for (let index = 0; index < moves.length; index += 2) {
    const number = document.createElement('li');
    number.className = 'text-gray-500';
    number.textContent = `${Math.floor(index / 2) + 1}.`;
    const white = document.createElement('li');
    white.className = 'text-gray-200';
    white.textContent = moves[index].san;
    const black = document.createElement('li');
    black.className = 'text-gray-400';
    black.textContent = moves[index + 1]?.san || '…';
    if (index === winningPly) white.classList.add('chess-winning-move');
    if (index + 1 === winningPly) black.classList.add('chess-winning-move');
    moveList.append(number, white, black);
  }
}

function renderPosition(moves) {
  game = new Chess();
  let terminalMove = null;
  for (const move of moves) {
    const result = game.move({
      from: move.from_square,
      to: move.to_square,
      ...(move.promotion ? { promotion: move.promotion } : {})
    });
    if (!result || result.san !== move.san || game.fen() !== move.fen) {
      throw new Error('The saved game history is inconsistent.');
    }
    terminalMove = result;
  }

  board.setPosition(game.fen());
  lastMoveSquares = moves.length
    ? [moves[moves.length - 1].from_square, moves[moves.length - 1].to_square]
    : [];
  updateBoardHighlights();
  const gameOver = game.isGameOver();
  const turn = game.turn();
  const canMove = gameLoaded && !gameOver && !isSubmitting && !isLoading;
  resultBanner.classList.add('hidden');
  resultBanner.textContent = '';
  board.draggablePieces = canMove;
  resetLocalButton.classList.toggle('hidden', gameMode !== 'local');
  moveCount.textContent = `${moves.length} half-move${moves.length === 1 ? '' : 's'}`;
  turnCaption.textContent = gameOver ? 'Game over' : `${turn === 'w' ? 'White' : 'Black'} to move`;

  if (gameOver) {
    if (game.isCheckmate()) {
      const winner = turn === 'w' ? 'Black' : 'White';
      const resultText = `${turn === 'w' ? 'White' : 'Black'} is checkmated — ${winner} wins!`;
      turnLabel.textContent = `${winner} wins by checkmate`;
      resultBanner.textContent = resultText;
      resultBanner.classList.remove('hidden');
      boardHint.textContent = resultText;
    } else {
      const drawReason = game.isStalemate()
        ? 'Stalemate'
        : game.isInsufficientMaterial()
          ? 'Insufficient material'
          : game.isThreefoldRepetition()
            ? 'Threefold repetition'
            : game.isDrawByFiftyMoves()
              ? 'Fifty-move rule'
              : 'Draw';
      turnLabel.textContent = `Draw — ${drawReason}`;
      resultBanner.textContent = `Game drawn — ${drawReason}.`;
      resultBanner.classList.remove('hidden');
      boardHint.textContent = `The game is a draw (${drawReason.toLowerCase()}).`;
    }
  } else if (turn === 'w') {
    turnLabel.textContent = 'White to move';
    boardHint.textContent = gameMode === 'local'
      ? 'Local demo: move either color in turn. Click or drag a piece to move.'
      : 'White is to move. Anyone can move: select a piece and destination, or drag it.';
  } else {
    turnLabel.textContent = 'Black to move';
    boardHint.textContent = gameMode === 'local'
      ? 'Local demo: move either color in turn. Click or drag a piece to move.'
      : 'Black is to move. Anyone can move: select a piece and destination, or drag it.';
  }
  savedMoves = moves;
  renderMoves(savedMoves, gameOver && game.isCheckmate() && terminalMove ? savedMoves.length - 1 : -1);
  clearSelection();
  scheduleAutoReset(moves);
}

function scheduleAutoReset(moves) {
  if (!game.isGameOver() || moves.length === 0) {
    if (autoResetInterval !== null) window.clearInterval(autoResetInterval);
    autoResetInterval = null;
    autoResetKey = '';
    return;
  }

  const finalMove = moves[moves.length - 1];
  const key = `${gameMode}:${finalMove.ply}:${finalMove.fen}`;
  if (key === autoResetKey) return;

  if (autoResetInterval !== null) window.clearInterval(autoResetInterval);
  autoResetKey = key;
  const recordedAt = Date.parse(finalMove.created_at || '');
  const resetAt = (Number.isNaN(recordedAt) ? Date.now() : recordedAt) + resultDisplayMs;

  const updateCountdown = async () => {
    if (autoResetKey !== key) return;
    const secondsRemaining = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
    if (secondsRemaining > 0) {
      resultBanner.textContent = `${resultBanner.textContent.replace(/\s*New game starts in \d+s\.$/, '')} New game starts in ${secondsRemaining}s.`;
      return;
    }

    window.clearInterval(autoResetInterval);
    autoResetInterval = null;
    autoResetKey = '';
    if (gameMode === 'local') {
      localStorage.removeItem(localGameStorageKey);
      renderPosition([]);
      gameLoaded = true;
      showStatus('New local game — only this browser', 'neutral');
      return;
    }

    try {
      const { data, error } = await client.functions.invoke('chess-move', {
        body: { action: 'reset' }
      });
      if (error) {
        const response = error.context;
        if (response instanceof Response) {
          const result = await response.json();
          throw new Error(result.error || error.message);
        }
        throw error;
      }
      if (!data?.reset) {
        await loadGame({ quiet: true });
        return;
      }
      await loadGame({ quiet: true });
    } catch (error) {
      console.error('Could not automatically reset the finished chess game:', error);
      showStatus(error.message || 'Could not reset the finished game.', 'error');
      autoResetKey = key;
    }
  };

  updateCountdown();
  autoResetInterval = window.setInterval(updateCountdown, 1000);
}

function updateBoardHighlights() {
  const squares = board.shadowRoot.querySelectorAll('[data-square]');
  for (const square of squares) {
    const partNames = square.getAttribute('part').split(/\s+/);
    square.style.backgroundColor = partNames.includes('white') ? '#eeeed2' : '#769656';
    square.toggleAttribute('data-last-move', lastMoveSquares.includes(square.dataset.square));
    square.removeAttribute('data-selected');
    square.removeAttribute('data-legal-target');
    square.removeAttribute('data-legal-capture');
    square.removeAttribute('data-in-check');
  }

  if (game.isCheck()) {
    const kingColor = game.turn();
    for (const [square, piece] of Object.entries(game.board().flat().reduce((positions, piece, index) => {
      if (piece?.type === 'k' && piece.color === kingColor) {
        const file = String.fromCharCode(97 + (index % 8));
        const rank = String(8 - Math.floor(index / 8));
        positions[`${file}${rank}`] = true;
      }
      return positions;
    }, {}))) {
      if (piece) board.shadowRoot.querySelector(`[data-square="${square}"]`)?.setAttribute('data-in-check', '');
    }
  }

  if (!selectedSquare) return;
  board.shadowRoot.querySelector(`[data-square="${selectedSquare}"]`)?.setAttribute('data-selected', '');
  for (const target of legalTargetSquares) {
    board.shadowRoot.querySelector(`[data-square="${target.square}"]`)
      ?.setAttribute(target.capture ? 'data-legal-capture' : 'data-legal-target', '');
  }
}

function clearSelection() {
  selectedSquare = null;
  legalTargetSquares = [];
  updateBoardHighlights();
}

function selectSquare(square) {
  selectedSquare = null;
  legalTargetSquares = [];
  const selectedPiece = game.get(square);
  if (!selectedPiece) return;
  selectedSquare = square;
  legalTargetSquares = game.moves({ square, verbose: true }).map((move) => ({
    square: move.to,
    capture: Boolean(move.captured)
  }));
  updateBoardHighlights();
  boardHint.textContent = `Selected ${square}. Choose a destination square.`;
}

function loadLocalGame() {
  gameMode = 'local';
  gameLoaded = true;
  resetLocalButton.classList.remove('hidden');
  const rawMoves = localStorage.getItem(localGameStorageKey);
  let localMoves = [];
  if (rawMoves) {
    localMoves = JSON.parse(rawMoves);
    if (!Array.isArray(localMoves)) throw new Error('The saved local chess game is invalid.');
  }
  renderPosition(localMoves);
  showStatus('Local demo — only this browser', 'neutral');
}

async function loadGame({ quiet = false } = {}) {
  if (!client || isLoading) return;
  isLoading = true;
  try {
    const { data, error } = await client
      .from('chess_moves')
      .select('ply, from_square, to_square, promotion, san, fen, created_at')
      .order('ply', { ascending: true });
    if (error) throw error;

    for (let index = 0; index < data.length; index += 1) {
      if (data[index].ply !== index + 1) throw new Error('The shared game history has a missing move.');
    }
    const historyUnchanged = gameMode === 'shared' && gameLoaded &&
      savedMoves.length === data.length &&
      data.every((move, index) => {
        const savedMove = savedMoves[index];
        return move.ply === savedMove.ply &&
          move.from_square === savedMove.from_square &&
          move.to_square === savedMove.to_square &&
          move.promotion === savedMove.promotion &&
          move.san === savedMove.san &&
          move.fen === savedMove.fen;
      });
    gameMode = 'shared';
    gameLoaded = true;
    if (!historyUnchanged) renderPosition(data);
    showStatus('Shared game is live', 'live');
  } catch (error) {
    if (error.code === 'PGRST205') {
      try {
        loadLocalGame();
        return;
      } catch (localError) {
        gameLoaded = false;
        board.draggablePieces = false;
        console.error('Could not restore the local chess game:', localError);
        showStatus('The saved local game could not be loaded.', 'error');
        boardHint.textContent = 'The saved game data is invalid. Use “New local game” to start over.';
        resetLocalButton.classList.remove('hidden');
        return;
      }
    }
    gameLoaded = false;
    board.draggablePieces = false;
    console.error('Could not load the shared chess game:', error);
    showStatus(error.message || 'Could not load the shared game.', 'error');
    turnLabel.textContent = 'Game unavailable';
    if (!quiet) boardHint.textContent = 'The game could not be loaded. Please try again later.';
  } finally {
    isLoading = false;
    board.draggablePieces = gameLoaded && !isSubmitting && !game.isGameOver();
  }
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('light', !isDark);
  localStorage.setItem('portfolio-theme', theme);
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  themeToggle.querySelector('.material-symbols-outlined').textContent = isDark ? 'dark_mode' : 'light_mode';
}

async function submitMove(from, to, promotion, candidate, move) {
  if (isSubmitting) return;
  isSubmitting = true;
  board.draggablePieces = false;
  board.setPosition(candidate.fen());
  try {
    if (gameMode === 'local') {
      const nextMoves = [...savedMoves, {
        ply: savedMoves.length + 1,
        from_square: move.from,
        to_square: move.to,
        promotion: move.promotion || null,
        san: move.san,
        fen: candidate.fen(),
        created_at: new Date().toISOString()
      }];
      localStorage.setItem(localGameStorageKey, JSON.stringify(nextMoves));
      renderPosition(nextMoves);
      showStatus('Local demo — only this browser', 'neutral');
      return;
    }
    showStatus('Saving move online…', 'neutral');
    const { error } = await client.functions.invoke('chess-move', {
      body: { from, to, promotion }
    });
    if (error) {
      const response = error.context;
      if (response instanceof Response) {
        const result = await response.json();
        throw new Error(result.error || error.message);
      }
      throw error;
    }
    await loadGame();
  } catch (error) {
    console.error('Could not submit chess move:', error);
    showStatus(error.message || 'Move could not be saved.', 'error');
    await loadGame({ quiet: true });
  } finally {
    isSubmitting = false;
    board.draggablePieces = gameLoaded && !game.isGameOver();
  }
}

function tryMove(from, to, promotion) {
  const candidate = new Chess(game.fen());
  let move;
  try {
    move = candidate.move({ from, to, promotion: promotion || 'q' });
  } catch {
    move = null;
  }
  if (!move) {
    boardHint.textContent = 'That move is not legal. Choose another square.';
    clearSelection();
    return false;
  }
  clearSelection();
  submitMove(move.from, move.to, move.promotion, candidate, move);
  return true;
}

function handleSquareTap(square) {
  if (isSubmitting || isLoading || !gameLoaded || game.isGameOver()) return;
  const piece = game.get(square);
  const canSelectPiece = piece && (gameMode === 'local' || piece.color === game.turn());
  if (!selectedSquare) {
    if (canSelectPiece) selectSquare(square);
    return;
  }
  if (square === selectedSquare) {
    clearSelection();
    return;
  }
  if (canSelectPiece) {
    selectSquare(square);
    return;
  }
  tryMove(selectedSquare, square, 'q');
}

themeToggle.addEventListener('click', () => {
  applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
});
applyTheme(localStorage.getItem('portfolio-theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));

board.addEventListener('drag-start', (event) => {
  const { piece } = event.detail;
  const expectedPrefix = game.turn() === 'w' ? 'w' : 'b';
  if (isSubmitting || isLoading || !gameLoaded || game.isGameOver() || piece[0] !== expectedPrefix ||
      (gameMode === 'shared' && piece[0] !== game.turn())) {
    event.preventDefault();
  }
});

board.addEventListener('drop', (event) => {
  const { source, target, setAction } = event.detail;
  if (source === target) return;
  lastDropAt = performance.now();
  if (!tryMove(source, target, 'q')) setAction('snapback');
});

board.shadowRoot.addEventListener('pointerdown', (event) => {
  const square = event.composedPath().find((node) =>
    node instanceof HTMLElement && typeof node.dataset.square === 'string'
  )?.dataset.square;
  if (square) {
    boardPointerStarts.set(event.pointerId, {
      square,
      x: event.clientX,
      y: event.clientY
    });
  }
}, true);

board.shadowRoot.addEventListener('pointerup', (event) => {
  const start = boardPointerStarts.get(event.pointerId);
  boardPointerStarts.delete(event.pointerId);
  if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) return;

  lastPointerTapAt = performance.now();
  handleSquareTap(start.square);
}, true);

board.addEventListener('click', (event) => {
  if (performance.now() - lastDropAt < 350 || performance.now() - lastPointerTapAt < 350) return;
  const square = event.composedPath().find((node) =>
    node instanceof HTMLElement && typeof node.dataset.square === 'string'
  )?.dataset.square;
  if (!square) return;
  handleSquareTap(square);
});

resetLocalButton.addEventListener('click', () => {
  if (gameMode !== 'local') return;
  localStorage.removeItem(localGameStorageKey);
  renderPosition([]);
  gameLoaded = true;
  showStatus('New local game — only this browser', 'neutral');
});

if (!client) {
  showStatus('Supabase is not configured', 'error');
  try {
    loadLocalGame();
  } catch (error) {
    gameLoaded = false;
    console.error('Could not restore the local chess game:', error);
    showStatus('The saved local game could not be loaded.', 'error');
    turnLabel.textContent = 'Game unavailable';
    boardHint.textContent = 'The saved game data is invalid. Clear this site’s local storage to start again.';
    resetLocalButton.classList.remove('hidden');
  }
} else {
  loadGame();
  client
    .channel('community-chess-moves')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chess_moves' }, () => {
      loadGame({ quiet: true });
    })
    .subscribe((subscriptionStatus) => {
      if (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT') {
        console.error(`Chess realtime subscription status: ${subscriptionStatus}`);
      }
    });
  window.setInterval(() => {
    if (gameMode === 'shared') loadGame({ quiet: true });
  }, 10000);
}
