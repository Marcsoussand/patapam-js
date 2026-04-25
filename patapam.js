"use strict";
const translations = {
    fr: {
        title: "Le Monde de Patapam",
        mainTitle: "Le Monde de Patapam",
        welcomeTitle: "Bienvenue chez Patapam l’hippopotame !",
        welcomeText: "Un monde imaginaire où les enfants peuvent s’amuser en apprenant, de la lecture aux mathématiques en passant par de la géographie et des jeux à portée éducative. Venez rencontrer Tartuffe l’ours en peluche, Bobby l’éléphant ou encore Bétachou, bête à manger du foin, dans les aventures de Patapam !!",
        cabaneTitle: "Bienvenue dans la cabane de Patapam !",
        bibli: "Bibliothèque",
        jeux: "Jeux",
        ecole: "Educatif",
        tictactoe: "Morpion",
        memory: "Memory",
        patapaf: "Chasse aux Trésors",
        hangman: "Pendu",
        memoryLevel: "Niveau",
        cartons: "Cartons",
        lecture: "Lecture",
        months: "mois",
        recommencer: "Recommencer",
        famille: "Famille",
        corps: "Corps",
        animaux: "Animaux",
        jouets: "Jouets",
        nourriture: "Nourriture",
    },
    en: {
        title: "Patapam's World",
        mainTitle: "Patapam's World",
        welcomeTitle: "Welcome to Patapam the Hippo's world!",
        welcomeText: "An imaginary world where children can learn while having fun — from reading and maths to geography and educational games. Come meet Tartuffe the teddy bear, Bobby the elephant, and Bétachou, the silliest creature around, in Patapam's adventures!!",
        cabaneTitle: "Welcome to Patapam's cabin!",
        bibli: "Library",
        jeux: "Games",
        ecole: "Learn",
        tictactoe: "Tic Tac Toe",
        memory: "Memory",
        patapaf: "Treasure Hunt",
        hangman: "Hangman",
        memoryLevel: "Level",
        cartons: "Cards",
        lecture: "Reading",
        months: "months",
        recommencer: "Start over",
        famille: "Family",
        corps: "Body",
        animaux: "Animals",
        jouets: "Toys",
        nourriture: "Food",
    },
    he: {
        title: "העולם של פטפם",
        mainTitle: "העולם של פטפם",
        welcomeTitle: "ברוכים הבאים אל עולמו של פטפם ההיפופוטם!",
        welcomeText: "עולם דמיוני שבו ילדים יכולים להנות וללמוד בו זמנית — מקריאה ומתמטיקה ועד גיאוגרפיה ומשחקים חינוכיים. בואו להכיר את טארטוף הדוב הצעצוע, את בובי הפיל ואת בטצואו המשוגע בהרפתקאות של פטפם!!",
        cabaneTitle: "ברוכים הבאים לצריף של פטפם!",
        bibli: "ספריה",
        jeux: "משחקים",
        ecole: "לימוד",
        tictactoe: "איקס עיגול",
        memory: "זיכרון",
        patapaf: "ציד המטמון",
        hangman: "תלייה",
        memoryLevel: "רמה",
        cartons: "קלפים",
        lecture: "לקרוא",
        months: "חודשים",
        recommencer: "התחל מחדש",
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
