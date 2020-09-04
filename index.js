//time to require all the modules I need!
const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

//require the files I need
const db = require("./db");
app.use(express.static("./public"));

//middleware cookie
app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

//middleware handlebars
app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

//middleware for urlencoded requested bodies --> browser will automatically generate one when a post happens
//middleware will parse it and I can access it with using req.body
app.use(
    express.urlencoded({
        extended: false,
    })
);

//middleware to protect against csrf: place it after cookie-session and after app.use(express.urlencoded)
app.use(csurf());
//deal with my token for csurf --> forms
app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

////////////////////////////////ROOT ROUTE //////////////////////////////////////
app.get("/", (req, res) => {
    console.log("get request to root route happend!!!");
    res.redirect("/petition");
});

////////////////////////////////PETITION ROUTE //////////////////////////////////////
app.get("/petition", (req, res) => {
    console.log("get request to petition route happend!!!");

    if (!req.session.cumin) {
        res.render("petition", {
            layout: "main",
        });
        db.getSigners()
            .then(({ rows }) => {
                //console.log("data: ", rows);
            })
            .catch((err) => {
                console.log("err in getCities: ", err);
            });
    } else {
        res.redirect("/signed");
    } //closes if-else-cookie
});

app.post("/petition", (req, res) => {
    console.log("req.body: ", req.body);
    console.log("req.body.firstname: ", req.body.firstname);
    console.log("req.body.lastname: ", req.body.lastname);
    //const firstname = req.body.username;
    //console.log("firstname: ", firstname);
    /*
    db.addSigner(firstname, lastname, sign)
        .then(() => {
            console.log("yaayaaa");
        })
        .catch((err) => {
            console.log("err in addSigner: ", err);
        });
    console.log("req.session: ", req.session);
    req.session.cumin = "signed!";
    console.log("req.session after adding something: ", req.session);
    */
});

////////////////////////////////SIGNED ROUTE //////////////////////////////////////

app.get("/signed", (req, res) => {
    console.log("get request to signed route happend!!!");
    res.render("signed", {
        layout: "main",
    });
});

////////////////////////////////SIGNERS ROUTE //////////////////////////////////////
app.get("/signers", (req, res) => {
    console.log("get request to signers route happend!!!");

    res.render("signers", {
        layout: "main",
    });

    db.deliverSigner()
        .then(({ rows }) => {
            res.send(rows);
        })
        .catch((err) => {
            console.log("err in getCities: ", err);
        });
});

/////////////////////////////////protecting from iframe///////////////////////////////

app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    next();
});

app.listen(8080, () => console.log("petition server is running :)"));
