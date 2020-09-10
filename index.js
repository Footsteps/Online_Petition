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
    /*
    db.getTableUsers()
        .then(({ rows }) => {
            for (let i = 0; i < rows.length; i++) {
                console.log("users table: ", rows);
            }
        })
        .catch((err) => {
            console.log("err in getSigners: ", err);
        });
    db.getTableSigners()
        .then(({ rows }) => {
            for (let i = 0; i < rows.length; i++) {
                console.log("signers table: ", rows);
            }
        })
        .catch((err) => {
            console.log("err in getSigners: ", err);
        });
    db.getTableProfiles()
        .then(({ rows }) => {
            for (let i = 0; i < rows.length; i++) {
                console.log("profiles table: ", rows);
            }
        })
        .catch((err) => {
            console.log("err in get profiles: ", err);
        });
   */
    db.getEmAll()
        .then(({ rows }) => {
            console.log("all tables: ", rows);
        })
        .catch((err) => {
            console.log("err in get profiles: ", err);
        });

    //console.log("req.session: ", req.session);

    //console.log("get request to root route happend!!!");
    if (!req.session.userId && req.url != "/login" && req.url != "/register") {
        res.redirect("/register");
    } else {
        res.redirect("/signed");
    }
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
        //console.log("req.body: ", req.body);
        //console.log(req.body.password);

        bc.hash(req.body.password).then((salted) => {
            //console.log("salted: ", salted);
            db.register(req.body.first, req.body.last, req.body.email, salted)
                .then((id) => {
                    userId = id.rows[0].id;
                    //set id as cookie
                    req.session.userId = userId;
                    //console.log("req.session: ", req.session);
                    res.redirect("profile");
                })
                .catch((err) => {
                    console.log("err in register: ", err);
                });
        });
    }

    //console.log("req.session: ", req.session);

    //console.log("req.session after adding something: ", req.session);
});

//////////////////////////PROFILE ROUTE//////////////////////////
app.get("/profile", (req, res) => {
    console.log("get request to profile route happend!!!");

    if (!req.session.userId && req.url != "/login" && req.url != "/register") {
        res.redirect("/register");
    } else {
        res.render("profile", {
            layout: "main",
        });
    } //closes else userId
});

app.post("/profile", (req, res) => {
    console.log("post request to profile route happend!!!");
    //console.log("req.body: ", req.body);
    let age = req.body.age;
    //console.log(age);
    let city = req.body.city;
    //console.log(city);
    let url = req.body.url;
    //console.log(rul);
    let user_id = req.session.userId;
    console.log(user_id);
    console.log("req.body: ", req.body);
    //console.log("req.session: ", req.session);

    city = city.split(" ").join("_");
    console.log("city after split: ", city);

    if (url.startsWith("www")) {
        console.log("url starts with www");
        url = "https://" + url;
        console.log(url);
    }
    if (url.startsWith("http") || !req.body.url) {
        console.log("url starts with http or is void");
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

    //console.log("req.session after adding something: ", req.session);
});

////////////////////////////////PETITION ROUTE //////////////////////////////////////
app.get("/petition", (req, res) => {
    //console.log("get request to petition route happend!!!");
    if (!req.session.userId && req.url != "/login" && req.url != "/register") {
        res.redirect("/register");
    } else {
        if (!req.session.signed) {
            res.render("petition", {
                layout: "main",
            });
        } else {
            res.redirect("/signed");
        } //closes if-else-cookie
    } //closes else userId
});

app.post("/petition", (req, res) => {
    console.log("post request to petition rout happend!!!");
    console.log("req.body: ", req.body);
    //console.log("req.body: ", req.body);
    let sign = req.body.signature;
    console.log(sign);
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
            console.log("req.session: ", req.session);

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
    console.log("req.session.userId", req.session.userId);
    if (!req.session.userId && req.url != "/login" && req.url != "/register") {
        res.redirect("/register");
    } else {
        //res.render("signed", {});
        if (!req.session.signed) {
            res.redirect("/petition");
        } else {
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
        }
    } //closes else userId
});

app.post("/delete/signature", (req, res) => {
    console.log("post request to delete/signed route happend!!!");
    console.log("req.session.userId", req.session.userId);
    console.log("req.session.id", req.session.id);
    console.log("req.session.signed", req.session.signed);

    db.deleteSignature(req.session.userId)
        .then(({ rows }) => {
            console.log("signature deleted!");

            req.session.signed = null;

            console.log(req.session.signed);
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("err in delete Signature: ", err);
        });
});

////////////////////////////////SIGNERS ROUTE //////////////////////////////////////

app.get("/signers", (req, res) => {
    if (!req.session.userId && req.url != "/login" && req.url != "/register") {
        res.redirect("/register");
    } else {
        //console.log("get request to signers route happend!!!");
        if (!req.session.signed) {
            res.redirect("/petition");
        } else {
            db.getSigners()
                .then(({ rows }) => {
                    res.render("signers", {
                        rows: rows,
                    });
                    //console.log("get Signers: ", rows);
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
        } //closes else
    } //closes else cookie UserId
});

////////////////////////////////city ROUTE //////////////////////////////////////
app.get("/signers/:city", (req, res) => {
    if (!req.session.userId && req.url != "/login" && req.url != "/register") {
        res.redirect("/register");
    } else {
        //console.log("get request to signers route happend!!!");
        const city = req.params.city;
        //console.log(req.params);
        console.log(city);
        db.getCities(req.params.city)
            .then(({ rows }) => {
                //console.log("rows: ", rows);
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
                //console.log("rows: ", results);
                //console.log("password: ", results.rows[0].password);
                //console.log(passwordLogin);
                //console.log(results.rows[0].id);
                //hashed = results.rows[0].password;

                bc.compare(passwordLogin, rows[0].password).then((result) => {
                    if (result == true) {
                        console.log("password works!!!!");
                        req.session.userId = rows[0].id;
                        console.log("req.session: ", req.session);
                        if (!req.session.signed) {
                            res.redirect("/petition");
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

//////////////////////////////edit////////////////////////////////////////

app.get("/edit", (req, res) => {
    console.log("get request to edit route happend!!!");
    if (!req.session.userId && req.url != "/login" && req.url != "/register") {
        res.redirect("/register");
    } else {
        if (!req.session.signed) {
            res.redirect("/petition");
        } else {
            let user_id = req.session.userId;
            db.editGet(user_id)
                .then(({ rows }) => {
                    console.log("rows in getEdit", rows);
                    res.render("edit", {
                        rows: rows,
                    });
                })
                .catch((err) => {
                    console.log("err in editGet: ", err);
                }); //closes error; //closes editGet
        } //closes else
    } //closes else userId cookie
});

app.post("/edit", (req, res) => {
    //console.log("post request to login route happend!!!");
    let user_id = req.session.userId;
    //console.log(user_id);
    let first = req.body.first;
    //console.log("1", first);
    let last = req.body.last;
    //console.log("2", last);
    let email = req.body.email;
    console.log("email", email);
    let pw = req.body.password;
    //console.log("pw", pw);
    let age = req.body.age;
    //console.log("age", age);
    let city = req.body.city;
    //console.log("city", city);
    let url = req.body.url;
    //console.log("url", url);
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
                            //console.log(results);
                            //console.log("this worked!!!");
                            res.redirect("/signed");
                        })
                        .catch((err) => {
                            console.log("err in editProfiles: ", err);
                        }); //closes error; //closes editGet
                })
                .catch((err) => {
                    console.log("err in editUsers: ", err);
                }); //closes error; //closes editGet
        } else {
            console.log("password did change!");
            console.log(pw);
            hast = pw;
            bc.hash(req.body.password).then((salted) => {
                console.log("salted pw: ", salted);

                db.editUsersWithPw(user_id, first, last, email, salted)
                    .then(() => {
                        //console.log("this worked!!");
                        db.editProfilesPwChanged(user_id, age, city, url)
                            .then((results) => {
                                console.log(results);
                                console.log("this worked!!!");
                                //res.redirect("/signed");
                            })
                            .catch((err) => {
                                console.log("err in editProfiles: ", err);
                            }); //closes error; //closes editGet
                    })
                    .catch((err) => {
                        console.log("err in edit users with password: ", err);
                    });
            });
        }
    } else {
        let user_id = req.session.userId;
        res.redirect("/edit", {
            error: "Ooops, something went wrong! Please try again.",
        });
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
