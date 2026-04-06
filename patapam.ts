type Lang = "fr" | "en" | "he";

type TranslationKeys = {
  title: string;
  mainTitle: string;
  cabaneTitle: string;
  bibli: string;
  jeux: string;
  ecole: string;
  tictactoe: string;
  memory: string;
  memoryLevel: string;
};

const translations: Record<Lang, TranslationKeys> = {
  fr: {
    title: "Le Monde de Patapam",
    mainTitle: "Le Monde de Patapam",
    cabaneTitle: "Bienvenue dans la cabane de Patapam !",
    bibli: "Bibliothèque",
    jeux: "Jeux",
    ecole: "Educatif",
    tictactoe: "Morpion",
    memory: "Memory",
    memoryLevel: "Niveau",
  },
  en: {
    title: "The World of Patapam",
    mainTitle: "The World of Patapam",
    cabaneTitle: "Welcome to Patapam's cabin!",
    bibli: "Library",
    jeux: "Games",
    ecole: "Learn",
    tictactoe: "Tic Tac Toe",
    memory: "Memory",
    memoryLevel: "Level",
  },
  he: {
    title: "העולם של פטפם",
    mainTitle: "העולם של פטפם",
    cabaneTitle: "ברוכים הבאים לצריף של פטפם!",
    bibli: "ספריה",
    jeux: "משחקים",
    ecole: "לימוד",
    tictactoe: "איקס עיגול",
    memory: "זיכרון",
    memoryLevel: "רמה",
  },
};

function setLanguage(lang: Lang): void {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") as keyof TranslationKeys;
    if (translations[lang]?.[key]) {
      el.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll<HTMLButtonElement>(".lang-switcher button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  localStorage.setItem("lang", lang);
}

const savedLang = (localStorage.getItem("lang") as Lang) || "fr";
setLanguage(savedLang);
