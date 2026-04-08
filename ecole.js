"use strict";
// Logique spécifique à la page Éducatif
const ecolePanel = document.getElementById("ecolePanel");
const ecolePanelContent = document.getElementById("ecolePanelContent");
const ecolePanelClose = document.getElementById("ecolePanelClose");
const nodeStates = {
    1: { status: "unlocked", stars: 0 },
    2: { status: "locked", stars: 0 },
    3: { status: "locked", stars: 0 },
};
let currentLevel = 1;
let currentGrade = "cp";
let currentScreen = null;
// ── Helpers ───────────────────────────────────────────────
function getLang() { return document.documentElement.lang || "fr"; }
function t(fr, en, he) {
    const l = getLang();
    return l === "he" ? he : l === "en" ? en : fr;
}
function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function wrongChoices(correct, min, max) {
    const set = new Set();
    let attempts = 0;
    while (set.size < 2 && attempts < 100) {
        attempts++;
        const range = Math.max(3, max - min);
        const delta = rnd(1, Math.max(1, Math.floor(range / 3))) * (rnd(0, 1) ? 1 : -1);
        const c = correct + delta;
        if (c !== correct && c >= min && c <= max)
            set.add(c);
    }
    for (let d = 1; set.size < 2; d++) {
        if (correct + d <= max)
            set.add(correct + d);
        if (set.size < 2 && correct - d >= min)
            set.add(correct - d);
    }
    return [...set].slice(0, 2);
}
function makeQuestion(level, grade) {
    if (grade === "cp") {
        switch (level) {
            case 1: {
                const emojis = ["🍎", "🌟", "🐠", "🌸", "🎈", "🦋", "🍄", "🐥", "🍉", "⭐"];
                const emoji = emojis[rnd(0, emojis.length - 1)];
                const count = rnd(1, 10);
                const choices = [count, ...wrongChoices(count, 1, 10)].sort(() => Math.random() - 0.5);
                return { text: t("Combien y en a-t-il ?", "How many?", "כמה יש?"), visual: emoji.repeat(count), answer: count, choices };
            }
            case 2: {
                const a = rnd(1, 10);
                const b = rnd(1, 20 - a);
                const ans = a + b;
                return { text: `${a} + ${b} = ?`, answer: ans, choices: [ans, ...wrongChoices(ans, 1, 20)].sort(() => Math.random() - 0.5) };
            }
            default: {
                const a = rnd(10, 50);
                const b = rnd(1, a);
                const ans = a - b;
                return { text: `${a} - ${b} = ?`, answer: ans, choices: [ans, ...wrongChoices(ans, 0, 50)].sort(() => Math.random() - 0.5) };
            }
        }
    }
    else {
        switch (level) {
            case 1: {
                if (rnd(0, 1) === 0) {
                    const a = rnd(10, 90);
                    const b = rnd(1, 100 - a);
                    const ans = a + b;
                    return { text: `${a} + ${b} = ?`, answer: ans, choices: [ans, ...wrongChoices(ans, 1, 100)].sort(() => Math.random() - 0.5) };
                }
                else {
                    const a = rnd(20, 100);
                    const b = rnd(1, a - 1);
                    const ans = a - b;
                    return { text: `${a} - ${b} = ?`, answer: ans, choices: [ans, ...wrongChoices(ans, 0, 100)].sort(() => Math.random() - 0.5) };
                }
            }
            case 2: {
                const mult = [2, 5, 10][rnd(0, 2)];
                const n = rnd(2, 10);
                const ans = n * mult;
                return { text: `${n} × ${mult} = ?`, answer: ans, choices: [ans, ...wrongChoices(ans, 2, 100)].sort(() => Math.random() - 0.5) };
            }
            default: {
                if (rnd(0, 1) === 0) {
                    const a = rnd(20, 80);
                    const b = rnd(5, a - 5);
                    const ans = a - b;
                    const txt = t(`Patapam a ${a} pommes. Il en mange ${b}. Combien en reste-t-il ?`, `Patapam has ${a} apples. He eats ${b}. How many are left?`, `לפטפם יש ${a} תפוחים. הוא אוכל ${b}. כמה נשארו?`);
                    return { text: txt, answer: ans, choices: [ans, ...wrongChoices(ans, 0, 80)].sort(() => Math.random() - 0.5) };
                }
                else {
                    const g = rnd(2, 9);
                    const e = [2, 5, 10][rnd(0, 2)];
                    const ans = g * e;
                    const txt = t(`Bobby a ${g} groupes de ${e} ballons. Combien en tout ?`, `Bobby has ${g} groups of ${e} balloons. How many in total?`, `לבובי יש ${g} קבוצות של ${e} בלונים. כמה בסך הכל?`);
                    return { text: txt, answer: ans, choices: [ans, ...wrongChoices(ans, 2, 100)].sort(() => Math.random() - 0.5) };
                }
            }
        }
    }
}
// ── Rendu des nœuds ───────────────────────────────────────
function renderNodes() {
    [1, 2, 3].forEach(level => {
        const btn = document.getElementById(`ecoleNode${level}`);
        const stars = document.getElementById(`ecoleStars${level}`);
        const state = nodeStates[level];
        btn.className = `ecole-node ecole-node--${state.status}`;
        btn.disabled = state.status === "locked";
        stars.textContent = state.stars > 0
            ? "★".repeat(state.stars) + "☆".repeat(3 - state.stars)
            : "";
    });
}
// ── Ouverture / fermeture panel ───────────────────────────
function openLevel(level) {
    currentLevel = level;
    ecolePanel.classList.add("is-open");
    if (level === 1) {
        showGradeSetup();
    }
    else {
        playQuestions(level, currentGrade, 0, 0);
    }
}
function closePanel() {
    ecolePanel.classList.remove("is-open");
    ecolePanelContent.innerHTML = "";
    currentScreen = null;
}
// ── Écran : choix CP / CE2 ────────────────────────────────
function showGradeSetup() {
    currentScreen = showGradeSetup;
    const title = t("Choisir le niveau", "Choose grade", "בחר כיתה");
    ecolePanelContent.innerHTML = `
        <div class="ecole-setup">
            <h2 class="ecole-setup__title">${title}</h2>
            <div class="ecole-setup__levels">
                <button class="ecole-grade-btn" data-grade="cp">${t("CP", "1st Grade", "כיתה א")}</button>
                <button class="ecole-grade-btn" data-grade="ce2">${t("CE2", "3rd Grade", "כיתה ג")}</button>
            </div>
        </div>
    `;
    ecolePanelContent.querySelectorAll(".ecole-grade-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            currentGrade = (btn.dataset.grade ?? "cp");
            playQuestions(currentLevel, currentGrade, 0, 0);
        });
    });
}
// ── Déroulement des questions ─────────────────────────────
const QUESTIONS_PER_LEVEL = 5;
function playQuestions(level, grade, index, errors) {
    currentScreen = null;
    if (index >= QUESTIONS_PER_LEVEL) {
        showLevelResult(level, errors === 0 ? 3 : errors === 1 ? 2 : 1);
        return;
    }
    const q = makeQuestion(level, grade);
    const backLabel = t("← Retour", "← Back", "← חזרה");
    ecolePanelContent.innerHTML = `
        <div class="ecole-question">
            <div class="ecole-question__header">
                <button class="ecole-back-btn" id="ecoleBackBtn">${backLabel}</button>
                <span class="ecole-progress">${index + 1} / ${QUESTIONS_PER_LEVEL}</span>
            </div>
            ${q.visual ? `<div class="ecole-visual">${q.visual}</div>` : ""}
            <div class="ecole-question__text">${q.text}</div>
            <div class="ecole-choices">
                ${q.choices.map(c => `<button class="ecole-choice-btn" data-val="${c}">${c}</button>`).join("")}
            </div>
        </div>
    `;
    document.getElementById("ecoleBackBtn")?.addEventListener("click", () => showGradeSetup());
    ecolePanelContent.querySelectorAll(".ecole-choice-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.classList.contains("is-correct") || btn.classList.contains("is-wrong"))
                return;
            const val = parseInt(btn.dataset.val);
            const isCorrect = val === q.answer;
            btn.classList.add(isCorrect ? "is-correct" : "is-wrong");
            if (!isCorrect) {
                ecolePanelContent.querySelectorAll(".ecole-choice-btn").forEach(b => {
                    if (parseInt(b.dataset.val) === q.answer)
                        b.classList.add("is-correct");
                });
            }
            setTimeout(() => playQuestions(level, grade, index + 1, isCorrect ? errors : errors + 1), 1000);
        });
    });
}
// ── Écran de résultat ─────────────────────────────────────
function showLevelResult(level, stars) {
    if (stars > nodeStates[level].stars)
        nodeStates[level].stars = stars;
    nodeStates[level].status = "done";
    if (level < 3)
        nodeStates[level + 1].status = "unlocked";
    renderNodes();
    const starsStr = "★".repeat(stars) + "☆".repeat(3 - stars);
    const msg = stars === 3 ? t("Parfait !", "Perfect!", "מושלם!")
        : stars === 2 ? t("Très bien !", "Well done!", "כל הכבוד!")
            : t("Continue !", "Keep going!", "המשך!");
    ecolePanelContent.innerHTML = `
        <div class="ecole-result">
            <div class="ecole-result__stars">${starsStr}</div>
            <div class="ecole-result__msg">${msg}</div>
            <div class="ecole-result__btns">
                <button class="ecole-grade-btn" id="ecoleRetryBtn">${t("Rejouer", "Play again", "שחק שוב")}</button>
                <button class="ecole-grade-btn ecole-grade-btn--secondary" id="ecoleFinishBtn">${t("Terminer", "Finish", "סיום")}</button>
            </div>
        </div>
    `;
    document.getElementById("ecoleRetryBtn")?.addEventListener("click", () => showGradeSetup());
    document.getElementById("ecoleFinishBtn")?.addEventListener("click", closePanel);
}
// ── Init ──────────────────────────────────────────────────
renderNodes();
[1, 2, 3].forEach(level => {
    document.getElementById(`ecoleNode${level}`)?.addEventListener("click", () => {
        if (nodeStates[level].status !== "locked")
            openLevel(level);
    });
});
ecolePanelClose.addEventListener("click", closePanel);
new MutationObserver(() => {
    if (ecolePanel.classList.contains("is-open") && currentScreen)
        currentScreen();
}).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
