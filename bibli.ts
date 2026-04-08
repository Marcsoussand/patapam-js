// Logique spécifique à la page Bibliothèque

const readingPanel = document.getElementById("readingPanel") as HTMLDivElement;
const readingPanelContent = document.getElementById("readingPanelContent") as HTMLDivElement;
const readingPanelClose = document.getElementById("readingPanelClose") as HTMLButtonElement;
const btnCartons = document.getElementById("btnCartons") as HTMLButtonElement;
const cardOverlay = document.getElementById("cardOverlay") as HTMLDivElement;
const cardOverlayStop = document.getElementById("cardOverlayStop") as HTMLButtonElement;
const cardOverlayWord = document.getElementById("cardOverlayWord") as HTMLDivElement;

let currentCartonScreen: (() => void) | null = null;
let currentAgeGroup: "young" | "older" | null = null;
let currentCategory: string | null = null;
let learnTimer: ReturnType<typeof setTimeout> | null = null;
let currentAudio: HTMLAudioElement | null = null;

// ── Helpers ───────────────────────────────────────────────
function getLang(): string { return document.documentElement.lang || "fr"; }
function t(fr: string, en: string, he: string): string {
    const l = getLang();
    return l === "he" ? he : l === "en" ? en : fr;
}

function fitText(el: HTMLElement): void {
    requestAnimationFrame(() => {
        const maxW = (el.parentElement?.clientWidth ?? window.innerWidth) * 0.92;
        const maxH = (el.parentElement?.clientHeight ?? window.innerHeight) * 0.80;
        let size = Math.min(maxH, maxW);
        el.style.fontSize = size + "px";
        while ((el.scrollWidth > maxW || el.scrollHeight > maxH) && size > 20) {
            size -= 4;
            el.style.fontSize = size + "px";
        }
    });
}

function fitTextBtn(el: HTMLElement): void {
    requestAnimationFrame(() => requestAnimationFrame(() => {
        const w = el.clientWidth  || window.innerWidth  * 0.44;
        const h = el.clientHeight || window.innerHeight * 0.70;
        let size = Math.min(w * 0.90, h * 0.85);
        el.style.fontSize = size + "px";
        while ((el.scrollWidth > w || el.scrollHeight > h) && size > 12) {
            size -= 4;
            el.style.fontSize = size + "px";
        }
    }));
}

// ── Données cartons ───────────────────────────────────────
interface CardWord { fr: string; en: string; he: string; audio: string; }
interface CartonCategory { key: string; words: CardWord[]; }

const YOUNG_CATEGORIES: CartonCategory[] = [
    {
        key: "famille",
        words: [
            { fr: "papa",        en: "Papa",         he: "אבא",     audio: "audio/young/famille/papa.m4a" },
            { fr: "maman",       en: "Maman",        he: "אמא",    audio: "audio/young/famille/maman.m4a" },
            { fr: "aaron",       en: "Aaron",        he: "אהרון",    audio: "audio/young/famille/aaron.m4a" },
            { fr: "naor",        en: "Naor",         he: "נאור",     audio: "audio/young/famille/naor.m4a" },
            { fr: "elon",        en: "Elon",         he: "אלון",     audio: "audio/young/famille/elon.m4a" },
        ],
    },
    {
        key: "corps",
        words: [
            { fr: "tête",        en: "Head",         he: "ראש",      audio: "audio/young/corps/tete.m4a" },
            { fr: "main",        en: "Hand",         he: "יד",       audio: "audio/young/corps/main.m4a" },
            { fr: "pied",        en: "Foot",         he: "רגל",      audio: "audio/young/corps/pied.m4a" },
            { fr: "oreilles",    en: "Ears",         he: "אוזניים",  audio: "audio/young/corps/oreilles.m4a" },
            { fr: "bouche",      en: "Mouth",        he: "פה",       audio: "audio/young/corps/bouche.m4a" },
        ],
    },
    {
        key: "animaux",
        words: [
            { fr: "lion",        en: "Lion",         he: "אריה",     audio: "audio/young/animaux/lion.m4a" },
            { fr: "tigre",       en: "Tiger",        he: "נמר",      audio: "audio/young/animaux/tigre.m4a" },
            { fr: "vache",       en: "Cow",          he: "פרה",      audio: "audio/young/animaux/vache.m4a" },
            { fr: "tortue",      en: "Turtle",       he: "צב",       audio: "audio/young/animaux/tortue.m4a" },
            { fr: "hippopotame", en: "Hippopotamus", he: "היפופוטם", audio: "audio/young/animaux/hippopotame.m4a" },
        ],
    },
    {
        key: "jouets",
        words: [
            { fr: "Ballon",      en: "Ball",         he: "כדור",     audio: "audio/young/jouets/ballon.m4a" },
            { fr: "Voiture",     en: "Car",          he: "מכונית",   audio: "audio/young/jouets/voiture.m4a" },
            { fr: "Robot",       en: "Robot",        he: "רובוט",    audio: "audio/young/jouets/robot.m4a" },
            { fr: "Peluche",     en: "Plushie",      he: "בובה רכה", audio: "audio/young/jouets/peluche.m4a" },
            { fr: "Cubes",       en: "Blocks",       he: "קוביות",   audio: "audio/young/jouets/cubes.m4a" },
        ],
    },
    {
        key: "nourriture",
        words: [
            { fr: "Compote",     en: "Compote",      he: "קומפוט",   audio: "audio/young/nourriture/compote.m4a" },
            { fr: "Gâteau",      en: "Cake",         he: "עוגה",     audio: "audio/young/nourriture/gateau.m4a" },
            { fr: "Banane",      en: "Banana",       he: "בננה",     audio: "audio/young/nourriture/banane.m4a" },
            { fr: "Pomme",       en: "Apple",        he: "תפוח",     audio: "audio/young/nourriture/pomme.m4a" },
            { fr: "Carotte",     en: "Carrot",       he: "גזר",      audio: "audio/young/nourriture/carotte.m4a" },
        ],
    },
];

// ── Écran 1 : sélection de l'âge ─────────────────────────
function showAgeSetup(): void {
    currentCartonScreen = showAgeSetup;
    const months = t("mois", "months", "חודשים");
    const subtitle = t("Âge :", "Age:", "גיל:");
    const title = t("Cartons", "Cards", "קלפים");

    readingPanelContent.innerHTML = `
        <div class="cartons-setup">
            <h2 class="cartons-setup__title">${title}</h2>
            <p class="cartons-setup__subtitle">${subtitle}</p>
            <div class="cartons-setup__levels">
                <button class="cartons-age-btn" data-age="young">0–18 ${months}</button>
                <button class="cartons-age-btn" data-age="older">18 ${months} +</button>
            </div>
        </div>
    `;

    readingPanelContent.querySelectorAll<HTMLButtonElement>(".cartons-age-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            currentAgeGroup = btn.dataset.age as "young" | "older";
            showCategorySetup();
        });
    });
}

// ── Écran 2 : sélection de la catégorie ──────────────────
function showCategorySetup(): void {
    currentCartonScreen = showCategorySetup;
    const title = t("Cartons", "Cards", "קלפים");
    const months = t("mois", "months", "חודשים");
    const ageLabel = currentAgeGroup === "young" ? `0–18 ${months}` : `18 ${months} +`;
    const backLabel = t("← Retour", "← Back", "← חזרה");

    const CATS = [
        { key: "famille",    fr: "Famille",    en: "Family",   he: "משפחה" },
        { key: "corps",      fr: "Corps",      en: "Body",     he: "גוף" },
        { key: "animaux",    fr: "Animaux",    en: "Animals",  he: "חיות" },
        { key: "jouets",     fr: "Jouets",     en: "Toys",     he: "צעצועים" },
        { key: "nourriture", fr: "Nourriture", en: "Food",     he: "אוכל" },
    ];

    readingPanelContent.innerHTML = `
        <div class="cartons-setup">
            <div class="cartons-setup__nav">
                <button class="cartons-back-btn" id="backToAge">${backLabel}</button>
                <h2 class="cartons-setup__title">${title} — ${ageLabel}</h2>
            </div>
            <div class="cartons-setup__categories">
                ${CATS.map(c => `
                    <button class="cartons-category-btn" data-key="${c.key}">
                        ${t(c.fr, c.en, c.he)}
                    </button>
                `).join("")}
            </div>
        </div>
    `;

    document.getElementById("backToAge")?.addEventListener("click", showAgeSetup);
    readingPanelContent.querySelectorAll<HTMLButtonElement>(".cartons-category-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            currentCategory = btn.dataset.key!;
            showModeSetup();
        });
    });
}

// ── Écran 3 : sélection du mode ───────────────────────────
function showModeSetup(): void {
    currentCartonScreen = showModeSetup;
    const title = t("Cartons", "Cards", "קלפים");
    const learn = t("Apprendre", "Learn", "ללמוד");
    const find  = t("Chercher",  "Find",  "לחפש");
    const backLabel = t("← Retour", "← Back", "← חזרה");

    readingPanelContent.innerHTML = `
        <div class="cartons-setup">
            <div class="cartons-setup__nav">
                <button class="cartons-back-btn" id="backToCategories">${backLabel}</button>
                <h2 class="cartons-setup__title">${title}</h2>
            </div>
            <div class="cartons-setup__levels">
                <button class="cartons-age-btn" id="btnLearn">${learn}</button>
                <button class="cartons-age-btn" id="btnFind">${find}</button>
            </div>
        </div>
    `;

    document.getElementById("backToCategories")?.addEventListener("click", showCategorySetup);
    document.getElementById("btnLearn")?.addEventListener("click", startLearnMode);
    document.getElementById("btnFind")?.addEventListener("click", startFindMode);
}

// ── Mode Apprendre ────────────────────────────────────────
function startLearnMode(): void {
    currentCartonScreen = null;
    const cat = YOUNG_CATEGORIES.find(c => c.key === currentCategory);
    if (!cat) return;
    cardOverlay.classList.add("is-open");
    playLearnCard(cat.words, 0);
}

function playLearnCard(words: CardWord[], index: number): void {
    if (index >= words.length) {
        cardOverlay.classList.remove("is-open");
        showModeSetup();
        return;
    }
    const word = words[index];
    cardOverlayWord.textContent = t(word.fr, word.en, word.he);
    cardOverlayStop.textContent = t("← Stop", "← Stop", "← עצור");
    fitText(cardOverlayWord);

    currentAudio = new Audio(word.audio);
    currentAudio.play().catch(() => {});

    learnTimer = setTimeout(() => {
        cardOverlayWord.textContent = "";
        learnTimer = setTimeout(() => playLearnCard(words, index + 1), 1000);
    }, 10000);
}

// ── Mode Chercher ─────────────────────────────────────────
function startFindMode(): void {
    currentCartonScreen = null;
    const cat = YOUNG_CATEGORIES.find(c => c.key === currentCategory);
    if (!cat) return;
    cardOverlay.classList.add("is-open");
    playFindRound(cat, new Set<string>());
}

function whereisAudio(audio: string): string {
    // audio/young/famille/papa.m4a → audio/young/famille/whereis/whereis_papa.m4a
    const slash = audio.lastIndexOf("/");
    const dir = audio.slice(0, slash);
    const file = audio.slice(slash + 1);
    return `${dir}/whereis/whereis_${file}`;
}

function playFindRound(cat: CartonCategory, seen: Set<string>): void {
    // Si tous les mots ont été trouvés, on sort
    if (seen.size >= cat.words.length) {
        cardOverlay.classList.remove("is-open");
        showModeSetup();
        return;
    }

    // Choisir un mot non encore vu en priorité, sinon aléatoire parmi les non-vus
    const unseen = cat.words.filter(w => !seen.has(w.fr));
    const shuffled = [...unseen].sort(() => Math.random() - 0.5);
    const correct = shuffled[0];
    // Mot incorrect : différent du correct, tiré parmi tous les autres
    const others = cat.words.filter(w => w.fr !== correct.fr);
    const wrong = others[Math.floor(Math.random() * others.length)];
    const cards = [correct, wrong].sort(() => Math.random() - 0.5);
    const backLabel = t("← Retour", "← Back", "← חזרה");

    cardOverlay.innerHTML = `
        <button class="card-overlay__stop" id="findBackBtn">${backLabel}</button>
        <div class="card-overlay__find">
            ${cards.map(card => `
                <button class="card-overlay__find-card" data-correct="${card.fr === correct.fr}" data-word="${t(card.fr, card.en, card.he)}">
                    ${t(card.fr, card.en, card.he)}
                </button>
            `).join("")}
        </div>
    `;

    currentAudio = new Audio(whereisAudio(correct.audio));
    currentAudio.play().catch(() => {});

    cardOverlay.querySelectorAll<HTMLButtonElement>(".card-overlay__find-card").forEach(btn => {
        fitTextBtn(btn);
        btn.addEventListener("click", () => {
            if (btn.classList.contains("is-correct") || btn.classList.contains("is-wrong")) return;
            const isCorrect = btn.dataset.correct === "true";
            btn.classList.add(isCorrect ? "is-correct" : "is-wrong");
            if (isCorrect) {
                seen.add(correct.fr);
                if (currentAudio) { currentAudio.pause(); currentAudio = null; }
                const congrats = ["bravo", "champion"];
                const pick = congrats[Math.floor(Math.random() * congrats.length)];
                const snd = new Audio(`audio/congrats/francais/${pick}.m4a`);
                snd.play().catch(() => {});
                snd.addEventListener("ended", () => playFindRound(cat, seen), { once: true });
                setTimeout(() => { if (!snd.ended) { snd.pause(); playFindRound(cat, seen); } }, 3000);
            }
        });
    });

    document.getElementById("findBackBtn")?.addEventListener("click", () => {
        if (currentAudio) { currentAudio.pause(); currentAudio = null; }
        cardOverlay.classList.remove("is-open");
        showModeSetup();
    });
}

// ── Ouverture / fermeture ─────────────────────────────────
function openReading(): void {
    showAgeSetup();
    readingPanel.classList.add("is-open");
}

function closeReading(): void {
    if (learnTimer) { clearTimeout(learnTimer); learnTimer = null; }
    cardOverlay.classList.remove("is-open");
    readingPanel.classList.remove("is-open");
    readingPanelContent.innerHTML = "";
    currentCartonScreen = null;
    currentAgeGroup = null;
    currentCategory = null;
}

new MutationObserver(() => {
    if (readingPanel.classList.contains("is-open") && currentCartonScreen) {
        currentCartonScreen();
    }
}).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

cardOverlayStop.addEventListener("click", () => {
    if (learnTimer) { clearTimeout(learnTimer); learnTimer = null; }
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    cardOverlay.classList.remove("is-open");
    showModeSetup();
});

btnCartons.addEventListener("click", openReading);
readingPanelClose.addEventListener("click", closeReading);
