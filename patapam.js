"use strict";
const translations = {
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
        cartons: "Cartons",
        months: "mois",
        famille: "Famille",
        corps: "Corps",
        animaux: "Animaux",
        jouets: "Jouets",
        nourriture: "Nourriture",
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
        cartons: "Cards",
        months: "months",
        famille: "Family",
        corps: "Body",
        animaux: "Animals",
        jouets: "Toys",
        nourriture: "Food",
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
        cartons: "קלפים",
        months: "חודשים",
        famille: "משפחה",
        corps: "גוף",
        animaux: "חיות",
        jouets: "צעצועים",
        nourriture: "אוכל",
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
