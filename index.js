require("dotenv").config();
let express = require("express");
let app = express();
let path = require("path");
let http = require("http").createServer(app);
let io = require("socket.io")(http);
let PORT = process.env.PORT || 80;
let nSM = require("node-sass-middleware");
let quizlet = require("quizlet-fetcher");
let hanzi = require("hanzi-tools");
const request = require("request");

app.use(
    nSM({
        src: __dirname,
        dest: path.join(__dirname, "public"),
    })
);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});
app.use(express.static("public"));

const hashCode = (s) =>
    s.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
    }, 0);

io.on("connection", (socket) => {
    socket.on("format", async ({ trad, eng, src }) => {
        let items = src.split("\n");
        let counts = {};
        items = items.map((item) => {
            let tempArr = item.split("	");
            let tag = hanzi.tag(tempArr[0])[0].tag;
            counts[tag] = counts[tag] ? counts[tag] + 1 : 1;
            return {
                term: trad
                    ? hanzi.traditionalize(tempArr[0])
                    : hanzi.simplify(tempArr[0]),
                definition: tempArr[1],
                pinyin: hanzi.pinyinify(tempArr[0]),
            };
        });
        let string = "";
        for (let item in counts) {
            string += `${item}:${counts[item]}|`;
        }
        let data = {
            title: `(${items.length} items long)`,
            description: "Part Of Speech: " + string,
            cards: items,
        };
        socket.emit("questionInit", data);
    });
});

http.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
