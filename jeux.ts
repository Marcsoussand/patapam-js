// Logique spécifique à la page Jeux

const panel = document.getElementById("gamePanel") as HTMLDivElement;
const panelContent = document.getElementById("gamePanelContent") as HTMLDivElement;
const btnClose = document.getElementById("gamePanelClose") as HTMLButtonElement;
const btnTicTacToe = document.getElementById("btnTicTacToe") as HTMLButtonElement;
const btnMemory = document.getElementById("btnMemory") as HTMLButtonElement;

// ── Memory state ─────────────────────────────────────────
let memoryLevel: 1 | 2 | 3 | null = null;
let flipped: HTMLElement[] = [];
let matchedCount = 0;
let locked = false;
let moveCount = 0;
let startTime = 0;

// ── Tic Tac Toe state ─────────────────────────────────────
let tttBoard: string[] = Array(9).fill("");
let tttPlayerMark: "X" | "O" = "X";
let tttAIMark: "X" | "O" = "O";
let tttDifficulty: "easy" | "hard" = "easy";
let tttLocked = false;

// ── Current screen (pour re-render au changement de langue) ───
let currentScreen: (() => void) | null = null;

const PATAPAM_IMAGES: string[] = [
    "patapam_debout", "tartuffe", "bobby", "mollasson",
    "patapon_le_cheval_marron", "dauphinou", "betachou", "dartagnan_le_cheval_blanc"
];

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

// ── Écran de sélection du niveau ─────────────────────────
function showMemorySetup(): void {
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

    panelContent.querySelectorAll<HTMLButtonElement>(".memory-level-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            memoryLevel = parseInt(btn.dataset.level!) as 1 | 2 | 3;
            showMemoryTheme();
        });
    });
}

// ── Écran de sélection du thème ──────────────────────────
function showMemoryTheme(): void {
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

    panelContent.querySelectorAll<HTMLButtonElement>(".memory-theme-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            startMemory(btn.dataset.theme as "patapam" | "pokemon");
        });
    });
}

// ── Démarrage du jeu ─────────────────────────────────────
async function startMemory(theme: "patapam" | "pokemon"): Promise<void> {
    const pairsCount = memoryLevel === 1 ? 4 : memoryLevel === 2 ? 6 : 8;

    if (theme === "patapam") {
        const pool = memoryLevel === 3 ? [...PATAPAM_IMAGES] : shuffle(PATAPAM_IMAGES).slice(0, pairsCount);
        buildMemoryBoard(pool.map(name => `img/${name}.png`));
    } else {
        // Pokémon : on interroge la PokeAPI pour obtenir l'URL officielle du sprite
        const ids = shuffle(Array.from({ length: 151 }, (_, i) => i + 1)).slice(0, pairsCount);
        const lang = document.documentElement.lang || "fr";
        const loadingMsg = lang === "he" ? "טוען..." : lang === "en" ? "Loading..." : "Chargement...";
        panelContent.innerHTML = `<div class="memory-setup"><p style="color:white;font-size:1.5rem">${loadingMsg}</p></div>`;
        try {
            const urls = await Promise.all(
                ids.map(id =>
                    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
                        .then(r => r.json())
                        .then((data: any) => data.sprites.other["official-artwork"].front_default as string)
                )
            );
            buildMemoryBoard(urls);
        } catch {
            const errMsg = lang === "he" ? "שגיאה בטעינה — נסה שוב" : lang === "en" ? "Loading error — try again" : "Erreur de chargement — réessaie !";
            panelContent.innerHTML = `<div class="memory-setup"><p style="color:white;font-size:1.3rem">${errMsg}</p></div>`;
        }
    }
}

// ── Construction du plateau ──────────────────────────────
function buildMemoryBoard(imagePaths: string[]): void {
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

    panelContent.querySelectorAll<HTMLElement>(".memory-card").forEach(card => {
        card.addEventListener("click", () => flipCard(card));
    });
}

// ── Logique de jeu ───────────────────────────────────────
function flipCard(card: HTMLElement): void {
    if (locked || card.classList.contains("is-flipped") || card.classList.contains("is-matched")) return;

    card.classList.add("is-flipped");
    flipped.push(card);

    if (flipped.length === 2) {
        locked = true;
        checkMatch();
    }
}

function checkMatch(): void {
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
    } else {
        setTimeout(() => {
            a.classList.remove("is-flipped");
            b.classList.remove("is-flipped");
            flipped = [];
            locked = false;
        }, 1000);
    }
}

// ── Tic Tac Toe : logique ────────────────────────────────
const TTT_WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function checkTTTWinner(board: string[]): { winner: string; line: number[] } | null {
    for (const line of TTT_WIN_LINES) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], line };
        }
    }
    return null;
}

function tttAvailableCells(board: string[]): number[] {
    return board.reduce<number[]>((acc, v, i) => (v === "" ? [...acc, i] : acc), []);
}

function minimax(board: string[], depth: number, isMaximizing: boolean): number {
    const result = checkTTTWinner(board);
    if (result) return result.winner === tttAIMark ? 10 - depth : depth - 10;
    const available = tttAvailableCells(board);
    if (available.length === 0) return 0;
    if (isMaximizing) {
        let best = -Infinity;
        for (const i of available) {
            board[i] = tttAIMark;
            best = Math.max(best, minimax(board, depth + 1, false));
            board[i] = "";
        }
        return best;
    } else {
        let best = Infinity;
        for (const i of available) {
            board[i] = tttPlayerMark;
            best = Math.min(best, minimax(board, depth + 1, true));
            board[i] = "";
        }
        return best;
    }
}

function tttBestMove(board: string[]): number {
    let bestScore = -Infinity;
    let bestIndex = -1;
    for (const i of tttAvailableCells(board)) {
        board[i] = tttAIMark;
        const score = minimax(board, 0, false);
        board[i] = "";
        if (score > bestScore) { bestScore = score; bestIndex = i; }
    }
    return bestIndex;
}

function tttRandomMove(board: string[]): number {
    const available = tttAvailableCells(board);
    return available[Math.floor(Math.random() * available.length)];
}

// ── Tic Tac Toe : écran 1 — choix du symbole ─────────────
function showTTTSetupMark(): void {
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
    panelContent.querySelectorAll<HTMLButtonElement>(".ttt-mark-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            tttPlayerMark = btn.dataset.mark as "X" | "O";
            tttAIMark = tttPlayerMark === "X" ? "O" : "X";
            showTTTSetupLevel();
        });
    });
}

// ── Tic Tac Toe : écran 2 — choix du niveau ──────────────
function showTTTSetupLevel(): void {
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
    panelContent.querySelectorAll<HTMLButtonElement>(".ttt-diff-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            tttDifficulty = btn.dataset.diff as "easy" | "hard";
            startTicTacToe();
        });
    });
}

// ── Tic Tac Toe : plateau de jeu ─────────────────────────
function startTicTacToe(): void {
    currentScreen = null;
    tttBoard = Array(9).fill("");
    tttLocked = false;
    renderTTTBoard();
    if (tttAIMark === "X") {
        tttLocked = true;
        setTimeout(tttAIPlay, 500);
    }
}

function renderTTTBoard(winLine: number[] = []): void {
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
        panelContent.querySelectorAll<HTMLButtonElement>(".ttt-cell").forEach(cell => {
            cell.addEventListener("click", () => handleTTTClick(parseInt(cell.dataset.index!)));
        });
    }
}

function handleTTTClick(index: number): void {
    if (tttLocked || tttBoard[index] !== "") return;
    tttBoard[index] = tttPlayerMark;
    const win = checkTTTWinner(tttBoard);
    if (win) { renderTTTBoard(win.line); setTimeout(() => showTTTResult("win"), 600); return; }
    if (tttAvailableCells(tttBoard).length === 0) { renderTTTBoard(); setTimeout(() => showTTTResult("draw"), 600); return; }
    tttLocked = true;
    renderTTTBoard();
    setTimeout(tttAIPlay, 500);
}

function tttAIPlay(): void {
    const idx = tttDifficulty === "hard" ? tttBestMove(tttBoard) : tttRandomMove(tttBoard);
    tttBoard[idx] = tttAIMark;
    const win = checkTTTWinner(tttBoard);
    if (win) { renderTTTBoard(win.line); setTimeout(() => showTTTResult("lose"), 600); return; }
    if (tttAvailableCells(tttBoard).length === 0) { renderTTTBoard(); setTimeout(() => showTTTResult("draw"), 600); return; }
    tttLocked = false;
    renderTTTBoard();
}

function showTTTResult(result: "win" | "lose" | "draw"): void {
    currentScreen = () => showTTTResult(result);
    const lang = document.documentElement.lang || "fr";
    const messages: Record<string, Record<string, string>> = {
        win:  { fr: "🎉 Gagné !",  en: "🎉 You win!",  he: "🎉 ניצחת!" },
        lose: { fr: "😢 Perdu !",  en: "😢 You lose!", he: "😢 הפסדת!" },
        draw: { fr: "🤝 Nul !",    en: "🤝 Draw!",     he: "🤝 תיקו!" }
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
function openGame(game: "tictactoe" | "memory"): void {
    if (game === "memory") {
        showMemorySetup();
    } else {
        showTTTSetupMark();
    }
    panel.classList.add("is-open");
}

function closeGame(): void {
    panel.classList.remove("is-open");
    panelContent.innerHTML = "";
    memoryLevel = null;
    tttBoard = Array(9).fill("");
    tttLocked = false;
    currentScreen = null;
}

btnTicTacToe.addEventListener("click", () => openGame("tictactoe"));
btnMemory.addEventListener("click", () => openGame("memory"));
btnClose.addEventListener("click", closeGame);

// ── Re-render l'ecran courant au changement de langue ─────────
new MutationObserver(() => {
    if (panel.classList.contains("is-open") && currentScreen) {
        currentScreen();
    }
}).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
