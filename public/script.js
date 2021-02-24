var firebaseConfig = {
    apiKey: "AIzaSyBKpMizwtD-oRTmA6vXt3cgjGZgBDH7vB4",
    authDomain: "jckahuu.firebaseapp.com",
    databaseURL: "https://jckahuu.firebaseio.com",
    projectId: "jckahuu",
    storageBucket: "jckahuu.appspot.com",
    messagingSenderId: "908082078296",
    appId: "1:908082078296:web:a24d2a9ed0e845defaa02d",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
let db = firebase.firestore();

var socket = io();

let source =
    prompt(
        "Please enter in a valid quizlet ID. Copy everything after 'https://quizlet.com/'. It MUST follow the correct format.",
        "573099039/chinese-final-exam-clean-data-flash-cards/"
    ) || "573099039/chinese-final-exam-clean-data-flash-cards/";
let multiplier = 0;
let traditional = !confirm("Are you using simplified? (cancel = no)");
let english = true;
let speed = 0.5;
let currentQuestion = {};
let questionSrc = null;
let index = -1;

$(document).ready(randQuestion());

function correct() {
    multiplier++;
    $("#background").html(`<h1 class="multiplier">${multiplier}x</h1>`);
    $(".answer").each(function () {
        $(this).addClass("correct");
    });
}

function incorrect() {
    multiplier = 0;
    $("#background").html(`<h1 class="wmultiplier">0x</h1>`);
    $(".answer").each(function () {
        $(this).addClass("incorrect");
    });
}

let listener = $("form").on("submit", (e) => {
    e.preventDefault();
    $("#sendButton").animate(
        {
            opacity: 0,
        },
        300,
        function (x, t, b, c, d) {
            return t == d ? b + c : c * (-Math.pow(2, (-10 * t) / d) + 1) + b;
        }
    );
    let values = [];
    $(".answer").each(function () {
        values.push($(this).text());
        $(this).addClass("waiting");
        $(this).prop("disabled", true);
        $(this).prop("style", "");
    });
    setTimeout(() => {
        let incorrect = false;
        if (values[0] !== currentQuestion.answers) {
            incorrect = true;
        }
        if (incorrect) {
            multiplier = 0;
            $("#background").html(`<h1 class="wmultiplier">0x</h1>`);
            $(".answer").each(function () {
                $(this).addClass("incorrect");
            });
            setTimeout(() => {
                $("#app").fadeOut(250, () => {
                    $("#inputForm").html(
                        `<h3>The correct answer was</h3><h1 class="mono" style="font-size: 4rem;">${currentQuestion.answers}</h1><h2 class="mono">${currentQuestion.pinyin}</h2>`
                    );
                    $("#bottom").fadeOut(250);
                    $("#app").fadeIn(250);
                });
            }, 4000 * speed);
            setTimeout(() => randQuestion(), 10000 * speed);
        } else {
            multiplier++;
            $("#background").html(`<h1 class="multiplier">${multiplier}x</h1>`);
            $(".answer").each(function () {
                $(this).addClass("correct");
            });
            setTimeout(() => {
                randQuestion();
            }, 2000 * speed);
        }
    }, 1000 * speed);
});

function setTraditional() {
    traditional = true;
    console.log(
        "%cSet!\nAll future questions will be traditional.",
        "color: lime;"
    );
    return traditional;
}

function newQuestion(template) {
    // 你家有機_房間
    $("#bottom").fadeOut(250);
    $("#app").fadeOut(250, () => {
        $("#bottom").html(currentQuestion.translation);
        let formattedTemplate = `<p class="mono" style="font-size: 4rem;">${template}</p><button id="sendButton">Check.</button>`;
        formattedTemplate = formattedTemplate
            .split("——")
            .join(
                `<span contenteditable class="answer input" style="white-space: nowrap"></span>`
            );
        formattedTemplate = formattedTemplate
            .split("[`")
            .join(`<span class="pinyin" pinyin="`);
        formattedTemplate = formattedTemplate.split("`").join(`">`);
        formattedTemplate = formattedTemplate.split("]").join(`</span>`);
        $("#inputForm").html(formattedTemplate);
        $("#app").fadeIn(250);
        $("#bottom").fadeIn(250);
    });
}

function randQuestion() {
    if (!questionSrc) {
        socket.emit("question", {
            trad: traditional,
            eng: english,
            src: source,
        });
    } else {
        index++;
        if (index > questionSrc.cards.length - 1) {
            index = 0;
        }
        let itemToFormat = questionSrc.cards[index];
        let definitions = itemToFormat.definition.split("; ");
        let format = `<h1 class="mono" style="font-size: 4rem;">${definitions[0]}<h1>——`;
        if (!definitions) {
            error("No definitions found.");
        } else if (!itemToFormat.term) {
            error("No terms found.");
        } else {
            definitions.shift();
            currentQuestion = {
                translation:
                    definitions.length > 0
                        ? "Other definitions: " + definitions.join(", ") + "."
                        : "No other definitions.",
                answers: itemToFormat.term,
                pinyin: itemToFormat.pinyin,
            };
            newQuestion(format);
            console.log(itemToFormat);
        }
    }
}

socket.on("questionInit", (src) => {
    if (src.err) {
        error(src.err);
        return;
    } else {
        questionSrc = src;
        $("#background").html(`<h1 class="multiplier">loaded!</h1>`);
        $("#app").fadeOut(250, () => {
            $("#inputForm").html(
                `<h1>${src.title}</h1><h3>${src.description}</h3>`
            );
            $("#bottom").fadeOut(250);
            $("#app").fadeIn(500);
            setTimeout(() => randQuestion(), 1500);
        });
    }
});

function error(title) {
    $("#background").html(`<h1 class="wmultiplier">error.</h1>`);
    $("#app").fadeOut(250, () => {
        $("#inputForm").html(`<h1>${src.err}</h1><h3>Please refresh.</h3>`);
        $("#bottom").fadeOut(250);
        $("#app").fadeIn(250);
    });
}
