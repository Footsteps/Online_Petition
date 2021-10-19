//time to require all the modules I need!
const express = require("express");
const app = express();

const handlebars = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

//export app//
module.exports.app = app;
//require the files I need
//const { SESSION_SECRET: sessionSecret } = require("/.secrets");
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

////////////////////////////////ROOT ROUTE //////////////////////////////////////
app.get("/", (req, res) => {
    db.getEmAll()
        .then(({ rows }) => {
            //console.log("all tables: ", rows);
        })
        .catch((err) => {
            console.log("err in get profiles: ", err);
        });

    if (!req.session.userId && req.url != "/login" && req.url != "/register") {
        res.redirect("/register");
    } else {
        res.redirect("/signed");
    }
});

//////////////////registration//////////////////////////////////////
app.get("/register", (req, res) => {
    res.render("register", {
        layout: "main",
    });
});

app.post("/register", (req, res) => {
    let first = req.body.first;

    let last = req.body.last;

    let email = req.body.email;

    let password = req.body.password;

    let userID;

    if (first === "" || last === "" || email === "" || password === "") {
        res.render("register", {
            error: "Oh, something went wrong! Please try again :) ",
        });
    } else {
        bc.hash(req.body.password).then((salted) => {
            db.register(req.body.first, req.body.last, req.body.email, salted)
                .then((id) => {
                    userId = id.rows[0].id;
                    //set id as cookie
                    req.session.userId = userId;

                    res.redirect("profile");
                })
                .catch((err) => {
                    console.log("err in register: ", err);
                    res.render("register", {
                        error: "Oh, something went wrong! Please try again :) ",
                    });
                });
        });
    }
});

//////////////////////////PROFILE ROUTE//////////////////////////
app.get("/profile", (req, res) => {
    if (!req.session.userId && req.url != "/login" && req.url != "/register") {
        res.redirect("/register");
    } else {
        res.render("profile", {
            layout: "main",
        });
    }
});

app.post("/profile", (req, res) => {
    if (
        (!req.session.userId &&
            req.url != "/login" &&
            req.url != "/register") ||
        !req.session.csrfSecret
    ) {
        res.redirect("/register");
    } else {
        let age = req.body.age;

        let city = req.body.city;

        let url = req.body.url;

        let user_id = req.session.userId;

        city = city.split(" ").join("_");

        if (url.startsWith("www")) {
            url = "https://" + url;
        }

        if (url.startsWith("http") || !req.body.url) {
            db.profiling(age, city, url, user_id)
                .then(() => {
                    res.redirect("/petition");
                })
                .catch((err) => {
                    console.log("err in profiling: ", err);
                });
        } else {
            res.render("profile", {
                error: "Ooops, something went wrong! Please try again.",
            });
        }
    }
});

////////////////////////////////PETITION ROUTE //////////////////////////////////////
app.get("/petition", (req, res) => {
    if (!req.session.userId && req.url != "/login" && req.url != "/register") {
        res.redirect("/register");
    } else {
        if (!req.session.signed) {
            res.render("petition", {
                layout: "main",
            });
        } else {
            res.redirect("/signed");
        }
    }
});

app.post("/petition", (req, res) => {
    if (
        (!req.session.userId &&
            req.url != "/login" &&
            req.url != "/register") ||
        !req.session.csrfSecret
    ) {
        res.redirect("/register");
    } else {
        let sign = req.body.signature;

        let user_id = req.session.userId;
        let signerId;

        db.addSignature(sign, user_id)
            .then((id) => {
                signerId = id.rows[0].id;

                //set signature as cookie
                req.session.sig = signerId;

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
    }
});

////////////////////////////////SIGNED ROUTE //////////////////////////////////////

app.get("/signed", (req, res) => {
    if (
        (!req.session.userId &&
            req.url != "/login" &&
            req.url != "/register") ||
        !req.session.csrfSecret
    ) {
        res.redirect("/register");
    } else {
        //res.render("signed", {});
        if (!req.session.sig) {
            res.redirect("/petition");
        } else {
            db.getSignature(req.session.sig)
                .then(({ rows }) => {
                    let sign = rows[0].sign;

                    res.render("signed", {
                        sign,
                    });
                })
                .catch((err) => {
                    console.log("err in getSignature: ", err);
                });
        }
    } //closes else userId
});

app.post("/delete/signature", (req, res) => {
    db.deleteSignature(req.session.userId)
        .then(({ rows }) => {
            req.session.signed = null;

            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("err in delete Signature: ", err);
        });
});

app.post("/logout", (req, res) => {
    req.session = null;

    res.redirect("/");
});

////////////////////////////////SIGNERS ROUTE //////////////////////////////////////

app.get("/signers", (req, res) => {
    console.log("req.session", req.session.sig);
    if (
        (!req.session.userId &&
            req.url != "/login" &&
            req.url != "/register") ||
        !req.session.csrfSecret
    ) {
        res.redirect("/register");
    } else {
        if (!req.session.sig) {
            res.redirect("/petition");
        } else {
            let num;
            db.number().then(({ rows }) => {
                num = rows[0].count;
            });
            db.getSigners()
                .then(({ rows }) => {
                    res.render("signers", {
                        rows: rows,
                        num,
                    });

                    /*
            for (let i = 0; i < rows.length; i++) {
                console.log(rows[i].first);
                console.log(rows[i].last);
                console.log(rows[i].age);
                console.log(rows[i].url);
                console.log(rows[i].city);
            }
            */
                })
                .catch((err) => {
                    console.log("err in getSigners: ", err);
                });
        }
    }
});

////////////////////////////////city ROUTE //////////////////////////////////////
app.get("/signers/:city", (req, res) => {
    if (
        (!req.session.userId &&
            req.url != "/login" &&
            req.url != "/register") ||
        !req.session.csrfSecret
    ) {
        res.redirect("/register");
    } else {
        const city = req.params.city;

        db.getCities(req.params.city)
            .then(({ rows }) => {
                res.render("city", {
                    rows: rows,
                    city,
                });
            })
            .catch((err) => {
                console.log("err in getCities: ", err);
            });
    } // closes else userId-cookie
});

//////////////////////////////login////////////////////////////////////////
app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main",
    });
});

app.post("/login", (req, res) => {
    let emailLogin = req.body.email;

    let passwordLogin = req.body.password;

    let hash;

    if (emailLogin === "" || passwordLogin === "") {
        res.render("login", {
            error: "Oh, something went wrong! Please try again :) ",
        });
    } else {
        db.email(req.body.email)
            .then(({ rows }) => {
                //console.log("rows: ", results);
                //console.log("password: ", results.rows[0].password);

                bc.compare(passwordLogin, rows[0].password).then((result) => {
                    if (result == true) {
                        //password works
                        req.session.userId = rows[0].id;

                        db.checkSign(req.session.userId)
                            .then(({ rows }) => {
                                if (rows[0] == undefined) {
                                    res.redirect("/petition");
                                } else {
                                    req.session.sig = rows[0].id;

                                    res.redirect("/signed");
                                }
                            })
                            .catch((err) => {
                                console.log("err in checkSign: ", err);
                            });
                    } else {
                        res.render("login", {
                            error: "Oh, something went wrong! Please try again :) ",
                        });
                    }
                });
            })
            .catch((err) => {
                console.log("err in email: ", err);
            });
    }
});

//////////////////////////////edit////////////////////////////////////////

app.get("/edit", (req, res) => {
    if (
        (!req.session.userId &&
            req.url != "/login" &&
            req.url != "/register") ||
        !req.session.csrfSecret
    ) {
        res.redirect("/register");
    } else {
        if (!req.session.signed) {
            res.redirect("/petition");
        } else {
            let user_id = req.session.userId;
            db.editGet(user_id)
                .then(({ rows }) => {
                    res.render("edit", {
                        rows: rows,
                    });
                })
                .catch((err) => {
                    console.log("err in editGet: ", err);
                }); //closes error;
        } //closes editGet
    } //closes editing
});

app.post("/edit", (req, res) => {
    if (
        (!req.session.userId &&
            req.url != "/login" &&
            req.url != "/register") ||
        !req.session.csrfSecret
    ) {
        res.redirect("/register");
    } else {
        let user_id = req.session.userId;

        let first = req.body.first;

        let last = req.body.last;

        let email = req.body.email;

        let pw = req.body.password;

        let age = req.body.age;

        let city = req.body.city;

        let url = req.body.url;

        let hash;

        if (url.startsWith("www")) {
            console.log("url starts with www");
            url = "https://" + url;
            console.log(url);
        }

        if (url.startsWith("http") || !req.body.url) {
            if (pw == "") {
                console.log("password did not get changed");
                db.editUsers(user_id, first, last, email)
                    .then(() => {
                        db.editProfiles(user_id, age, city, url)
                            .then((results) => {
                                //delivers results

                                res.redirect("/signed");
                            })
                            .catch((err) => {
                                console.log("err in editProfiles: ", err);
                            });
                    })
                    .catch((err) => {
                        console.log("err in editUsers: ", err);
                    });
            } else {
                //password got changed
                hast = pw;
                bc.hash(req.body.password).then((salted) => {
                    //delivers salted password

                    db.editUsersWithPw(user_id, first, last, email, salted)
                        .then(() => {
                            db.editProfiles(user_id, age, city, url)
                                .then((results) => {
                                    res.redirect("/signed");
                                })
                                .catch((err) => {
                                    console.log("err in editProfiles: ", err);
                                });
                        })
                        .catch((err) => {
                            console.log(
                                "err in edit users with password: ",
                                err
                            );
                        });
                });
            }
        } else {
            let user_id = req.session.userId;
            db.editGet(user_id)
                .then(({ rows }) => {
                    res.render("edit", {
                        rows: rows,
                        error: "Uh, something went wrong. Please try again",
                    });
                })
                .catch((err) => {
                    console.log("err in editGet: ", err);
                });
        }
    }
});

/////////////////////////////////protecting from iframe///////////////////////////////

app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    next();
});

if (require.main == module) {
    app.listen(process.env.PORT || 8080, () => console.log("Server Listening"));
}
