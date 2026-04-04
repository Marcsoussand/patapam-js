"use strict";
const translations = {
    fr: {
        title: "Le Monde de Patapam",
        mainTitle: "Le Monde de Patapam",
        cabaneTitle: "Bienvenue dans la cabane de Patapam !",
        bibli: "Bibliothèque",
        jeux: "Jeux",
        ecole: "Educatif",
    },
    en: {
        title: "The World of Patapam",
        mainTitle: "The World of Patapam",
        cabaneTitle: "Welcome to Patapam's cabin!",
        bibli: "Library",
        jeux: "Games",
        ecole: "Learn",
    },
    he: {
        title: "העולם של פטפם",
        mainTitle: "העולם של פטפם",
        cabaneTitle: "ברוכים הבאים לצריף של פטפם!",
        bibli: "ספריה",
        jeux: "משחקים",
        ecole: "לימוד",
    },
};
function setLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (translations[lang]?.[key]) {
            el.textContent = translations[lang][key];
        }
    });
    document.querySelectorAll(".lang-switcher button").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.lang === lang);
    });
    localStorage.setItem("lang", lang);
}
const savedLang = localStorage.getItem("lang") || "fr";
setLanguage(savedLang);
