"use strict";
// Logique spécifique à la page Bibliothèque
const readingPanel = document.getElementById("readingPanel");
const readingPanelContent = document.getElementById("readingPanelContent");
const readingPanelClose = document.getElementById("readingPanelClose");
const btnCartons = document.getElementById("btnCartons");
const btnLecture = document.getElementById("btnLecture");
const cardOverlay = document.getElementById("cardOverlay");
const cardOverlayStop = document.getElementById("cardOverlayStop");
const cardOverlayWord = document.getElementById("cardOverlayWord");
let currentCartonScreen = null;
let currentAgeGroup = null;
let currentCategory = null;
let learnTimer = null;
let currentAudio = null;
// ── Helpers ───────────────────────────────────────────────
function getLang() { return document.documentElement.lang || "fr"; }
function t(fr, en, he) {
    const l = getLang();
    return l === "he" ? he : l === "en" ? en : fr;
}
function fitText(el, scale = 1) {
    requestAnimationFrame(() => {
        const maxW = (el.parentElement?.clientWidth ?? window.innerWidth) * 0.92 * scale;
        const maxH = (el.parentElement?.clientHeight ?? window.innerHeight) * 0.80 * scale;
        let size = Math.min(maxH, maxW);
        el.style.fontSize = size + "px";
        while ((el.scrollWidth > maxW || el.scrollHeight > maxH) && size > 20) {
            size -= 4;
            el.style.fontSize = size + "px";
        }
    });
}
function fitTextBtn(el) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
        const w = el.clientWidth || window.innerWidth * 0.44;
        const h = el.clientHeight || window.innerHeight * 0.70;
        let size = Math.min(w * 0.90, h * 0.85);
        el.style.fontSize = size + "px";
        while ((el.scrollWidth > w || el.scrollHeight > h) && size > 12) {
            size -= 4;
            el.style.fontSize = size + "px";
        }
    }));
}
const YOUNG_CATEGORIES = [
    {
        key: "famille",
        words: [
            { fr: "papa", en: "Papa", he: "אבא", audio: "audio/young/famille/papa.m4a" },
            { fr: "maman", en: "Maman", he: "אמא", audio: "audio/young/famille/maman.m4a" },
            { fr: "aaron", en: "Aaron", he: "אהרון", audio: "audio/young/famille/aaron.m4a" },
            { fr: "naor", en: "Naor", he: "נאור", audio: "audio/young/famille/naor.m4a" },
            { fr: "elon", en: "Elon", he: "אלון", audio: "audio/young/famille/elon.m4a" },
        ],
    },
    {
        key: "corps",
        words: [
            { fr: "tête", en: "Head", he: "ראש", audio: "audio/young/corps/tete.m4a" },
            { fr: "main", en: "Hand", he: "יד", audio: "audio/young/corps/main.m4a" },
            { fr: "pied", en: "Foot", he: "רגל", audio: "audio/young/corps/pied.m4a" },
            { fr: "oreilles", en: "Ears", he: "אוזניים", audio: "audio/young/corps/oreilles.m4a" },
            { fr: "bouche", en: "Mouth", he: "פה", audio: "audio/young/corps/bouche.m4a" },
        ],
    },
    {
        key: "animaux",
        words: [
            { fr: "lion", en: "Lion", he: "אריה", audio: "audio/young/animaux/lion.m4a" },
            { fr: "tigre", en: "Tiger", he: "נמר", audio: "audio/young/animaux/tigre.m4a" },
            { fr: "vache", en: "Cow", he: "פרה", audio: "audio/young/animaux/vache.m4a" },
            { fr: "tortue", en: "Turtle", he: "צב", audio: "audio/young/animaux/tortue.m4a" },
            { fr: "hippopotame", en: "Hippopotamus", he: "היפופוטם", audio: "audio/young/animaux/hippopotame.m4a" },
        ],
    },
    {
        key: "jouets",
        words: [
            { fr: "Ballon", en: "Ball", he: "כדור", audio: "audio/young/jouets/ballon.m4a" },
            { fr: "Voiture", en: "Car", he: "מכונית", audio: "audio/young/jouets/voiture.m4a" },
            { fr: "Robot", en: "Robot", he: "רובוט", audio: "audio/young/jouets/robot.m4a" },
            { fr: "Peluche", en: "Plushie", he: "בובה רכה", audio: "audio/young/jouets/peluche.m4a" },
            { fr: "Cubes", en: "Blocks", he: "קוביות", audio: "audio/young/jouets/cubes.m4a" },
        ],
    },
    {
        key: "nourriture",
        words: [
            { fr: "Compote", en: "Compote", he: "קומפוט", audio: "audio/young/nourriture/compote.m4a" },
            { fr: "Gâteau", en: "Cake", he: "עוגה", audio: "audio/young/nourriture/gateau.m4a" },
            { fr: "Banane", en: "Banana", he: "בננה", audio: "audio/young/nourriture/banane.m4a" },
            { fr: "Pomme", en: "Apple", he: "תפוח", audio: "audio/young/nourriture/pomme.m4a" },
            { fr: "Carotte", en: "Carrot", he: "גזר", audio: "audio/young/nourriture/carotte.m4a" },
        ],
    },
];
// ── Popup Glenn Doman ─────────────────────────────────────
const DOMAN_CONTENT = {
    fr: {
        title: "La méthode Glenn Doman",
        dir: "ltr",
        html: `
<p>La méthode de lecture précoce développée par Glenn Doman s'inscrit dans un contexte initialement thérapeutique et empirique. Dans les années 1950, au sein de l'<em>Institutes for the Achievement of Human Potential</em>, Doman travaillait avec des enfants atteints de lésions cérébrales ou de troubles neurologiques sévères. Il observa que ces enfants, soumis à des stimulations sensorielles intensives, structurées et répétées — notamment visuelles et linguistiques — développaient parfois des capacités de lecture et de compréhension supérieures à celles d'enfants dits « normaux » du même âge, scolarisés de manière classique.</p>
<p>Ce constat contre-intuitif l'amena à formuler l'hypothèse que ce n'était pas l'immaturité du cerveau du jeune enfant qui limitait l'apprentissage, mais au contraire un manque de stimulation adaptée et précoce. La méthode fut ainsi extrapolée à des enfants sans handicap, non comme une thérapie, mais comme une opportunité d'exploiter pleinement les capacités exceptionnelles du cerveau en développement.</p>
<p>Les bébés ont une capacité d'apprentissage exceptionnelle dès la naissance, bien supérieure à ce que l'on imagine, et ils peuvent apprendre à lire très tôt, souvent avant 3 ans, avec plaisir et sans effort, si l'approche est adaptée.</p>
<h4>Idées clés</h4>
<ul>
    <li>Le cerveau du bébé est une « éponge » : plus l'apprentissage commence tôt, plus il est facile et naturel.</li>
    <li>Lire n'est pas déchiffrer, mais reconnaître des mots, comme on reconnaît des visages.</li>
    <li>L'apprentissage doit être rapide, joyeux, bref et volontaire (on s'arrête avant que l'enfant se lasse).</li>
    <li>Le parent est le meilleur enseignant de son enfant.</li>
</ul>
<h4>Méthode proposée</h4>
<ul>
    <li>Montrer des mots entiers, écrits en gros caractères rouges sur des cartes (ex. : <em>maman</em>, <em>papa</em>).</li>
    <li>Dire le mot clairement et avec enthousiasme, sans demander à l'enfant de répéter.</li>
    <li>Faire des séances très courtes (quelques secondes), plusieurs fois par jour.</li>
</ul>
<h4>Progression en 5 étapes</h4>
<ul>
    <li>Mots simples → Couples de mots → Phrases simples → Phrases plus complexes → Lecture de vrais livres</li>
</ul>
<h4>Principes pédagogiques</h4>
<ul>
    <li>Aucune pression, aucun test.</li>
    <li>Pas de correction : on montre, c'est tout.</li>
    <li>Arrêter avant l'ennui.</li>
    <li>Associer l'apprentissage à une relation affective positive.</li>
</ul>
<h4>Objectif</h4>
<ul>
    <li>Donner à l'enfant un avantage durable : goût de la lecture, confiance en soi, facilité d'apprentissage.</li>
    <li>Montrer que la lecture précoce stimule le développement global du cerveau, pas seulement le langage.</li>
</ul>`
    },
    en: {
        title: "The Glenn Doman Method",
        dir: "ltr",
        html: `
<p>Glenn Doman's early reading method originated in a therapeutic and empirical context. In the 1950s, at the <em>Institutes for the Achievement of Human Potential</em>, Doman worked with children who had suffered brain injuries or severe neurological disorders. He observed that these children, exposed to intensive, structured and repeated sensory stimulation — particularly visual and linguistic — sometimes developed reading and comprehension abilities superior to those of typically developing children of the same age in conventional schooling.</p>
<p>This counter-intuitive finding led him to hypothesize that it was not brain immaturity that limited learning in young children, but rather a lack of appropriate early stimulation. The method was therefore extended to children without disabilities — not as therapy, but as an opportunity to fully harness the exceptional learning capacities of the developing brain.</p>
<p>Babies have an exceptional capacity to learn from birth, far greater than commonly imagined. They can learn to read very early — often before age 3 — with joy and without effort, provided the approach is right.</p>
<h4>Key ideas</h4>
<ul>
    <li>The baby's brain is a "sponge": the earlier learning begins, the easier and more natural it is.</li>
    <li>Reading is not decoding — it is recognising whole words, just as we recognise faces.</li>
    <li>Learning must be fast, joyful, brief and voluntary (stop before the child gets bored).</li>
    <li>The parent is the child's best teacher.</li>
</ul>
<h4>Proposed method</h4>
<ul>
    <li>Show whole words written in large red letters on cards (e.g. <em>mum</em>, <em>dad</em>).</li>
    <li>Say the word clearly and enthusiastically — never ask the child to repeat it.</li>
    <li>Keep sessions very short (a few seconds), several times a day.</li>
</ul>
<h4>5-stage progression</h4>
<ul>
    <li>Single words → Word pairs → Simple sentences → More complex sentences → Real books</li>
</ul>
<h4>Teaching principles</h4>
<ul>
    <li>No pressure, no testing.</li>
    <li>No correction: just show the card.</li>
    <li>Always stop before boredom sets in.</li>
    <li>Link learning to a warm, positive relationship.</li>
</ul>
<h4>Goal</h4>
<ul>
    <li>Give the child a lasting advantage: a love of reading, self-confidence, and ease of learning.</li>
    <li>Show that early reading stimulates the overall development of the brain, not just language.</li>
</ul>`
    },
    he: {
        title: "שיטת גלן דומן",
        dir: "rtl",
        html: `
<p>שיטת הקריאה המוקדמת של גלן דומן נולדה בהקשר טיפולי ואמפירי. בשנות ה-50, במכון <em>Institutes for the Achievement of Human Potential</em>, עבד דומן עם ילדים שסבלו מפגיעות מוח או הפרעות נוירולוגיות קשות. הוא הבחין שילדים אלה, שנחשפו לגירויים חושיים אינטנסיביים, מובנים וחוזרים — ובמיוחד ויזואליים ולשוניים — פיתחו לעיתים יכולות קריאה והבנה גבוהות מאלה של ילדים מתפתחים בגילם הלומדים בדרך המסורתית.</p>
<p>ממצא מפתיע זה הוביל אותו להשערה שאין זה הבשלות המוחית הלוקה שמגבילה את הלמידה, אלא דווקא היעדר גירוי מתאים ומוקדם. השיטה הורחבה לילדים ללא מוגבלות — לא כטיפול, אלא כהזדמנות לנצל את יכולות הלמידה היוצאות מן הכלל של המוח המתפתח.</p>
<p>לתינוקות יש יכולת למידה יוצאת דופן מלידה, גבוהה הרבה יותר ממה שנדמה לנו. הם יכולים ללמוד לקרוא מוקדם מאוד — לעיתים לפני גיל 3 — בשמחה ובלי מאמץ, אם הגישה מתאימה.</p>
<h4>רעיונות מרכזיים</h4>
<ul>
    <li>מוח התינוק הוא "ספוג": ככל שהלמידה מתחילה מוקדם יותר, כך היא קלה וטבעית יותר.</li>
    <li>קריאה אינה פיצוח — היא זיהוי מילים שלמות, בדיוק כשם שמזהים פנים.</li>
    <li>הלמידה חייבת להיות מהירה, שמחה, קצרה ומרצון (מפסיקים לפני שהילד מתעייף).</li>
    <li>ההורה הוא המורה הטוב ביותר של ילדו.</li>
</ul>
<h4>השיטה המוצעת</h4>
<ul>
    <li>להראות מילים שלמות הכתובות באותיות גדולות ואדומות על גבי קלפים (למשל: <em>אמא</em>, <em>אבא</em>).</li>
    <li>לומר את המילה בבהירות ובהתלהבות — מבלי לבקש מהילד לחזור עליה.</li>
    <li>לקיים מפגשים קצרים מאוד (כמה שניות), מספר פעמים ביום.</li>
</ul>
<h4>התקדמות ב-5 שלבים</h4>
<ul>
    <li>מילים בודדות ← זוגות מילים ← משפטים פשוטים ← משפטים מורכבים יותר ← ספרים אמיתיים</li>
</ul>
<h4>עקרונות פדגוגיים</h4>
<ul>
    <li>אין לחץ, אין מבחנים.</li>
    <li>אין תיקונים — רק מראים את הקלף.</li>
    <li>תמיד עוצרים לפני שהילד משתעמם.</li>
    <li>מקשרים את הלמידה לקשר חם וחיובי.</li>
</ul>
<h4>מטרה</h4>
<ul>
    <li>לתת לילד יתרון מתמשך: אהבת קריאה, ביטחון עצמי וקלות למידה.</li>
    <li>להראות שקריאה מוקדמת מגרה את ההתפתחות הכוללת של המוח — לא רק את השפה.</li>
</ul>`
    },
};
function showDomanPopup() {
    const overlay = document.createElement("div");
    overlay.className = "doman-overlay";
    overlay.innerHTML = `
        <div class="doman-popup">
            <div class="doman-popup__header">
                <h3></h3>
                <button class="doman-popup__close" aria-label="Fermer">✕</button>
            </div>
            <div class="doman-popup__body"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    const titleEl = overlay.querySelector(".doman-popup__header h3");
    const bodyEl = overlay.querySelector(".doman-popup__body");
    function renderDomanContent() {
        const lang = getLang();
        const content = DOMAN_CONTENT[lang] ?? DOMAN_CONTENT["fr"];
        titleEl.textContent = content.title;
        bodyEl.setAttribute("dir", content.dir);
        bodyEl.innerHTML = content.html;
    }
    renderDomanContent();
    const observer = new MutationObserver(renderDomanContent);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    const close = () => { observer.disconnect(); overlay.remove(); };
    overlay.querySelector(".doman-popup__close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay)
        close(); });
}
// ── Écran 1 : sélection de l'âge ─────────────────────────
function showAgeSetup() {
    currentCartonScreen = showAgeSetup;
    const months = t("mois", "months", "חודשים");
    const subtitle = t("Âge :", "Age:", "גיל:");
    const title = t("Cartons", "Cards", "קלפים");
    const infoLabel = t("ℹ", "ℹ", "ℹ");
    readingPanelContent.innerHTML = `
        <div class="cartons-setup">
            <h2 class="cartons-setup__title">
                ${title}
                <button class="cartons-info-btn" id="cartonsInfoBtn" aria-label="En savoir plus">${infoLabel}</button>
            </h2>
            <p class="cartons-setup__subtitle">${subtitle}</p>
            <div class="cartons-setup__levels">
                <button class="cartons-age-btn" data-age="young">0–18 ${months}</button>
                <button class="cartons-age-btn" data-age="older">18 ${months} +</button>
            </div>
        </div>
    `;
    document.getElementById("cartonsInfoBtn")?.addEventListener("click", showDomanPopup);
    readingPanelContent.querySelectorAll(".cartons-age-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            currentAgeGroup = btn.dataset.age;
            showCategorySetup();
        });
    });
}
// ── Écran 2 : sélection de la catégorie ──────────────────
function showCategorySetup() {
    currentCartonScreen = showCategorySetup;
    const title = t("Cartons", "Cards", "קלפים");
    const months = t("mois", "months", "חודשים");
    const ageLabel = currentAgeGroup === "young" ? `0–18 ${months}` : `18 ${months} +`;
    const backLabel = t("← Retour", "← Back", "← חזרה");
    const CATS = [
        { key: "famille", fr: "Famille", en: "Family", he: "משפחה" },
        { key: "corps", fr: "Corps", en: "Body", he: "גוף" },
        { key: "animaux", fr: "Animaux", en: "Animals", he: "חיות" },
        { key: "jouets", fr: "Jouets", en: "Toys", he: "צעצועים" },
        { key: "nourriture", fr: "Nourriture", en: "Food", he: "אוכל" },
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
    readingPanelContent.querySelectorAll(".cartons-category-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            currentCategory = btn.dataset.key;
            showModeSetup();
        });
    });
}
// ── Écran 3 : sélection du mode ───────────────────────────
function showModeSetup() {
    currentCartonScreen = showModeSetup;
    const title = t("Cartons", "Cards", "קלפים");
    const learn = t("Apprendre", "Learn", "ללמוד");
    const find = t("Chercher", "Find", "לחפש");
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
function startLearnMode() {
    currentCartonScreen = null;
    const cat = YOUNG_CATEGORIES.find(c => c.key === currentCategory);
    if (!cat)
        return;
    cardOverlay.classList.add("is-open");
    playLearnCard(cat.words, 0);
}
function playLearnCard(words, index) {
    if (index >= words.length) {
        cardOverlay.classList.remove("is-open");
        showModeSetup();
        return;
    }
    const word = words[index];
    cardOverlayWord.textContent = t(word.fr, word.en, word.he);
    cardOverlayStop.textContent = t("← Stop", "← Stop", "← עצור");
    if (currentAgeGroup === "older") {
        cardOverlayWord.classList.add("card-overlay__word--older");
        fitText(cardOverlayWord, 2 / 3);
    }
    else {
        cardOverlayWord.classList.remove("card-overlay__word--older");
        fitText(cardOverlayWord);
    }
    currentAudio = new Audio(word.audio);
    currentAudio.play().catch(() => { });
    learnTimer = setTimeout(() => {
        cardOverlayWord.textContent = "";
        learnTimer = setTimeout(() => playLearnCard(words, index + 1), 1000);
    }, 10000);
}
// ── Mode Chercher ─────────────────────────────────────────
function startFindMode() {
    currentCartonScreen = null;
    const cat = YOUNG_CATEGORIES.find(c => c.key === currentCategory);
    if (!cat)
        return;
    cardOverlay.classList.add("is-open");
    playFindRound(cat, new Set());
}
function whereisAudio(audio) {
    // audio/young/famille/papa.m4a → audio/young/famille/whereis/whereis_papa.m4a
    const slash = audio.lastIndexOf("/");
    const dir = audio.slice(0, slash);
    const file = audio.slice(slash + 1);
    return `${dir}/whereis/whereis_${file}`;
}
function playFindRound(cat, seen) {
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
    currentAudio.play().catch(() => { });
    cardOverlay.querySelectorAll(".card-overlay__find-card").forEach(btn => {
        fitTextBtn(btn);
        btn.addEventListener("click", () => {
            if (btn.classList.contains("is-correct") || btn.classList.contains("is-wrong"))
                return;
            const isCorrect = btn.dataset.correct === "true";
            btn.classList.add(isCorrect ? "is-correct" : "is-wrong");
            if (isCorrect) {
                seen.add(correct.fr);
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio = null;
                }
                const congrats = ["bravo", "champion"];
                const pick = congrats[Math.floor(Math.random() * congrats.length)];
                const snd = new Audio(`audio/congrats/francais/${pick}.m4a`);
                snd.play().catch(() => { });
                snd.addEventListener("ended", () => playFindRound(cat, seen), { once: true });
                setTimeout(() => { if (!snd.ended) {
                    snd.pause();
                    playFindRound(cat, seen);
                } }, 3000);
            }
        });
    });
    document.getElementById("findBackBtn")?.addEventListener("click", () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        cardOverlay.classList.remove("is-open");
        showModeSetup();
    });
}
// ── Ouverture / fermeture ─────────────────────────────────
function openReading() {
    showAgeSetup();
    readingPanel.classList.add("is-open");
}
function closeReading() {
    if (learnTimer) {
        clearTimeout(learnTimer);
        learnTimer = null;
    }
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
    if (learnTimer) {
        clearTimeout(learnTimer);
        learnTimer = null;
    }
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    cardOverlay.classList.remove("is-open");
    showModeSetup();
});
btnCartons.addEventListener("click", openReading);
btnLecture.addEventListener("click", () => {
    const lang = document.documentElement.lang || "fr";
    const title = lang === "he" ? "קריאה הברתית" : lang === "en" ? "Syllabic Reading" : "Lecture syllabique";
    const soon = lang === "he" ? "בקרוב..." : lang === "en" ? "Coming soon..." : "À venir...";
    readingPanelContent.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:1.5rem;color:white;font-family:'Lilita One',cursive;text-align:center">
            <h2 style="font-size:2.5rem;margin:0;-webkit-text-stroke:1px rgba(0,0,0,0.4)">${title}</h2>
            <p style="font-size:1.6rem;margin:0;opacity:0.8">${soon}</p>
        </div>
    `;
    readingPanel.classList.add("is-open");
});
readingPanelClose.addEventListener("click", closeReading);
