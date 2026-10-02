(() => {
  const storageKey = 'portfolio-language';
  const translations = {
    'Skip to the chess game': 'Zum Schachspiel springen',
    'Skip to sign in': 'Zum Login springen',
    'Skip to main content': 'Zum Hauptinhalt springen',
    'Main navigation': 'Hauptnavigation',
    'Choose language': 'Sprache auswählen',
    'Community Chess': 'Community-Schach',
    'Mini Game': 'Minispiel',
    'Overview': 'Übersicht',
    'Back to home': 'Zur Startseite',
    'Back': 'Zurück',
    'Toggle theme': 'Design wechseln',
    'Toggle Theme': 'Design wechseln',
    'Switch to light mode': 'Zum hellen Design wechseln',
    'Switch to dark mode': 'Zum dunklen Design wechseln',
    'Chess': 'Schach',
    'One board. One move at a time.': 'Ein Brett. Ein Zug nach dem anderen.',
    'One shared online game. White is reserved for the owner; visitors can play Black.': 'Ein gemeinsames Online-Spiel. Weiß ist für den Besitzer reserviert; Besucher spielen Schwarz.',
    'One shared online game. Anyone can move the side whose turn it is.': 'Ein gemeinsames Online-Spiel. Jeder kann die Seite ziehen, die am Zug ist.',
    'Community Game / 01': 'Community-Spiel / 01',
    'Connecting to the shared game…': 'Verbindung zum gemeinsamen Spiel…',
    'Connecting to the shared game...': 'Verbindung zum gemeinsamen Spiel…',
    'Shared game — visitors play Black': 'Gemeinsames Spiel — Besucher spielen Schwarz',
    'Signed in — you play White': 'Angemeldet — du spielst Weiß',
    'Chess access settings are unavailable': 'Schach-Zugriffseinstellungen sind nicht verfügbar',
    'White to move': 'Weiß ist am Zug',
    'Black to move': 'Schwarz ist am Zug',
    'Loading position…': 'Position wird geladen…',
    'Game unavailable': 'Spiel nicht verfügbar',
    'Game over': 'Spiel beendet',
    'Wins': 'Siege',
    'White': 'Weiß',
    'Black': 'Schwarz',
    'Move history': 'Zugverlauf',
    'LIVE': 'LIVE',
    'SHARED': 'GEMEINSAM',
    'No moves yet — the owner starts as White; visitors can play Black.': 'Noch keine Züge — der Besitzer beginnt mit Weiß, Besucher spielen Schwarz.',
    'No moves yet — White to move.': 'Noch keine Züge — Weiß ist am Zug.',
    'The owner plays White; visitors share Black. Moves are checked against the official chess rules.': 'Der Besitzer spielt Weiß, Besucher teilen sich Schwarz. Alle Züge werden nach den offiziellen Schachregeln geprüft.',
    'Both colors are open to everyone. Moves are checked against the official chess rules.': 'Beide Farben sind für alle offen. Alle Züge werden nach den offiziellen Schachregeln geprüft.',
    'Focus the board, use arrow keys to choose a square, press Enter or Space to select a piece or move, and Escape to clear your selection.': 'Fokussiere das Brett und wähle mit den Pfeiltasten ein Feld. Enter oder Leertaste wählt eine Figur oder einen Zug, Escape hebt die Auswahl auf.',
    'Loading game…': 'Spiel wird geladen…',
    'Loading game...': 'Spiel wird geladen…',
    'New local game': 'Neues lokales Spiel',
    'Local demo — only this browser': 'Lokale Demo — nur in diesem Browser',
    'Local demo: move either color in turn. Click, drag, or focus the board and use arrow keys + Enter.': 'Lokale Demo: Ziehe abwechselnd beide Farben. Klicke, ziehe oder fokussiere das Brett und nutze Pfeiltasten + Enter.',
    'Your turn as White. Click, drag, or focus the board and use arrow keys + Enter.': 'Du bist mit Weiß am Zug. Klicke, ziehe oder fokussiere das Brett und nutze Pfeiltasten + Enter.',
    'White is reserved for the owner. Visitors can play Black.': 'Weiß ist für den Besitzer reserviert. Besucher können Schwarz spielen.',
    'Visitors play Black. Wait for their move.': 'Besucher spielen Schwarz. Warte auf ihren Zug.',
    'Visitors play Black. Wait for their move.': 'Besucher spielen Schwarz. Warte auf ihren Zug.',
    'Your turn as Black. Click, drag, or focus the board and use arrow keys + Enter.': 'Du bist mit Schwarz am Zug. Klicke, ziehe oder fokussiere das Brett und nutze Pfeiltasten + Enter.',
    'That piece has no legal moves.': 'Diese Figur hat keine gültigen Züge.',
    'Selected': 'Ausgewählt',
    'Choose a destination square.': 'Wähle ein Zielfeld.',
    'That move is not legal. Choose another square.': 'Dieser Zug ist nicht gültig. Wähle ein anderes Feld.',
    'Piece selection cleared.': 'Figurenauswahl aufgehoben.',
    'The saved game data is invalid. Use “New local game” to start over.': 'Die gespeicherten Spieldaten sind ungültig. Starte über „Neues lokales Spiel“ neu.',
    'The saved game data is invalid. Clear this site’s local storage to start again.': 'Die gespeicherten Spieldaten sind ungültig. Lösche den lokalen Speicher dieser Website, um neu zu starten.',
    'The game could not be loaded. Please try again later.': 'Das Spiel konnte nicht geladen werden. Bitte versuche es später erneut.',
    'Saving move online…': 'Zug wird online gespeichert…',
    'Saving move online...': 'Zug wird online gespeichert…',
    'White is checkmated — Black wins!': 'Weiß ist matt — Schwarz gewinnt!',
    'Black is checkmated — White wins!': 'Schwarz ist matt — Weiß gewinnt!',
    'White wins by checkmate': 'Weiß gewinnt durch Schachmatt',
    'Black wins by checkmate': 'Schwarz gewinnt durch Schachmatt',
    'Game drawn — Stalemate.': 'Remis — Patt.',
    'Stalemate': 'Patt',
    'Insufficient material': 'Zu wenig Material',
    'Threefold repetition': 'Dreifache Stellungswiederholung',
    'Fifty-move rule': '50-Züge-Regel',
    'Draw': 'Remis',
    'Interactive Lab / 01': 'Interaktives Labor / 01',
    'Game ready': 'Spiel bereit',
    'Pixel Protocol game player': 'Pixel-Protocol-Spiel',
    'Arcade Runner': 'Arcade-Runner',
    'Leaderboard': 'Bestenliste',
    'TOP 10': 'TOP 10',
    'Loading…': 'Wird geladen…',
    'Loading...': 'Wird geladen…',
    'PLAYER': 'SPIELER',
    'SCORE': 'PUNKTE',
    'DATE': 'DATUM',
    'No records yet': 'Noch keine Einträge',
    'Current leaderboard': 'Aktuelle Bestenliste',
    'Live leaderboard': 'Live-Bestenliste',
    'Local leaderboard': 'Lokale Bestenliste',
    'Local': 'Lokal',
    'Live': 'Live',
    'Start fullscreen': 'Vollbild starten',
    'Exit fullscreen': 'Vollbild verlassen',
    'Fullscreen is not supported by this browser': 'Vollbild wird von diesem Browser nicht unterstützt',
    'Pixel Protocol 198X': 'Pixel Protocol 198X',
    'Community Chess | noah.dev': 'Community-Schach | noah.dev',
    'Mini Game | noah.dev': 'Minispiel | noah.dev',
    'Legal notice | noah.dev': 'Impressum | noah.dev',
    'Legal notice': 'Impressum',
    'Legal information': 'Rechtliches',
    'Angaben gemäß § 5 DDG, § 18 Abs. 2 MStV': 'Information pursuant to § 5 DDG and § 18 (2) MStV',
    'Angaben gemäß § 5 TMG': 'Information pursuant to § 5 TMG',
    'Contact': 'Kontakt',
    'Phone:': 'Telefon:',
    'Email:': 'E-Mail:',
    'Loading address...': 'Adresse wird geladen...',
    'Loading phone number...': 'Telefon wird geladen...',
    'Loading email...': 'E-Mail wird geladen...',
    'Germany': 'Deutschland',
    'Building and learning': 'Am Bauen und Lernen',
    'Crafted with Tailwind CSS & Apple-inspired aesthetics': 'Mit Tailwind CSS und Apple-inspiriertem Design gestaltet',
    'All rights reserved.': 'Alle Rechte vorbehalten.',
    'Interactive Lab': 'Interaktives Labor',
    'Owner sign in to play White in the noah.dev community chess game.': 'Melde dich als Besitzer an, um im Community-Schach von noah.dev Weiß zu spielen.',
    'Chess Owner Sign In | noah.dev': 'Schach-Login | noah.dev',
    'Chess Owner / Sign In': 'Schachbesitzer / Anmeldung',
    'Play as White': 'Als Weiß spielen',
    'Sign in as the owner to play White. Visitors can play Black without an account.': 'Melde dich als Besitzer an, um Weiß zu spielen. Besucher können ohne Konto Schwarz spielen.',
    'Username': 'Benutzername',
    'Password': 'Passwort',
    'Sign in': 'Anmelden',
    'Sign out': 'Abmelden',
    'Checking chess access…': 'Schachzugriff wird geprüft…',
    'Chess access could not be checked. Run the SQL setup and try again.': 'Der Schachzugriff konnte nicht geprüft werden. Führe das SQL-Setup aus und versuche es erneut.',
    'Owner access is configured. You play White.': 'Besitzerzugriff ist eingerichtet. Du spielst Weiß.',
    'This account does not have owner access.': 'Dieses Konto hat keinen Besitzerzugriff.',
    'Supabase is not configured for this site.': 'Supabase ist für diese Website nicht eingerichtet.',
    'Could not restore your sign-in session.': 'Die Anmeldesitzung konnte nicht wiederhergestellt werden.',
    'Signing in…': 'Anmeldung läuft…',
    'You are signed in as tsv3.': 'Du bist als tsv3 angemeldet.',
    'Sign in failed. Check your username and password.': 'Anmeldung fehlgeschlagen. Überprüfe Benutzername und Passwort.',
    'You are signed out.': 'Du bist abgemeldet.',
    'Could not sign out.': 'Abmeldung fehlgeschlagen.',
    'One-time setup': 'Einmalige Einrichtung',
    'Run': 'Führe',
    'in the Supabase SQL Editor.': 'im Supabase SQL Editor aus.',
    'Set a unique password with at least 16 characters in the ignored local file': 'Lege ein eigenes Passwort mit mindestens 16 Zeichen in der ignorierten lokalen Datei fest:',
    'then deploy': 'und deploye anschließend',
    'The first sign-in attempt prepares the private Supabase Auth account; only the password from that local file can sign in and claim White.': 'Der erste Anmeldeversuch richtet das private Supabase-Auth-Konto ein. Nur das Passwort aus dieser lokalen Datei kann sich anmelden und Weiß übernehmen.',
    'Move left': 'Nach links bewegen',
    'Move right': 'Nach rechts bewegen',
    'Jump': 'Springen',
    'Slide': 'Rutschen',
    'SCORE': 'PUNKTE',
    'BITS': 'BITS',
    'SECTOR': 'SEKTOR',
    'WARP': 'WARP',
    'SPUR:': 'SPUR:',
    'JUMP:': 'SPRUNG:',
    'SLIDE:': 'RUTSCHEN:',
    'NANO-SCHILD': 'NANO-SCHILD',
    '2X BOOST:': '2X-BOOST:',
    'TIME-WARP:': 'ZEIT-WARP:',
    'JUMP': 'SPRUNG',
    'SLIDE': 'RUTSCHEN',
    'MISSION FAILED': 'MISSION GESCHEITERT',
    'DISTANCE:': 'DISTANZ:',
    'BITS COLLECTED:': 'BITS GESAMMELT:',
    'ARCADE LEADERBOARD': 'ARCADE-BESTENLISTE',
    'YOUR NAME': 'DEIN NAME',
    'Your leaderboard name': 'Dein Name für das Leaderboard',
    'Submit score': 'EINTRAGEN',
    'RANK': 'RANG',
    'RETRY RUN': 'NOCHMAL SPIELEN',
    'SUPABASE SETUP NEEDED - LOCAL SCORES': 'SUPABASE-SETUP FEHLT - LOKALE PUNKTE',
    'GLOBAL TOP 50': 'WELTWEITE TOP 50',
    'OFFLINE - LOCAL SCORES': 'OFFLINE - LOKALE PUNKTE',
    'SCORE ONLINE GESPEICHERT': 'PUNKTE ONLINE GESPEICHERT',
    'NO RECORDS': 'KEINE EINTRÄGE',
    'NAME MUST BE 2-16 CHARACTERS': 'NAME MUSS 2-16 ZEICHEN LANG SEIN',
    'SENDING SCORE...': 'PUNKTE WERDEN GESENDET...',
    'UPLOAD FAILED - LOCAL SCORE KEPT:': 'UPLOAD FEHLGESCHLAGEN - LOKALE PUNKTE BEHALTEN:',
    'Game Over': 'Spiel vorbei',
    'START RUN': 'RUN STARTEN',
    'PRESS ANY KEY': 'TASTE DRÜCKEN'
  };
  const englishToGerman = new Map(Object.entries(translations));
  const germanToEnglish = new Map([...englishToGerman].map(([english, german]) => [german, english]));
  const languageButtons = document.querySelectorAll('[data-language]');
  const toggle = document.querySelector('#language-switch');
  const detectBrowserLanguage = () => {
    const navigatorLanguage = (navigator.language || '').toLowerCase();
    return navigatorLanguage.startsWith('de') ? 'de' : 'en';
  };
  const savedLanguage = localStorage.getItem(storageKey);
  let currentLanguage = savedLanguage && ['en', 'de'].includes(savedLanguage)
    ? savedLanguage
    : 'de';

  if (!savedLanguage) localStorage.setItem(storageKey, currentLanguage);

  const autoOption = document.querySelector('[data-language="auto"]');
  if (autoOption) {
    autoOption.textContent = 'AUTO';
  }

  function translateText(value, language) {
    const map = language === 'de' ? englishToGerman : germanToEnglish;
    const normalized = value.trim().replace(/\s+/g, ' ');
    let result = map.get(normalized);

    if (!result) {
      if (language === 'de') {
        result = normalized
          .replace(/^(\d+) half-moves?$/, (_, count) => `${count} ${count === '1' ? 'Halbzug' : 'Halbzüge'}`)
          .replace(/^New game starts in (\d+)s\.$/, 'Neues Spiel startet in $1 s.')
          .replace(/^Selected (.+)\. Choose a destination square\.$/, 'Feld $1 ausgewählt. Wähle ein Zielfeld.')
          .replace(/^Game drawn — (.+)\.$/, 'Remis — $1.')
          .replace(/^The game is a draw \((.+)\)\.$/, 'Das Spiel endet remis ($1).')
          .replace(/^(.+) wins by checkmate$/, '$1 gewinnt durch Schachmatt');
      } else {
        result = normalized
          .replace(/^(\d+) Halbzug(?:e)?$/, (_, count) => `${count} half-move${count === '1' ? '' : 's'}`)
          .replace(/^Neues Spiel startet in (\d+) s\.$/, 'New game starts in $1s.')
          .replace(/^Feld (.+) ausgewählt\. Wähle ein Zielfeld\.$/, 'Selected $1. Choose a destination square.')
          .replace(/^Remis — (.+)\.$/, 'Game drawn — $1.')
          .replace(/^Das Spiel endet remis \((.+)\)\.$/, 'The game is a draw ($1).')
          .replace(/^(.+) gewinnt durch Schachmatt$/, '$1 wins by checkmate');
      }
      if (result === normalized) return value;
    }

    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    return `${leading}${result}${trailing}`;
  }

  function translateNode(node, language) {
    if (node.nodeType === Node.TEXT_NODE) {
      const translated = translateText(node.nodeValue, language);
      if (translated !== node.nodeValue) node.nodeValue = translated;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.closest('script, style, pre, code, .material-symbols-outlined, #language-switch')) return;

    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let textNode;
    while ((textNode = walker.nextNode())) {
      if (!textNode.parentElement?.closest('script, style, pre, code, .material-symbols-outlined, #language-switch')) {
        const translated = translateText(textNode.nodeValue, language);
        if (translated !== textNode.nodeValue) textNode.nodeValue = translated;
      }
    }

    const attributeNodes = [node, ...node.querySelectorAll('[aria-label], [title], [placeholder], [alt]')];
    for (const element of attributeNodes) {
      for (const attribute of ['aria-label', 'title', 'placeholder', 'alt']) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        const translated = translateText(value, language);
        if (translated !== value) element.setAttribute(attribute, translated);
      }
    }
  }

  function updateLanguage(language, persist = true) {
    currentLanguage = language;
    if (persist) localStorage.setItem(storageKey, language);
    document.documentElement.lang = language;
    document.title = translateText(document.title, language);

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = translateText(description.content, language);
    }

    translateNode(document.body, language);
    languageButtons.forEach((button) => {
      const isActive = button.dataset.language === language;
      button.setAttribute('aria-pressed', String(isActive));
      button.classList.toggle('bg-white/[0.12]', isActive);
      button.classList.toggle('text-white', isActive);
      button.classList.toggle('text-gray-400', !isActive);
    });
    window.dispatchEvent(new Event('resize'));
  }

  toggle?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-language]');
    if (button) updateLanguage(button.dataset.language);
  });

  document.documentElement.lang = 'en';
  updateLanguage(currentLanguage, false);

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') {
        translateNode(record.target, currentLanguage);
      }
      if (record.type === 'attributes') {
        const value = record.target.getAttribute(record.attributeName);
        if (value) {
          const translated = translateText(value, currentLanguage);
          if (translated !== value) record.target.setAttribute(record.attributeName, translated);
        }
      }
      record.addedNodes?.forEach((node) => translateNode(node, currentLanguage));
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'title', 'placeholder', 'alt']
  });

  window.addEventListener('storage', (event) => {
    if (event.key === storageKey && (event.newValue === 'en' || event.newValue === 'de')) {
      updateLanguage(event.newValue, false);
    }
  });
})();