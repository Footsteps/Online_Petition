//time to require all the modules I need!
const express = require("express");
const app = express();

const handlebars = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

//require the files I need
const bc = require("./bc");
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

///middleware for errors
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: err,
    });
});
////////////////////////////////ROOT ROUTE //////////////////////////////////////
app.get("/", (req, res) => {
    //console.log("get request to root route happend!!!");
    res.redirect("/register");
});

//////////////////registration//////////////////////////////////////
app.get("/register", (req, res) => {
    console.log("get request to registration route happend!!!");
    res.render("register", {
        layout: "main",
    });
});

app.post("/register", (req, res) => {
    console.log("post request to registration route happend!!!");
    //console.log("req.body: ", req.body);
    let first = req.body.name;
    //console.log(firstname);
    let last = req.body.last;
    //console.log(lastname);
    let email = req.body.email;
    //console.log(sign);
    let password = req.body.password;
    //console.log(password);
    let userID;

    if (first === "" || last === "" || email === "" || password === "") {
        res.render("register", {
            error: "Oh, something went wrong! Please try again :) ",
        });
    } else {
        console.log("req.body: ", req.body);
        //console.log(req.body.password);

        bc.hash(req.body.password).then((salted) => {
            console.log("salted: ", salted);
            db.register(req.body.first, req.body.last, req.body.email, salted)
                .then((id) => {
                    userId = id.rows[0].id;
                    //set id as cookie
                    req.session.userId = userId;
                    console.log("req.session: ", req.session);
                    res.redirect("petition");
                })
                .catch((err) => {
                    console.log("err in register: ", err);
                });
        });
    }

    //console.log("req.session: ", req.session);

    //console.log("req.session after adding something: ", req.session);
});

////////////////////////////////PETITION ROUTE //////////////////////////////////////
app.get("/petition", (req, res) => {
    //console.log("get request to petition route happend!!!");

    if (!req.session.signed) {
        res.render("petition", {
            layout: "main",
        });
    } else {
        res.redirect("/signed");
    } //closes if-else-cookie
});

app.post("/petition", (req, res) => {
    console.log("req.body: ", req.body);
    //console.log("req.body: ", req.body);
    let sign = req.body.signature;
    //console.log(sign);
    let user_id = req.session.userId;
    let signerId;

    db.addSignature(sign, user_id)
        .then((id) => {
            //console.log(id);
            //console.log(id.rows[0]);#
            //console.log(id.rows[0].id);
            //store id in variable
            signerId = id.rows[0].id;
            //console.log(thisSign);
            //console.log("req.session: ", req.session);
            //set signature as cookie
            req.session.id = signerId;
            //console.log("req.session: ", req.session);
            //set cookie for signing
            req.session.signed = "signed!";
            //console.log("req.session: ", req.session);

            res.redirect("/signed");
        })
        .catch((err) => {
            res.render("petition", {
                error: "Ooops, something went wrong! Please sign again.",
            });
            console.log("err in addSigner: ", err);
        });

    //console.log("req.session: ", req.session);

    //console.log("req.session after adding something: ", req.session);
});

////////////////////////////////SIGNED ROUTE //////////////////////////////////////

app.get("/signed", (req, res) => {
    //console.log("get request to signed route happend!!!");
    //res.render("signed", {});
    db.getSignature(req.session.id)
        .then(({ rows }) => {
            //console.log(rows);
            let sign = rows[0].sign;
            //console.log(sign);
            //console.log(typeof rows);
            //console.log(typeof sign);

            res.render("signed", {
                sign,
            });
        })
        .catch((err) => {
            console.log("err in getSignature: ", err);
        });
    /*
    db.getTable()
        .then(({ rows }) => {
            for (let i = 0; i < rows.length; i++) {
                console.log("rows: ", rows);
                console.log("id: ", rows[i].id);
                console.log("firstname: ", rows[i].firstname);
                console.log("lastname: ", rows[i].lastname);
                console.log("signature: ", rows[i].sign);
            }
        })
        .catch((err) => {
            console.log("err in getSigners: ", err);
        });
        */
});

////////////////////////////////SIGNERS ROUTE //////////////////////////////////////
app.get("/signers", (req, res) => {
    //console.log("get request to signers route happend!!!");

    db.getSigners()
        .then(({ rows }) => {
            res.render("signers", {
                rows: rows,
            });
            console.log("data: ", rows);
        })
        .catch((err) => {
            console.log("err in getSigners: ", err);
        });
});

//////////////////////////////login////////////////////////////////////////
app.get("/login", (req, res) => {
    console.log("get request to login route happend!!!");
    res.render("login", {
        layout: "main",
    });
});

app.post("/login", (req, res) => {
    console.log("post request to login route happend!!!");
    //console.log("req.body: ", req.body);
    let emailLogin = req.body.email;
    //console.log(sign);
    let passwordLogin = req.body.password;
    //console.log(password);
    //console.log("req.body: ", req.body);
    let hash;

    if (emailLogin === "" || passwordLogin === "") {
        res.render("login", {
            error: "Oh, something went wrong! Please try again :) ",
        });
    } else {
        db.email(req.body.email)
            .then(({ rows }) => {
                //console.log("rows: ", rows[0].email);
                //console.log(rows[0].password);
                //console.log(passwordLogin);
                //console.log(rows[0].id);
                hash = rows[0].password;

                bc.compare(passwordLogin, rows[0].password).then((result) => {
                    if (result == true) {
                        console.log("password works!!!!");
                        req.session.userId = rows[0].id;
                        //console.log("req.session: ", req.session);
                        if (!req.session.signed) {
                            res.render("petition", {
                                layout: "main",
                            });
                        } else {
                            res.redirect("/signed");
                        } //closes if-else-cookie
                    } else {
                        res.render("login", {
                            error:
                                "Oh, something went wrong! Please try again :) ",
                        });
                    }
                });
            })
            .catch((err) => {
                console.log("err in email: ", err);
            });
    }

    //console.log("req.session: ", req.session);

    //console.log("req.session after adding something: ", req.session);
});

/////////////////////////////////protecting from iframe///////////////////////////////

app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    next();
});

app.listen(8080, () => console.log("petition server is running :)"));
