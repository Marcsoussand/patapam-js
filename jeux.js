"use strict";
// Logique spécifique à la page Jeux
const panel = document.getElementById("gamePanel");
const panelContent = document.getElementById("gamePanelContent");
const btnClose = document.getElementById("gamePanelClose");
const btnTicTacToe = document.getElementById("btnTicTacToe");
const btnMemory = document.getElementById("btnMemory");
// ── Memory state ─────────────────────────────────────────
let memoryLevel = null;
let flipped = [];
let matchedCount = 0;
let locked = false;
let moveCount = 0;
let startTime = 0;
// ── Tic Tac Toe state ─────────────────────────────────────
let tttBoard = Array(9).fill("");
let tttPlayerMark = "X";
let tttAIMark = "O";
let tttDifficulty = "easy";
let tttLocked = false;
// ── Pendu state ───────────────────────────────────────────
let hangmanWord = null;
let hangmanGuessed = new Set();
let hangmanWrong = 0;
let hangmanKbMode = 'alpha'; // 'alpha' | 'kbd'
// ── Current screen (pour re-render au changement de langue) ───
let currentScreen = null;
const PATAPAM_IMAGES = [
    "patapam_debout", "tartuffe", "bobby", "mollasson",
    "patapon_le_cheval_marron", "dauphinou", "betachou", "dartagnan_le_cheval_blanc"
];
function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}
// ── Écran de sélection du niveau ─────────────────────────
function showMemorySetup() {
    currentScreen = showMemorySetup;
    const lang = document.documentElement.lang || "fr";
    const levelLabel = lang === "he" ? "רמה" : lang === "en" ? "Level" : "Niveau";
    panelContent.innerHTML = `
        <div class="memory-setup">
            <h2 class="memory-setup__title">Memory</h2>
            <p class="memory-setup__subtitle">${levelLabel}</p>
            <div class="memory-setup__levels">
                <button class="memory-level-btn" data-level="1">1</button>
                <button class="memory-level-btn" data-level="2">2</button>
                <button class="memory-level-btn" data-level="3">3</button>
            </div>
        </div>
    `;
    panelContent.querySelectorAll(".memory-level-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            memoryLevel = parseInt(btn.dataset.level);
            showMemoryTheme();
        });
    });
}
// ── Écran de sélection du thème ──────────────────────────
function showMemoryTheme() {
    panelContent.innerHTML = `
        <div class="memory-setup">
            <h2 class="memory-setup__title">Memory</h2>
            <div class="memory-setup__themes">
                <button class="memory-theme-btn" data-theme="patapam">
                    <img src="img/patapam_debout.png" alt="Patapam">
                </button>
                <button class="memory-theme-btn" data-theme="pokemon">
                    <img src="img/pokemon.svg.png" alt="Pokémon">
                </button>
            </div>
        </div>
    `;
    panelContent.querySelectorAll(".memory-theme-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            startMemory(btn.dataset.theme);
        });
    });
}
// ── Démarrage du jeu ─────────────────────────────────────
async function startMemory(theme) {
    const pairsCount = memoryLevel === 1 ? 4 : memoryLevel === 2 ? 6 : 8;
    if (theme === "patapam") {
        const pool = memoryLevel === 3 ? [...PATAPAM_IMAGES] : shuffle(PATAPAM_IMAGES).slice(0, pairsCount);
        buildMemoryBoard(pool.map(name => `img/${name}.png`));
    }
    else {
        // Pokémon : on interroge la PokeAPI pour obtenir l'URL officielle du sprite
        const ids = shuffle(Array.from({ length: 151 }, (_, i) => i + 1)).slice(0, pairsCount);
        const lang = document.documentElement.lang || "fr";
        const loadingMsg = lang === "he" ? "טוען..." : lang === "en" ? "Loading..." : "Chargement...";
        panelContent.innerHTML = `<div class="memory-setup"><p style="color:white;font-size:1.5rem">${loadingMsg}</p></div>`;
        try {
            const urls = await Promise.all(ids.map(id => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
                .then(r => r.json())
                .then((data) => data.sprites.other["official-artwork"].front_default)));
            buildMemoryBoard(urls);
        }
        catch {
            const errMsg = lang === "he" ? "שגיאה בטעינה — נסה שוב" : lang === "en" ? "Loading error — try again" : "Erreur de chargement — réessaie !";
            panelContent.innerHTML = `<div class="memory-setup"><p style="color:white;font-size:1.3rem">${errMsg}</p></div>`;
        }
    }
}
// ── Construction du plateau ──────────────────────────────
function buildMemoryBoard(imagePaths) {
    currentScreen = null;
    flipped = [];
    matchedCount = 0;
    locked = false;
    moveCount = 0;
    startTime = Date.now();
    const cards = shuffle([...imagePaths, ...imagePaths]);
    panelContent.innerHTML = `
        <div class="memory-board memory-board--${memoryLevel}">
            ${cards.map((src, i) => `
                <div class="memory-card" data-index="${i}" data-src="${src}">
                    <div class="memory-card__inner">
                        <div class="memory-card__back"></div>
                        <div class="memory-card__front">
                            <img src="${src}" alt="carte">
                        </div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
    panelContent.querySelectorAll(".memory-card").forEach(card => {
        card.addEventListener("click", () => flipCard(card));
    });
}
// ── Logique de jeu ───────────────────────────────────────
function flipCard(card) {
    if (locked || card.classList.contains("is-flipped") || card.classList.contains("is-matched"))
        return;
    card.classList.add("is-flipped");
    flipped.push(card);
    if (flipped.length === 2) {
        locked = true;
        checkMatch();
    }
}
function checkMatch() {
    const [a, b] = flipped;
    moveCount++;
    if (a.dataset.src === b.dataset.src) {
        a.classList.add("is-matched");
        b.classList.add("is-matched");
        matchedCount++;
        flipped = [];
        locked = false;
        const totalPairs = memoryLevel === 1 ? 4 : memoryLevel === 2 ? 6 : 8;
        if (matchedCount === totalPairs) {
            setTimeout(() => {
                const elapsed = Math.round((Date.now() - startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                const lang = document.documentElement.lang || "fr";
                const statsLabel = lang === "he"
                    ? `${moveCount} מהלכים — ${timeStr}`
                    : lang === "en"
                        ? `${moveCount} moves — ${timeStr}`
                        : `${moveCount} coups — ${timeStr}`;
                panelContent.innerHTML = `
                    <div class="memory-setup">
                        <h2 class="memory-setup__title">🎉 Bravo !</h2>
                        <p class="memory-setup__stats">${statsLabel}</p>
                        <button class="memory-level-btn" id="memoryRestart">↩</button>
                    </div>
                `;
                document.getElementById("memoryRestart")?.addEventListener("click", showMemorySetup);
            }, 600);
        }
    }
    else {
        setTimeout(() => {
            a.classList.remove("is-flipped");
            b.classList.remove("is-flipped");
            flipped = [];
            locked = false;
        }, 1000);
    }
}
// ── Tic Tac Toe : logique ────────────────────────────────
const TTT_WIN_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function checkTTTWinner(board) {
    for (const line of TTT_WIN_LINES) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], line };
        }
    }
    return null;
}
function tttAvailableCells(board) {
    return board.reduce((acc, v, i) => (v === "" ? [...acc, i] : acc), []);
}
function minimax(board, depth, isMaximizing) {
    const result = checkTTTWinner(board);
    if (result)
        return result.winner === tttAIMark ? 10 - depth : depth - 10;
    const available = tttAvailableCells(board);
    if (available.length === 0)
        return 0;
    if (isMaximizing) {
        let best = -Infinity;
        for (const i of available) {
            board[i] = tttAIMark;
            best = Math.max(best, minimax(board, depth + 1, false));
            board[i] = "";
        }
        return best;
    }
    else {
        let best = Infinity;
        for (const i of available) {
            board[i] = tttPlayerMark;
            best = Math.min(best, minimax(board, depth + 1, true));
            board[i] = "";
        }
        return best;
    }
}
function tttBestMove(board) {
    let bestScore = -Infinity;
    let bestIndex = -1;
    for (const i of tttAvailableCells(board)) {
        board[i] = tttAIMark;
        const score = minimax(board, 0, false);
        board[i] = "";
        if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
        }
    }
    return bestIndex;
}
function tttRandomMove(board) {
    const available = tttAvailableCells(board);
    return available[Math.floor(Math.random() * available.length)];
}
// ── Tic Tac Toe : écran 1 — choix du symbole ─────────────
function showTTTSetupMark() {
    currentScreen = showTTTSetupMark;
    const lang = document.documentElement.lang || "fr";
    const subtitle = lang === "he" ? "בחר:" : lang === "en" ? "Choose:" : "Choisissez :";
    panelContent.innerHTML = `
        <div class="memory-setup">
            <h2 class="memory-setup__title">Morpion</h2>
            <p class="memory-setup__subtitle">${subtitle}</p>
            <div class="memory-setup__levels">
                <button class="memory-level-btn ttt-mark-btn" data-mark="X">✕</button>
                <button class="memory-level-btn ttt-mark-btn" data-mark="O">○</button>
            </div>
        </div>
    `;
    panelContent.querySelectorAll(".ttt-mark-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            tttPlayerMark = btn.dataset.mark;
            tttAIMark = tttPlayerMark === "X" ? "O" : "X";
            showTTTSetupLevel();
        });
    });
}
// ── Tic Tac Toe : écran 2 — choix du niveau ──────────────
function showTTTSetupLevel() {
    currentScreen = showTTTSetupLevel;
    const lang = document.documentElement.lang || "fr";
    const subtitle = lang === "he" ? "רמה:" : lang === "en" ? "Difficulty:" : "Niveau :";
    const easy = lang === "he" ? "קל" : lang === "en" ? "Easy" : "Facile";
    const hard = lang === "he" ? "קשה" : lang === "en" ? "Hard" : "Difficile";
    panelContent.innerHTML = `
        <div class="memory-setup">
            <h2 class="memory-setup__title">Morpion</h2>
            <p class="memory-setup__subtitle">${subtitle}</p>
            <div class="memory-setup__levels">
                <button class="memory-level-btn ttt-diff-btn" data-diff="easy">${easy}</button>
                <button class="memory-level-btn ttt-diff-btn" data-diff="hard">${hard}</button>
            </div>
        </div>
    `;
    panelContent.querySelectorAll(".ttt-diff-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            tttDifficulty = btn.dataset.diff;
            startTicTacToe();
        });
    });
}
// ── Tic Tac Toe : plateau de jeu ─────────────────────────
function startTicTacToe() {
    currentScreen = null;
    tttBoard = Array(9).fill("");
    tttLocked = false;
    renderTTTBoard();
    if (tttAIMark === "X") {
        tttLocked = true;
        setTimeout(tttAIPlay, 500);
    }
}
function renderTTTBoard(winLine = []) {
    panelContent.innerHTML = `
        <div class="ttt-board">
            ${tttBoard.map((cell, i) => `
                <button
                    class="ttt-cell${cell ? ` ttt-cell--${cell.toLowerCase()}` : ""}${winLine.includes(i) ? " ttt-cell--winner" : ""}"
                    data-index="${i}"
                    ${cell || tttLocked ? "disabled" : ""}
                >${cell === "X" ? "✕" : cell === "O" ? "○" : ""}</button>
            `).join("")}
        </div>
    `;
    if (winLine.length === 0) {
        panelContent.querySelectorAll(".ttt-cell").forEach(cell => {
            cell.addEventListener("click", () => handleTTTClick(parseInt(cell.dataset.index)));
        });
    }
}
function handleTTTClick(index) {
    if (tttLocked || tttBoard[index] !== "")
        return;
    tttBoard[index] = tttPlayerMark;
    const win = checkTTTWinner(tttBoard);
    if (win) {
        renderTTTBoard(win.line);
        setTimeout(() => showTTTResult("win"), 600);
        return;
    }
    if (tttAvailableCells(tttBoard).length === 0) {
        renderTTTBoard();
        setTimeout(() => showTTTResult("draw"), 600);
        return;
    }
    tttLocked = true;
    renderTTTBoard();
    setTimeout(tttAIPlay, 500);
}
function tttAIPlay() {
    const idx = tttDifficulty === "hard" ? tttBestMove(tttBoard) : tttRandomMove(tttBoard);
    tttBoard[idx] = tttAIMark;
    const win = checkTTTWinner(tttBoard);
    if (win) {
        renderTTTBoard(win.line);
        setTimeout(() => showTTTResult("lose"), 600);
        return;
    }
    if (tttAvailableCells(tttBoard).length === 0) {
        renderTTTBoard();
        setTimeout(() => showTTTResult("draw"), 600);
        return;
    }
    tttLocked = false;
    renderTTTBoard();
}
function showTTTResult(result) {
    currentScreen = () => showTTTResult(result);
    const lang = document.documentElement.lang || "fr";
    const messages = {
        win: { fr: "🎉 Gagné !", en: "🎉 You win!", he: "🎉 ניצחת!" },
        lose: { fr: "😢 Perdu !", en: "😢 You lose!", he: "😢 הפסדת!" },
        draw: { fr: "🤝 Nul !", en: "🤝 Draw!", he: "🤝 תיקו!" }
    };
    const msg = messages[result][lang] ?? messages[result]["fr"];
    panelContent.innerHTML = `
        <div class="memory-setup">
            <h2 class="memory-setup__title">${msg}</h2>
            <button class="memory-level-btn" id="tttRestart">↩</button>
        </div>
    `;
    document.getElementById("tttRestart")?.addEventListener("click", showTTTSetupMark);
}
// ── Ouverture / fermeture du panel ───────────────────────
function openGame(game) {
    if (game === "memory") {
        showMemorySetup();
    }
    else if (game === "patapaf") {
        showPatapafSetup();
    }
    else if (game === "hangman") {
        showHangman();
    }
    else {
        showTTTSetupMark();
    }
    panel.classList.add("is-open");
}
function closeGame() {
    panel.classList.remove("is-open");
    panel.classList.remove("game-panel--patapaf");
    panelContent.innerHTML = "";
    memoryLevel = null;
    tttBoard = Array(9).fill("");
    tttLocked = false;
    currentScreen = null;
    // État Patapaf
    patapafGrid = [];
    patapafFaceUpIndices = [];
    patapafScores = [[], []];
    patapafLocked = false;
    patapafAIMemory = new Map();
    // État Pendu
    hangmanWord = null;
    hangmanGuessed = new Set();
    hangmanWrong = 0;
}
btnTicTacToe.addEventListener("click", () => openGame("tictactoe"));
btnMemory.addEventListener("click", () => openGame("memory"));
btnClose.addEventListener("click", closeGame);
document.getElementById("btnPatapaf").addEventListener("click", () => openGame("patapaf"));
document.getElementById("btnHangman").addEventListener("click", () => openGame("hangman"));
// ── Re-render l'ecran courant au changement de langue ─────────
new MutationObserver(() => {
    if (panel.classList.contains("is-open") && currentScreen) {
        currentScreen();
    }
}).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

// ════════════════════════════════════════════════════════════
// ██  PATAPAF – CHASSE AUX TRÉSORS                         ██
// ════════════════════════════════════════════════════════════

// ── Définition des cartes ─────────────────────────────────
const PATAPAF_CARD_DEFS = [
    { type: "patapam",   img: "patapam_debout",          setValue: 4, count: 8,  isDragon: false, isSpider: false },
    { type: "tartuffe",  img: "tartuffe",                 setValue: 3, count: 6,  isDragon: false, isSpider: false },
    { type: "bobby",     img: "bobby",                    setValue: 2, count: 4,  isDragon: false, isSpider: false },
    { type: "mollasson", img: "mollasson",                setValue: 2, count: 4,  isDragon: false, isSpider: false },
    { type: "patapon",   img: "patapon_le_cheval_marron", setValue: 2, count: 4,  isDragon: false, isSpider: false },
    { type: "dauphinou", img: "dauphinou",                setValue: 1, count: 8,  isDragon: false, isSpider: false },
    { type: "betachou",  img: "betachou",                 setValue: 0, count: 12, isDragon: true,  isSpider: false },
    { type: "rene",      img: "rene_le_poney",            setValue: 0, count: 3,  isDragon: false, isSpider: true  },
];

// ── État du jeu ───────────────────────────────────────────
let patapafGrid = [];
let patapafCurrentPlayer = 0;
let patapafScores = [[], []];
let patapafFaceUpIndices = [];
let patapafMode = "pvp";
let patapafAILevel = 1;
let patapafLocked = false;
let patapafAIMemory = new Map();
let patapafAIFlipsTarget = 0;
let patapafAIFlipsDone = 0;

// ── Écran de sélection du mode ────────────────────────────
function showPatapafSetup() {
    currentScreen = showPatapafSetup;
    panelContent.innerHTML = `
        <div class="memory-setup">
            <h2 class="memory-setup__title">🗺️ Chasse aux Trésors</h2>
            <p class="memory-setup__subtitle">Mode de jeu :</p>
            <div class="memory-setup__levels">
                <button class="memory-level-btn patapaf-mode-btn" data-mode="pvp"
                    style="min-width:8rem;font-size:1.2rem;height:auto;padding:0.6rem 0.5rem;line-height:1.4">
                    👥<br>2 Joueurs
                </button>
                <button class="memory-level-btn patapaf-mode-btn" data-mode="ai"
                    style="min-width:8rem;font-size:1.2rem;height:auto;padding:0.6rem 0.5rem;line-height:1.4">
                    🤖<br>vs IA
                </button>
            </div>
            <button class="memory-level-btn" id="patapafRulesBtn"
                style="min-width:7rem;font-size:1rem;height:auto;padding:0.4rem 1rem">
                📖 Règles
            </button>
        </div>
    `;
    panelContent.querySelectorAll(".patapaf-mode-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            patapafMode = btn.dataset.mode;
            if (patapafMode === "ai") showPatapafAISetup();
            else startPatapaf();
        });
    });
    document.getElementById("patapafRulesBtn")?.addEventListener("click", () => showPatapafRules(false));
}

// ── Écran de sélection du niveau IA ──────────────────────
function showPatapafAISetup() {
    currentScreen = showPatapafAISetup;
    panelContent.innerHTML = `
        <div class="memory-setup">
            <h2 class="memory-setup__title">🤖 Niveau de l'IA</h2>
            <div class="memory-setup__levels" style="flex-wrap:wrap;justify-content:center;gap:1rem">
                <button class="memory-level-btn patapaf-ai-btn" data-level="1"
                    style="min-width:8rem;font-size:1.1rem;height:auto;padding:0.6rem 0.5rem;line-height:1.4">
                    🎲<br>Aléatoire
                </button>
                <button class="memory-level-btn patapaf-ai-btn" data-level="2"
                    style="min-width:8rem;font-size:1.1rem;height:auto;padding:0.6rem 0.5rem;line-height:1.4">
                    🛡️<br>Prudent
                </button>
                <button class="memory-level-btn patapaf-ai-btn" data-level="3"
                    style="min-width:8rem;font-size:1.1rem;height:auto;padding:0.6rem 0.5rem;line-height:1.4">
                    🧠<br>Malin
                </button>
            </div>
        </div>
    `;
    panelContent.querySelectorAll(".patapaf-ai-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            patapafAILevel = parseInt(btn.dataset.level);
            startPatapaf();
        });
    });
}

// ── Règles du jeu ─────────────────────────────────────────
function showPatapafRules(fromGame) {
    const lang = document.documentElement.lang || "fr";
    const texts = {
        fr: {
            title: "📖 Règles",
            objective: "<b>🎯 Objectif :</b> Remporte le plus de cartes en explorant le monde de Patapam. Mais attention à Bétachou et René le Poney !",
            how: "<b>🃏 Comment jouer :</b> À ton tour, clique sur une carte pour la retourner. Tu peux continuer d'en retourner d'autres pour compléter des ensembles… ou t'arrêter et cliquer sur <i>✅ Je ramasse</i> pour garder les ensembles complets. Les cartes qui ne forment pas d'ensemble sont remises face cachée en fin de tour.",
            sets: "<b>🏷 Ensembles :</b> Le chiffre sur chaque carte indique combien il en faut. Dauphinou : 1 &nbsp;·&nbsp; Bobby / Mollasson / Patapon : 2 &nbsp;·&nbsp; Tartuffe : 3 &nbsp;·&nbsp; Patapam : 4",
            example: "<b>📌 Exemple :</b> Tu retournes 2 Bobby, 4 Tartuffe, 1 Mollasson et 2 Patapon. En t'arrêtant, tu gardes 2 Bobby, 3 Tartuffe et 2 Patapon. Si tu continues et tombes sur un Bétachou ou René, tu perds tout.",
            betachou: "<b>🐲 Bétachou :</b> Si tu retournes un Bétachou <em>après</em> un trésor → tour terminé, tout repart face cachée. Si Bétachou est la <em>première</em> carte dévoilée, continue : tu peux accumuler des Bétachou ! Si tu ne retournes que des Bétachou, tu peux tous les garder. Celui qui a le plus de Bétachou à la fin reçoit les 3 cartes René en bonus (en cas d'égalité, personne ne les reçoit).",
            rene: "<b>🐴 René le Poney :</b> Toutes les cartes retournées repartent face cachée. Tour terminé, rien ramassé.",
            end: "<b>🏁 Fin de partie :</b> Quand il ne reste que les 3 cartes René en jeu, la partie s'arrête. Les cartes René vont au joueur avec le plus de Bétachou. Le joueur avec le plus de cartes gagne. En cas d'égalité, celui avec le plus de Bétachou l'emporte.",
            back: "↩",
        },
        en: {
            title: "📖 Rules",
            objective: "<b>🎯 Objective:</b> Collect the most cards by exploring the world of Patapam. But watch out for Bétachou and René le Poney!",
            how: "<b>🃏 How to play:</b> On your turn, click a card to flip it face up. Keep flipping more to build complete sets… or stop and click <i>✅ Collect</i> to keep your completed sets. Cards that don't form a complete set are flipped back at the end of your turn.",
            sets: "<b>🏷 Sets:</b> The number on each card shows how many you need. Dauphinou: 1 &nbsp;·&nbsp; Bobby / Mollasson / Patapon: 2 &nbsp;·&nbsp; Tartuffe: 3 &nbsp;·&nbsp; Patapam: 4",
            example: "<b>📌 Example:</b> You flip 2 Bobby, 4 Tartuffe, 1 Mollasson and 2 Patapon. By stopping, you keep 2 Bobby, 3 Tartuffe and 2 Patapon. If you keep going and hit a Bétachou or René, you lose everything.",
            betachou: "<b>🐲 Bétachou:</b> If you flip a Bétachou <em>after</em> a treasure card → turn over, all flip back. If Bétachou is the <em>first</em> card you flip, keep going — you can collect multiple Bétachous! If you flip only Bétachous, you can keep them all. The player with the most Bétachous at the end receives the 3 René cards as a bonus (if tied, nobody gets them).",
            rene: "<b>🐴 René le Poney:</b> All face-up cards flip back. Turn over, nothing collected.",
            end: "<b>🏁 End of game:</b> When only the 3 René cards remain in play, the game ends. René cards go to the player with the most Bétachous. Most cards wins. If tied, most Bétachous wins.",
            back: "↩",
        },
        he: {
            title: "📖 חוקים",
            objective: "<b>🎯 מטרה:</b> אסוף כמה שיותר קלפים בעולמו של Patapam. אבל היזהר מ-Bétachou ומ-René le Poney!",
            how: "<b>🃏 איך משחקים:</b> בתורך, לחץ על קלף להפכו פנים למעלה. המשך להפוך קלפים נוספים כדי להשלים אוספים… או עצור ולחץ <i>✅ אסוף</i> לשמור על האוספים השלמים. קלפים שלא השלימו אוסף חוזרים פנים למטה בסוף התור.",
            sets: "<b>🏷 אוספים:</b> המספר על כל קלף מציין כמה צריך. Dauphinou: 1 &nbsp;·&nbsp; Bobby / Mollasson / Patapon: 2 &nbsp;·&nbsp; Tartuffe: 3 &nbsp;·&nbsp; Patapam: 4",
            example: "<b>📌 דוגמה:</b> הפכת 2 Bobby, 4 Tartuffe, 1 Mollasson ו-2 Patapon. אם תעצור, תשמור 2 Bobby, 3 Tartuffe ו-2 Patapon. אם תמשיך ותפגוש Bétachou או René, תפסיד הכל.",
            betachou: "<b>🐲 Bétachou:</b> הפכת Bétachou <em>אחרי</em> קלף אוצר → סוף התור, הכל חוזר פנים למטה. אם Bétachou הוא <em>הקלף הראשון</em> שהפכת, תוכל להמשיך ולאסוף עוד Bétachou! אם הפכת רק Bétachou, תוכל לשמור את כולם. מי שיש לו הכי הרבה Bétachou בסוף מקבל את 3 קלפי René בונוס (בשוויון — אף אחד לא מקבל).",
            rene: "<b>🐴 René le Poney:</b> כל הקלפים הפוכים חוזרים פנים למטה. סוף התור, לא אוספים כלום.",
            end: "<b>🏁 סיום המשחק:</b> כשנשארים רק 3 קלפי René בשולחן, המשחק נגמר. קלפי René ניתנים לשחקן עם הכי הרבה Bétachou. מי שיש לו הכי הרבה קלפים מנצח. בשוויון — מי שיש לו הכי הרבה Bétachou מנצח.",
            back: "↩",
        },
    };
    const t = texts[lang] || texts.fr;
    panel.classList.add("game-panel--opaque");
    panelContent.innerHTML = `
        <div class="patapaf-rules">
            <h2 class="patapaf-rules__title">${t.title}</h2>
            <div class="patapaf-rules__body">
                <p class="patapaf-rules__row">${t.objective}</p>
                <p class="patapaf-rules__row">${t.how}</p>
                <p class="patapaf-rules__row">${t.sets}</p>
                <p class="patapaf-rules__row">${t.example}</p>
                <p class="patapaf-rules__row">${t.betachou}</p>
                <p class="patapaf-rules__row">${t.rene}</p>
                <p class="patapaf-rules__row">${t.end}</p>
            </div>
            <button class="memory-level-btn" id="patapafRulesBack" style="margin-top:0.5rem">${t.back}</button>
        </div>
    `;
    document.getElementById("patapafRulesBack")?.addEventListener("click", () => {
        panel.classList.remove("game-panel--opaque");
        if (fromGame) renderPatapaf();
        else showPatapafSetup();
    });
}

// ── Démarrage du jeu ─────────────────────────────────────
function startPatapaf() {
    currentScreen = null;
    panel.classList.add("game-panel--patapaf");

    // Construire le paquet (49 cartes)
    patapafGrid = [];
    for (const def of PATAPAF_CARD_DEFS) {
        for (let i = 0; i < def.count; i++) {
            patapafGrid.push({
                type: def.type,
                img: def.img,
                setValue: def.setValue,
                isDragon: def.isDragon,
                isSpider: def.isSpider,
                faceUp: false,
                collected: false,
            });
        }
    }
    // Mélange de Fisher-Yates
    for (let i = patapafGrid.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [patapafGrid[i], patapafGrid[j]] = [patapafGrid[j], patapafGrid[i]];
    }

    patapafCurrentPlayer = 0;
    patapafScores = [[], []];
    patapafFaceUpIndices = [];
    patapafLocked = false;
    patapafAIMemory = new Map();
    patapafAIFlipsTarget = 0;
    patapafAIFlipsDone = 0;

    renderPatapaf();
}

// ── Rendu principal ───────────────────────────────────────
function renderPatapaf() {
    const isHumanTurn = patapafCurrentPlayer === 0 || patapafMode === "pvp";
    const allBetachou = patapafFaceUpIndices.length > 0 &&
        patapafFaceUpIndices.every(i => patapafGrid[i].isDragon);
    const hasCompleteSet = !allBetachou && patapafCheckHasCompleteSet();
    const canCollect = (allBetachou || hasCompleteSet) && !patapafLocked && isHumanTurn;
    const p1Name = patapafMode === "pvp" ? "🔵 Bleu" : "👤 Toi";
    const p2Name = patapafMode === "pvp" ? "🟢 Vert" : "🤖 IA";
    const betachou0 = patapafScores[0].filter(c => c.isDragon).length;
    const betachou1 = patapafScores[1].filter(c => c.isDragon).length;
    const n = patapafFaceUpIndices.length;

    let statusText;
    if (patapafMode === "ai" && patapafCurrentPlayer === 1 && patapafLocked) {
        statusText = "🤖 L'IA réfléchit…";
    } else if (n === 0) {
        const who = patapafMode === "pvp"
            ? (patapafCurrentPlayer === 0 ? "🔵" : "🟢")
            : "👤";
        statusText = `${who} Retourne une carte`;
    } else if (allBetachou) {
        statusText = `🐲 ${n} Bétachou !`;
    } else {
        statusText = `${n} carte${n > 1 ? "s" : ""} visible${n > 1 ? "s" : ""}`;
    }

    panelContent.innerHTML = `
        <div class="patapaf-container">
            <div class="patapaf-scores">
                <div class="patapaf-score patapaf-score--blue${patapafCurrentPlayer === 0 ? " patapaf-score--active" : ""}">
                    <div class="patapaf-score__name">${p1Name}</div>
                    <div class="patapaf-score__count">🃏 ${patapafScores[0].length}</div>
                    <div class="patapaf-score__details">🐲 ${betachou0}</div>
                </div>
                <button class="patapaf-collect-btn" id="patapafCollectBtn" ${canCollect ? "" : "disabled"}>
                    ✅ Je ramasse
                </button>
                <div class="patapaf-status">${statusText}</div>
                <button class="patapaf-info-btn" id="patapafInfoBtn" title="Règles">ⓘ</button>
                <div class="patapaf-score patapaf-score--green${patapafCurrentPlayer === 1 ? " patapaf-score--active" : ""}">
                    <div class="patapaf-score__name">${p2Name}</div>
                    <div class="patapaf-score__count">🃏 ${patapafScores[1].length}</div>
                    <div class="patapaf-score__details">🐲 ${betachou1}</div>
                </div>
            </div>
            <div class="patapaf-grid${patapafLocked ? ' patapaf-grid--locked' : ''}" id="patapafGrid">
                ${patapafGrid.map((card, i) => patapafRenderCard(card, i)).join("")}
            </div>
        </div>
    `;

    if (!patapafLocked && isHumanTurn) {
        panelContent.querySelectorAll(".patapaf-card:not(.is-flipped):not(.is-collected)").forEach(el => {
            el.addEventListener("click", () => handlePatapafCardClick(parseInt(el.dataset.index)));
        });
    }
    document.getElementById("patapafCollectBtn")?.addEventListener("click", patapafPlayerCollect);
    document.getElementById("patapafInfoBtn")?.addEventListener("click", () => showPatapafRules(true));
}

function patapafRenderCard(card, i) {
    const badge = (!card.isDragon && !card.isSpider && card.setValue >= 1)
        ? `<span class="patapaf-card__badge">${card.setValue}</span>`
        : "";
    const cls = [
        "patapaf-card",
        card.faceUp    ? "is-flipped"              : "",
        card.collected ? "is-collected"             : "",
        card.isDragon  ? "patapaf-card--betachou"   : "",
        card.isSpider  ? "patapaf-card--rene"       : "",
    ].filter(Boolean).join(" ");

    return `
        <div class="${cls}" data-index="${i}">
            <div class="patapaf-card__inner">
                <div class="patapaf-card__back"></div>
                <div class="patapaf-card__front">
                    <img src="img/${card.img}.png" alt="${card.type}" loading="lazy">
                    ${badge}
                </div>
            </div>
        </div>
    `;
}

// ── Vérifie s'il y a au moins un jeu complet retourné ────
function patapafCheckHasCompleteSet() {
    const byType = {};
    patapafFaceUpIndices.forEach(idx => {
        const c = patapafGrid[idx];
        if (!c.isDragon && !c.isSpider) {
            if (!byType[c.type]) byType[c.type] = { count: 0, sv: c.setValue };
            byType[c.type].count++;
        }
    });
    return Object.values(byType).some(t => t.count >= t.sv);
}

// ── Ramasse les jeux complets pour le joueur donné ───────
function patapafCollectSets(player) {
    const byType = {};
    patapafFaceUpIndices.forEach(idx => {
        const c = patapafGrid[idx];
        if (!c.isDragon && !c.isSpider) {
            if (!byType[c.type]) byType[c.type] = [];
            byType[c.type].push(idx);
        }
    });
    for (const indices of Object.values(byType)) {
        const sv = patapafGrid[indices[0]].setValue;
        const toCollect = Math.floor(indices.length / sv) * sv;
        for (let i = 0; i < toCollect; i++) {
            patapafGrid[indices[i]].collected = true;
            patapafGrid[indices[i]].faceUp = false;
            patapafScores[player].push({ ...patapafGrid[indices[i]] });
        }
        for (let i = toCollect; i < indices.length; i++) {
            patapafGrid[indices[i]].faceUp = false;
        }
    }
    patapafFaceUpIndices = [];
}

// ── Retournement d'une carte (logique commune humain/IA) ──
// animDelay : ms d'affichage avant traitement (null = auto selon type de carte)
// thinkDelay : ms avant que l'IA rappelle patapafAIDecide
function patapafDoFlip(idx, animDelay = null, thinkDelay = 800) {
    const card = patapafGrid[idx];
    if (card.faceUp || card.collected) return;

    patapafLocked = true;
    card.faceUp = true;
    patapafFaceUpIndices.push(idx);
    patapafAIMemory.set(idx, card.type);

    renderPatapaf();

    const baseDelay = card.isSpider || (card.isDragon && !patapafFaceUpIndices.every(i => patapafGrid[i].isDragon)) ? 1200 : 380;
    setTimeout(() => {
        if (card.isSpider) {
            // René le Poney : tout repart face cachée
            patapafFaceUpIndices.forEach(i => { patapafGrid[i].faceUp = false; });
            patapafFaceUpIndices = [];
            renderPatapaf();
            setTimeout(() => patapafEndTurn(), 600);

        } else if (card.isDragon) {
            // Bétachou : vérifie si TOUS les visibles sont Bétachou
            const allAreBetachou = patapafFaceUpIndices.every(i => patapafGrid[i].isDragon);
            if (allAreBetachou) {
                // Mode Bétachou pur : débloque le joueur (peut continuer ou ramasser)
                // Délai anti-triche : garde la grille verrouillée 250ms après l'animation
                // pour éviter les clics rapides qui révèlent des cartes involontairement
                const humanUnlockDelay = (patapafMode === "ai" && patapafCurrentPlayer === 1) ? 0 : 250;
                setTimeout(() => {
                    patapafLocked = false;
                    renderPatapaf();
                    if (patapafMode === "ai" && patapafCurrentPlayer === 1) {
                        setTimeout(patapafAIDecide, thinkDelay);
                    }
                }, humanUnlockDelay);
            } else {
                // Mélange trésor + Bétachou → tout repart face cachée, rien ramassé
                patapafFaceUpIndices.forEach(i => { patapafGrid[i].faceUp = false; });
                patapafFaceUpIndices = [];
                renderPatapaf();
                setTimeout(() => patapafEndTurn(), 600);
            }

        } else {
            // Carte trésor : vérifie si des Bétachou étaient déjà face visibles
            const hadBetachou = patapafFaceUpIndices
                .filter(i => i !== idx)
                .some(i => patapafGrid[i].isDragon);
            if (hadBetachou) {
                // On était en mode Bétachou et on tombe sur un trésor → tout repart
                patapafFaceUpIndices.forEach(i => { patapafGrid[i].faceUp = false; });
                patapafFaceUpIndices = [];
                renderPatapaf();
                setTimeout(() => patapafEndTurn(), 600);
            } else {
                // Mode trésor normal : le joueur peut continuer ou ramasser
                // Délai anti-triche identique au cas Bétachou
                const humanUnlockDelay = (patapafMode === "ai" && patapafCurrentPlayer === 1) ? 0 : 250;
                setTimeout(() => {
                    patapafLocked = false;
                    renderPatapaf();
                    if (patapafMode === "ai" && patapafCurrentPlayer === 1) {
                        setTimeout(patapafAIDecide, thinkDelay);
                    }
                }, humanUnlockDelay);
            }
        }
    }, animDelay ?? baseDelay);
}

// ── Clic humain ───────────────────────────────────────────
function handlePatapafCardClick(idx) {
    if (patapafLocked) return;
    if (patapafMode === "ai" && patapafCurrentPlayer === 1) return;
    const card = patapafGrid[idx];
    if (card.faceUp || card.collected) return;
    patapafDoFlip(idx);
}

// ── Le joueur décide de ramasser ──────────────────────────
function patapafPlayerCollect() {
    if (patapafLocked) return;
    const allBetachou = patapafFaceUpIndices.length > 0 &&
        patapafFaceUpIndices.every(i => patapafGrid[i].isDragon);
    if (allBetachou) {
        // Ramasse tous les Bétachou visibles
        patapafLocked = true;
        patapafFaceUpIndices.forEach(i => {
            patapafGrid[i].faceUp = false;
            patapafGrid[i].collected = true;
            patapafScores[patapafCurrentPlayer].push({ ...patapafGrid[i] });
        });
        patapafFaceUpIndices = [];
        renderPatapaf();
        setTimeout(() => patapafEndTurn(), 300);
    } else if (patapafCheckHasCompleteSet()) {
        patapafLocked = true;
        patapafCollectSets(patapafCurrentPlayer);
        renderPatapaf();
        setTimeout(() => patapafEndTurn(), 300);
    }
}

// ── Fin de tour ───────────────────────────────────────────
function patapafEndTurn() {
    // Remettre face cachée toutes les cartes encore visibles
    patapafFaceUpIndices.forEach(i => { patapafGrid[i].faceUp = false; });
    patapafFaceUpIndices = [];

    // Vérifier fin de partie (toutes sauf René ramassées)
    if (patapafGrid.every(c => c.collected || c.isSpider)) {
        showPatapafResult();
        return;
    }

    patapafCurrentPlayer = 1 - patapafCurrentPlayer;
    patapafLocked = false;
    patapafAIFlipsTarget = 0;
    patapafAIFlipsDone = 0;
    renderPatapaf();

    if (patapafMode === "ai" && patapafCurrentPlayer === 1) {
        patapafLocked = true;
        renderPatapaf();
        setTimeout(patapafAIStartTurn, 1100);
    }
}

// ── Tour de l'IA ──────────────────────────────────────────
function patapafAIStartTurn() {
    if (patapafAILevel === 1) {
        patapafAIFlipsTarget = 1 + Math.floor(Math.random() * 3); // 1 à 3 cartes
        patapafAIFlipsDone = 0;
    }
    patapafAIDecide();
}

function patapafAIDecide() {
    const remaining = patapafGrid.filter(c => !c.faceUp && !c.collected);
    if (remaining.length === 0) { patapafEndTurn(); return; }

    if (patapafAILevel === 1) {
        // Niveau 1 – Aléatoire : retourne 1 à 3 cartes au hasard
        if (patapafAIFlipsDone >= patapafAIFlipsTarget) {
            patapafAIDoCollect();
        } else {
            patapafAIPickAndFlip(false);
        }

    } else if (patapafAILevel === 2) {
        // Niveau 2 – Prudent : ramasse dès qu'il peut collecter quoi que ce soit
        if (patapafCheckHasCompleteSet()) {
            patapafAIDoCollect();
        } else {
            patapafAIPickAndFlip(true);
        }

    } else {
        // Niveau 3 – Malin : stratégie équilibrée
        if (patapafAISmartShouldStop()) {
            if (patapafCheckHasCompleteSet()) {
                patapafAIDoCollect();
            } else {
                patapafAIPickAndFlip(true); // pas encore de jeu complet, continue
            }
        } else {
            patapafAIPickAndFlip(true);
        }
    }
}

// Décision d'arrêt pour le niveau 3
function patapafAISmartShouldStop() {
    const byType = {};
    patapafFaceUpIndices.forEach(idx => {
        const c = patapafGrid[idx];
        if (!c.isDragon && !c.isSpider) {
            if (!byType[c.type]) byType[c.type] = { count: 0, sv: c.setValue };
            byType[c.type].count++;
        }
    });
    const collectableNow = Object.values(byType).reduce(
        (s, t) => s + Math.floor(t.count / t.sv) * t.sv, 0
    );

    // Arrête si le butin est intéressant (≥3 cartes collectables)
    if (collectableNow >= 3) return true;

    // Arrête si le risque est trop élevé (>38% de cartes dangereuses restantes)
    const faceDown = patapafGrid.filter(c => !c.faceUp && !c.collected);
    const dangerous = faceDown.filter(c => c.isDragon || c.isSpider);
    if (faceDown.length > 0 && dangerous.length / faceDown.length > 0.38) return true;

    // Arrête si on a du butin mais plus de positions sûres connues
    if (collectableNow >= 1 && patapafAIKnownSafeIndices().length === 0) return true;

    // Arrête après 6 cartes retournées dans le même tour (évite de trop risquer)
    if (patapafFaceUpIndices.length >= 6) return true;

    return false;
}

// Positions connues comme sûres en mémoire
function patapafAIKnownSafeIndices() {
    return patapafGrid
        .map((c, i) => ({ c, i }))
        .filter(({ c, i }) =>
            !c.faceUp && !c.collected &&
            patapafAIMemory.has(i) &&
            !patapafGrid[i].isDragon && !patapafGrid[i].isSpider
        )
        .map(({ i }) => i);
}

// Choisit et retourne une carte (avec ou sans mémoire)
function patapafAIPickAndFlip(useMemory) {
    const faceDown = patapafGrid
        .map((c, i) => (!c.faceUp && !c.collected ? i : -1))
        .filter(i => i >= 0);
    if (faceDown.length === 0) { patapafEndTurn(); return; }

    let targetIdx;
    let isKnownCard = false;
    if (useMemory) {
        const knownSafe = patapafAIKnownSafeIndices();
        if (knownSafe.length > 0) {
            // Préfère les cartes qui complètent un jeu en cours
            knownSafe.sort((a, b) => {
                const tA = patapafGrid[a].type;
                const tB = patapafGrid[b].type;
                const inProgA = patapafFaceUpIndices.filter(i => patapafGrid[i].type === tA).length;
                const inProgB = patapafFaceUpIndices.filter(i => patapafGrid[i].type === tB).length;
                if (inProgB !== inProgA) return inProgB - inProgA;
                return (patapafGrid[b].setValue || 0) - (patapafGrid[a].setValue || 0);
            });
            targetIdx = knownSafe[0];
            isKnownCard = true;
        } else {
            // Cartes jamais vues : choisit parmi les inconnues
            // Si des trésors sont déjà face visibles, évite les Bétachou/René connus
            const hasTreasuresUp = patapafFaceUpIndices.some(i => !patapafGrid[i].isDragon && !patapafGrid[i].isSpider);
            const unknown = faceDown.filter(i => !patapafAIMemory.has(i));
            let pool = unknown.length > 0 ? unknown : faceDown;
            if (hasTreasuresUp) {
                const safePool = pool.filter(i => {
                    const seen = patapafAIMemory.get(i);
                    return !seen || (!patapafGrid[i].isDragon && !patapafGrid[i].isSpider);
                });
                if (safePool.length > 0) pool = safePool;
            }
            targetIdx = pool[Math.floor(Math.random() * pool.length)];
        }
    } else {
        targetIdx = faceDown[Math.floor(Math.random() * faceDown.length)];
    }

    patapafAIFlipsDone++;
    // Cartes connues : animation raccourcie (180ms) + réflexion plus courte (350ms)
    patapafDoFlip(targetIdx, isKnownCard ? 180 : null, isKnownCard ? 350 : 800);
}

function patapafAIDoCollect() {
    if (patapafCheckHasCompleteSet()) {
        patapafCollectSets(patapafCurrentPlayer);
        renderPatapaf();
        setTimeout(() => patapafEndTurn(), 500);
    } else {
        patapafEndTurn();
    }
}

// ── Résultat final ────────────────────────────────────────
function showPatapafResult() {
    currentScreen = null;
    panel.classList.remove("game-panel--patapaf");

    const betachou0 = patapafScores[0].filter(c => c.isDragon).length;
    const betachou1 = patapafScores[1].filter(c => c.isDragon).length;
    let rene0 = 0, rene1 = 0;
    if (betachou0 > betachou1) rene0 = 3;
    else if (betachou1 > betachou0) rene1 = 3;

    const total0 = patapafScores[0].length + rene0;
    const total1 = patapafScores[1].length + rene1;
    const p1Name = patapafMode === "pvp" ? "🔵 Joueur Bleu" : "👤 Toi";
    const p2Name = patapafMode === "pvp" ? "🟢 Joueur Vert" : "🤖 IA";

    let winnerMsg;
    if (total0 > total1)      winnerMsg = patapafMode === "pvp" ? "🏆 Joueur Bleu gagne !" : "🏆 Tu gagnes !";
    else if (total1 > total0) winnerMsg = patapafMode === "pvp" ? "🏆 Joueur Vert gagne !" : "😅 L'IA gagne !";
    else                       winnerMsg = "🤝 Égalité !";

    const reneNote0 = rene0 > 0 ? `<div style="font-size:0.9rem;color:#90ee90">+3 🐴 René</div>` : "";
    const reneNote1 = rene1 > 0 ? `<div style="font-size:0.9rem;color:#90ee90">+3 🐴 René</div>` : "";

    panelContent.innerHTML = `
        <div class="memory-setup">
            <h2 class="memory-setup__title">${winnerMsg}</h2>
            <div style="display:flex;gap:3rem;color:white;font-family:'Lilita One',cursive;text-align:center;align-items:center">
                <div>
                    <div style="font-size:1.1rem;margin-bottom:0.3rem">${p1Name}</div>
                    <div style="font-size:1.7rem">${patapafScores[0].length} cartes</div>
                    <div style="font-size:0.85rem;opacity:0.8">🐲 ${betachou0} Bétachou</div>
                    ${reneNote0}
                    <div style="font-size:2rem;color:#FFD700;margin-top:0.3rem">${total0} pts</div>
                </div>
                <div>
                    <div style="font-size:1.1rem;margin-bottom:0.3rem">${p2Name}</div>
                    <div style="font-size:1.7rem">${patapafScores[1].length} cartes</div>
                    <div style="font-size:0.85rem;opacity:0.8">🐲 ${betachou1} Bétachou</div>
                    ${reneNote1}
                    <div style="font-size:2rem;color:#FFD700;margin-top:0.3rem">${total1} pts</div>
                </div>
            </div>
            <button class="memory-level-btn" id="patapafRestart">↩</button>
        </div>
    `;
    document.getElementById("patapafRestart")?.addEventListener("click", showPatapafSetup);
}

// ════════════════════════════════════════════════════════════
// ██  PENDU / HANGMAN                                       ██
// ════════════════════════════════════════════════════════════

// ── Bibliothèque de mots ─────────────────────────────────
const HANGMAN_WORDS = [
    // Famille
    { fr: "Papa",     en: "Papa",   he: "אבא" },
    { fr: "Maman",    en: "Maman",  he: "אמא" },
    { fr: "Aaron",    en: "Aaron",  he: "אהרון" },
    { fr: "Naor",     en: "Naor",   he: "נאור" },
    { fr: "Elon",     en: "Elon",   he: "אלון" },
    // Corps
    { fr: "Tête",     en: "Head",   he: "ראש" },
    { fr: "Main",     en: "Hand",   he: "יד" },
    { fr: "Pied",     en: "Foot",   he: "רגל" },
    { fr: "Oreilles", en: "Ears",   he: "אוזניים" },
    { fr: "Bouche",   en: "Mouth",  he: "פה" },
    // Animaux
    { fr: "Lion",         en: "Lion",          he: "אריה" },
    { fr: "Tigre",        en: "Tiger",         he: "נמר" },
    { fr: "Vache",        en: "Cow",           he: "פרה" },
    { fr: "Tortue",       en: "Turtle",        he: "צב" },
    { fr: "Hippopotame",  en: "Hippopotamus",  he: "היפופוטם" },
    // Jouets
    { fr: "Ballon",   en: "Ball",     he: "כדור" },
    { fr: "Voiture",  en: "Car",      he: "מכונית" },
    { fr: "Robot",    en: "Robot",    he: "רובוט" },
    { fr: "Peluche",  en: "Plushie",  he: "בובה רכה" },
    { fr: "Cubes",    en: "Blocks",   he: "קוביות" },
    // Nourriture
    { fr: "Compote",  en: "Compote",  he: "קומפוט" },
    { fr: "Gâteau",   en: "Cake",     he: "עוגה" },
    { fr: "Banane",   en: "Banana",   he: "בננה" },
    { fr: "Pomme",    en: "Apple",    he: "תפוח" },
    { fr: "Carotte",  en: "Carrot",   he: "גזר" },
    // Héros de Patapam
    { fr: "Patapam",   en: "Patapam",   he: "פטפם" },
    { fr: "Tartuffe",  en: "Tartuffe",  he: "טרטוף" },
    { fr: "Betachou",  en: "Betachou",  he: "בטאשו" },
    { fr: "Dauphinou", en: "Dauphinou", he: "דופינו" },
    { fr: "Mollasson", en: "Mollasson", he: "מולאסון" },
    { fr: "Patapon le cheval marron",   en: "Patapon the brown horse",   he: "פטפון הסוס החום" },
    { fr: "Gascar le cheval noir",      en: "Gascar the black horse",    he: "גסקר הסוס השחור" },
    { fr: "D\u2019Artagnan le cheval blanc", en: "D\u2019Artagnan the white horse", he: "דארטניאן הסוס הלבן" },
    { fr: "Ouistiti le cheval gris",    en: "Ouistiti the grey horse",   he: "אוויסטיטי הסוס האפור" },
    { fr: "Ren\u00e9 le poney",         en: "Ren\u00e9 the pony",        he: "רנה הפוני" },
];

// ── Normalisation des caractères ─────────────────────────
const HANGMAN_ACCENT_MAP = {
    '\u00e9': 'e', '\u00e8': 'e', '\u00ea': 'e', '\u00eb': 'e',
    '\u00e0': 'a', '\u00e2': 'a', '\u00e4': 'a',
    '\u00f9': 'u', '\u00fb': 'u', '\u00fc': 'u',
    '\u00ee': 'i', '\u00ef': 'i',
    '\u00f4': 'o', '\u00f6': 'o', '\u0153': 'o',
    '\u00e7': 'c', '\u00e6': 'ae',
};
const HANGMAN_HE_SOFIT = { '\u05da': '\u05db', '\u05dd': '\u05de', '\u05df': '\u05e0', '\u05e3': '\u05e4', '\u05e5': '\u05e6' };

function hangmanNormalize(ch, lang) {
    if (lang === 'he') {
        // Supprimer nikud et signes diacritiques (U+0591–U+05C7) + geresh/gershayim
        const base = ch.replace(/[\u0591-\u05c7\u05f3\u05f4]/g, '');
        return HANGMAN_HE_SOFIT[base] ?? base;
    }
    return HANGMAN_ACCENT_MAP[ch] ?? ch;
}

// ── Claviers virtuels ─────────────────────────────────────
// Mode alphabétique (par défaut)
const HANGMAN_ALPHA = {
    fr: [
        ['A','B','C','D','E','F','G','H','I'],
        ['J','K','L','M','N','O','P','Q','R'],
        ['S','T','U','V','W','X','Y','Z'],
    ],
    en: [
        ['A','B','C','D','E','F','G','H','I'],
        ['J','K','L','M','N','O','P','Q','R'],
        ['S','T','U','V','W','X','Y','Z'],
    ],
    he: [
        ['\u05d0','\u05d1','\u05d2','\u05d3','\u05d4','\u05d5','\u05d6','\u05d7'],
        ['\u05d8','\u05d9','\u05db','\u05dc','\u05de','\u05e0','\u05e1','\u05e2'],
        ['\u05e4','\u05e6','\u05e7','\u05e8','\u05e9','\u05ea'],
    ],
};
// Mode disposition clavier (AZERTY / QWERTY / clavier hébreu)
const HANGMAN_KEYBOARDS = {
    fr: [
        ['A','Z','E','R','T','Y','U','I','O','P'],
        ['Q','S','D','F','G','H','J','K','L','M'],
        ['W','X','C','V','B','N'],
    ],
    en: [
        ['Q','W','E','R','T','Y','U','I','O','P'],
        ['A','S','D','F','G','H','J','K','L'],
        ['Z','X','C','V','B','N','M'],
    ],
    he: [
        ['/','ק','ר','א','ט','ו','ן','ם','פ'],
        ['ש','ד','ג','כ','ע','י','ח','ל','ך'],
        ['ז','ס','ב','ה','נ','מ','צ','ת','ץ'],
    ],
};

// ── Démarrage / re-démarrage ──────────────────────────────
function showHangman() {
    currentScreen = showHangman;
    const lang = document.documentElement.lang || 'fr';
    const pool = HANGMAN_WORDS.filter(w => {
        const word = w[lang] ?? w.fr;
        return [...word].filter(ch => /\p{L}/u.test(ch)).length >= 3;
    });
    hangmanWord = pool[Math.floor(Math.random() * pool.length)];
    hangmanGuessed = new Set();
    hangmanWrong = 0;
    hangmanKbMode = 'alpha';
    renderHangmanGame();
}

// ── Vérification victoire ─────────────────────────────────
function isHangmanWon() {
    if (!hangmanWord) return false;
    const lang = document.documentElement.lang || 'fr';
    const word = hangmanWord[lang] ?? hangmanWord.fr;
    for (const ch of word) {
        if (!/\p{L}/u.test(ch)) continue;
        const n = hangmanNormalize(lang === 'he' ? ch : ch.toLowerCase(), lang);
        if (!hangmanGuessed.has(n)) return false;
    }
    return true;
}

// ── Traitement d'une touche ───────────────────────────────
function processHangmanKey(rawKey) {
    if (!hangmanWord || hangmanWrong >= 8 || isHangmanWon()) return;
    const lang = document.documentElement.lang || 'fr';
    const normalized = hangmanNormalize(lang === 'he' ? rawKey : rawKey.toLowerCase(), lang);
    if (!normalized || !/\p{L}/u.test(normalized)) return;
    if (hangmanGuessed.has(normalized)) return;
    hangmanGuessed.add(normalized);
    const word = hangmanWord[lang] ?? hangmanWord.fr;
    const hasMatch = [...word].some(ch =>
        /\p{L}/u.test(ch) &&
        hangmanNormalize(lang === 'he' ? ch : ch.toLowerCase(), lang) === normalized
    );
    if (!hasMatch) hangmanWrong++;
    renderHangmanGame();
    if (hangmanWrong >= 8) setTimeout(() => showHangmanResult(false), 700);
    else if (isHangmanWon()) setTimeout(() => showHangmanResult(true), 500);
}

// ── Rendu principal ───────────────────────────────────────
function renderHangmanGame() {
    const lang = document.documentElement.lang || 'fr';
    const word = hangmanWord[lang] ?? hangmanWord.fr;
    const isHe = lang === 'he';
    const won = isHangmanWon();
    const lost = hangmanWrong >= 8;

    // Mosaïque Bétachou (2 colonnes × 4 rangées)
    let betachouHtml = '';
    for (let i = 0; i < 8; i++) {
        betachouHtml += `<div class="hangman-betachou__cell${i < hangmanWrong ? ' is-revealed' : ''}"></div>`;
    }

    // Affichage du mot lettre par lettre
    let wordHtml = '';
    for (const ch of word) {
        if (ch === ' ') {
            wordHtml += `<span class="hangman-space"></span>`;
        } else if (ch === "'" || ch === '\u2019' || ch === '-') {
            wordHtml += `<span class="hangman-punc">${ch === '\u2019' ? "'" : ch}</span>`;
        } else if (/\p{L}/u.test(ch)) {
            const n = hangmanNormalize(isHe ? ch : ch.toLowerCase(), lang);
            const revealed = hangmanGuessed.has(n) || lost;
            wordHtml += `<span class="hangman-letter">` +
                `<span class="hangman-letter__char">${revealed ? ch : ''}</span>` +
                `<span class="hangman-letter__line"></span>` +
                `</span>`;
        }
    }

    // Points d'erreur (8 max)
    let dotsHtml = '';
    for (let i = 0; i < 8; i++) {
        dotsHtml += `<div class="hangman-error-dot${i < hangmanWrong ? ' is-filled' : ''}"></div>`;
    }

    // Clavier virtuel
    const kbLayout = hangmanKbMode === 'alpha'
        ? (HANGMAN_ALPHA[lang] || HANGMAN_ALPHA.fr)
        : (HANGMAN_KEYBOARDS[lang] || HANGMAN_KEYBOARDS.fr);
    let kbHtml = '';
    for (const row of kbLayout) {
        kbHtml += `<div class="hangman-keyboard-row">`;
        for (const key of row) {
            const n = hangmanNormalize(isHe ? key : key.toLowerCase(), lang);
            const used = hangmanGuessed.has(n);
            const correct = used && [...word].some(ch =>
                /\p{L}/u.test(ch) && hangmanNormalize(isHe ? ch : ch.toLowerCase(), lang) === n
            );
            const cls = used ? (correct ? ' is-correct' : ' is-wrong') : '';
            const disabled = used || lost || won;
            kbHtml += `<button class="hangman-key${cls}" data-key="${key}"${disabled ? ' disabled' : ''}>${key}</button>`;
        }
        kbHtml += `</div>`;
    }

    const toggleLabel = hangmanKbMode === 'alpha' ? '⌨️' : '🔡';
    const toggleTitle = hangmanKbMode === 'alpha'
        ? (isHe ? 'פריסת מקלדת' : lang === 'en' ? 'Keyboard layout' : 'Disposition clavier')
        : (isHe ? 'אבג סדר' : lang === 'en' ? 'Alphabetical' : 'Ordre alphabétique');

    panelContent.innerHTML = `
        <div class="hangman-game">
            <div class="hangman-top">
                <div class="hangman-betachou">${betachouHtml}</div>
                <div class="hangman-word-area">
                    <div class="hangman-word" dir="${isHe ? 'rtl' : 'ltr'}">${wordHtml}</div>
                </div>
            </div>
            <div class="hangman-errors">${dotsHtml}</div>
            <div class="hangman-kb-area">
                <button class="hangman-kb-toggle" id="hangmanKbToggle" title="${toggleTitle}">${toggleLabel}</button>
                <div class="hangman-keyboard">${kbHtml}</div>
            </div>
        </div>
        <input id="hangmanInput" class="hangman-hidden-input"
            type="text" inputmode="text"
            autocomplete="off" autocorrect="off" autocapitalize="off"
            spellcheck="false" maxlength="2">
    `;

    // Clavier virtuel : clics sur les touches
    panelContent.querySelectorAll('.hangman-key').forEach(btn => {
        btn.addEventListener('click', () => processHangmanKey(btn.dataset.key));
    });

    // Bouton toggle alpha ↔ disposition clavier
    document.getElementById('hangmanKbToggle')?.addEventListener('click', () => {
        hangmanKbMode = hangmanKbMode === 'alpha' ? 'kbd' : 'alpha';
        renderHangmanGame();
    });

    // Input caché : capture le clavier physique (desktop) et natif (mobile)
    const hiddenInput = document.getElementById('hangmanInput');
    if (hiddenInput) {
        hiddenInput.addEventListener('input', e => {
            const val = e.target.value;
            e.target.value = '';
            if (val) processHangmanKey(val[0]);
        });
        // Auto-focus pour desktop
        if (!lost && !won) setTimeout(() => hiddenInput.focus(), 80);
    }
}

// ── Écran de résultat ─────────────────────────────────────
function showHangmanResult(won) {
    currentScreen = null;
    const lang = document.documentElement.lang || 'fr';
    const title = won
        ? (lang === 'he' ? '🎉 ניצחת!' : lang === 'en' ? '🎉 You won!' : '🎉 Bravo !')
        : (lang === 'he' ? '😢 בטאשו ניצח!' : lang === 'en' ? '😢 Bétachou wins!' : '😢 Bétachou a gagné !');
    const wordDisplay = hangmanWord ? (hangmanWord[lang] ?? hangmanWord.fr) : '';
    panelContent.innerHTML = `
        <div class="memory-setup">
            <h2 class="memory-setup__title">${title}</h2>
            ${!won ? `<p class="memory-setup__subtitle" style="opacity:0.85">${wordDisplay}</p>` : ''}
            <button class="memory-level-btn" id="hangmanRestart">↩</button>
        </div>
    `;
    document.getElementById('hangmanRestart')?.addEventListener('click', showHangman);
}
