require("dotenv").config();
let express = require("express");
let app = express();
let path = require("path");
let http = require("http").createServer(app);
let io = require("socket.io")(http);
let PORT = process.env.PORT || 3000;
let nSM = require("node-sass-middleware");
let quizlet = require("quizlet-fetcher");
let hanzi = require("hanzi-tools");

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

io.on("connection", (socket) => {
    socket.on("question", async ({ trad, eng, src }) => {
        let data;
        try {
            data = await quizlet(src);
        } catch (err) {
            console.log(err);
            socket.emit("questionInit", {
                err: `An error occured. ${err}`,
            });
            return;
        }
        data.cards = trad
            ? data.cards.map((a) => {
                  return {
                      term: hanzi.traditionalize(a.term),
                      definition: a.definition,
                      pinyin: hanzi.pinyinify(a.term),
                  };
              })
            : data.cards.map((a) => {
                  return {
                      term: a.term,
                      definition: a.definition,
                      pinyin: hanzi.pinyinify(a.term),
                  };
              });
        data.err = null;
        console.log(data);
        socket.emit("questionInit", data);
    });
});

http.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
