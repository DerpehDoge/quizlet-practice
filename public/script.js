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

function isWindows() {
    return navigator.platform.indexOf("Win") > -1;
}

if (!isWindows) {
    alert("Please use a PC. I'm too bad of a coder to make another port :(");
}

var socket = io();
let defaultText = `来	to come; come
椅子	chair
桌子	desk; table
客厅	living room
沙发	sofa
书架	bookshelf
床	bed
上	top; above; atop
里	inside; in
灯	light; lamp
书	book
卧室	bedroom
门	door
东边	eastern side; east; east side; east direction; to the east of
西边	west side; western side; west; west direction; to the west of
南边	south; south side; southern side; south direction; to the south of
北边	north; north side; northern side; north direction; to the north of
饭厅	dining room
卫生间	bathroom; restroom; toilet
旁边	beside; nearby; side; to the side of
前面	in front; front; ahead; ahead of; in front of
后面	behind; back; behind of
左边	left; left of
右边	right side; right
家具	furniture
花园	garden
花	flower
书桌	desk
干净	clean; neat
整齐	neat; tidy; orderly
真	really`;

let source =
    prompt(
        "Please enter in a valid quizlet set that has been exported using default settings.",
        defaultText
    ) || defaultText;
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
                        `<h3>The correct answer was</h3><h1 class="mono" style="font-size: 4rem;">${currentQuestion.answers}</h1><h2 class="piny">${currentQuestion.pinyin}</h2>`
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
        socket.emit("format", {
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
        window
            .fetch(
                "https://cors-anywhere.herokuapp.com/https://quizlet.com/" +
                    source,
                {}
            )
            .then((a) => console.log(a))
            .catch((a) => error(a));
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
        $("#inputForm").html(`<h1>${title}</h1><h3>Please refresh.</h3>`);
        $("#bottom").fadeOut(250);
        $("#app").fadeIn(250);
    });
}
