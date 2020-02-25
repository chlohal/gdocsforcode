// server.js
// where your node app starts

// init project
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text());

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static(__dirname + "/assets"));

app.get("/projects/:projid/code", function(req, res) {
    res.sendFile(__dirname + "/pages/code.html");
});

app.get(function(req, res, next) {
    let regexProc = /\/api\/projects\/([-\w_]+)\/files/.exec(req.path);
    if(!regexProc) return next;

    let fileName = regexProc[1] + "/" + req.path.substring(regexProc[0].length);

    if(!fs.existsSync(__dirname + "/../" + fileName)) return res.sendStatus(404);

    res.send(fs.readFileSync(__dirname + "/../" + fileName, {encoding: "utf8"}));

});
app.get("/api/projects/:projid/files/index.json", function(req, res) {
    res.send(JSON.stringify(getFileTree(req.params.projid)));
});

app.get("/api/projects/:projid/files", function(req, res) {
    console.log(__dirname + "/../" + req.params.projid + "/" + req.query.file);
    if(!req.query.file) return res.sendStatus(400);
    if(!fs.existsSync(__dirname + "/../" + req.params.projid + "/" + req.query.file)) return res.sendStatus(404);

    res.send(fs.readFileSync(__dirname + "/../" + req.params.projid + "/" + req.query.file, {encoding: "utf8"}));
});

function getFileTree(address) {
    let result = {};
    let items = fs.readdirSync(__dirname + "/../" + address, {withFileTypes: true});
    for(let i = 0; i < items.length; i++) {
        if(items[i].name.startsWith(".")) continue;

        if(items[i].isDirectory()) result[items[i].name] = getFileTree(address + "/" + items[i].name);
        else if(items[i].isFile()) result[items[i].name] = null;
    }
    return result;
}
// listen for requests :)
var listener = app.listen(8080, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});