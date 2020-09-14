const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:angela:twilight@localhost:5432/petition"
);

//I am going to call this function in the server, whenever the /cities page gets a get request
//spiced pg is looking in my database --> actors
//table --> cities

//////////////my cookies - just to remember///////////////////////
//cookie userId: req.session.userId; set with register
//cookie with signature: req.session.sig; set with addSignature
//cookie that somebody has signed: req.session.signed; set with addSignature
//remove cookie: req.session.userId= null

////////////////////checking the tables///////////////////////////

module.exports.getTableSigners = () => {
    return db.query(`SELECT * FROM signers`);
};

module.exports.getTableUsers = () => {
    return db.query(`SELECT * FROM users`);
};

module.exports.getTableProfiles = () => {
    return db.query(`SELECT * FROM user_profiles`);
};

module.exports.getEmAll = () => {
    return db.query(`SELECT 
    users.id AS user_id, users.first AS first, users.last AS last, users.email AS email, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS url, signers.sign AS sign
FROM users 
FULL OUTER JOIN signers
ON signers.user_id = users.id
FULL OUTER JOIN user_profiles
ON signers.user_id = user_profiles.user_id;`);
};
////////////////////////SIGNATURE CODE///////////////////////////////

module.exports.addSignature = (sign, user_id) => {
    return db.query(
        `
    INSERT INTO signers (sign, user_id)
    VALUES ($1, $2)
    RETURNING id
    `,
        [sign, user_id]
    );
};

module.exports.getSigners = () => {
    return db.query(`SELECT 
    users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
FROM signers 
LEFT JOIN users
ON signers.user_id = users.id
JOIN user_profiles
ON signers.user_id = user_profiles.user_id;`);
};

module.exports.getSignature = (id) => {
    return db.query(`SELECT sign FROM signers WHERE id = $1`, [id]);
};

module.exports.deleteSignature = (id) => {
    return db.query(`DELETE FROM signers WHERE user_id = $1`, [id]);
};

////////////////registration////////////////////////////////
module.exports.register = (first, last, email, password) => {
    return db.query(
        `
    INSERT INTO users (first, last, email, password)
    VALUES ($1, $2, $3, $4)
    RETURNING id
    `,
        [first, last, email, password]
    );
};

//////////////////checkup////////////////////////////
module.exports.getUsers = () => {
    return db.query(`SELECT * FROM users`);
};

////////////////////login////////////////////////////////////
module.exports.email = (email) => {
    return db.query(`SELECT * FROM users WHERE email = ($1)`, [email]);
};

module.exports.checkSign = (id) => {
    return db.query(
        `SELECT * FROM signers
        WHERE user_id = $1
        `,
        [id]
    );
};
///////////////////profile/////////////////////////////////////
module.exports.profiling = (age, city, url, user_id) => {
    return db.query(
        `
    INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id
    `,
        [age || null, city || null, url || null, user_id]
    );
};

////////////////////////cities//////////////////////////

module.exports.getCities = (city) => {
    return db.query(
        `SELECT 
    users.first, users.last, user_profiles.city
    FROM signers 
    LEFT JOIN users
    ON signers.user_id = users.id
    JOIN user_profiles
    ON signers.user_id = user_profiles.user_id
    WHERE LOWER(user_profiles.city) = LOWER($1)
    `,
        [city]
    );
};

/////////////////edit/////////////////////////////////////////

module.exports.editGet = (id) => {
    return db.query(
        `SELECT 
    users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url
    FROM signers 
    LEFT JOIN users
    ON signers.user_id = users.id
    JOIN user_profiles
    ON signers.user_id = user_profiles.user_id
    WHERE users.id = $1
    `,
        [id]
    );
};
//////////////////edit without password change///////////////////////////////

module.exports.editUsers = (id, first, last, email) => {
    return db.query(
        `
    UPDATE users SET first = $2, last = $3, email = $4 
    WHERE users.id = $1
    `,
        [id, first, last, email]
    );
};

module.exports.editProfiles = (id, age, city, url) => {
    return db.query(
        `
    INSERT INTO user_profiles (user_id, age, city, url)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET age = $2, city = $3, url = $4
    `,
        [id, age || null, city || null, url || null]
    );
};

//////////////////edit with password change///////////////////////////////

/////////////////////////////get///////////////////////////////////

module.exports.editUsersWithPw = (id, first, last, email, password) => {
    return db.query(
        `
    UPDATE users SET first = $2, last = $3, email = $4, password = $5
    WHERE users.id = $1
    `,
        [id, first, last, email, password]
    );
};

////////////////////////////post - password not changed //////////////////
module.exports.editUsers = (id, first, last, email) => {
    return db.query(
        `
    UPDATE users SET first = $2, last = $3, email = $4 
    WHERE users.id = $1
    `,
        [id, first, last, email]
    );
};

module.exports.editProfiles = (id, age, city, url) => {
    return db.query(
        `
    INSERT INTO user_profiles (user_id, age, city, url)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET age = $2, city = $3, url = $4
    `,
        [id, age || null, city || null, url || null]
    );
};

/////////////////////post - password changed /////////////////////////////
module.exports.editUsersWithPw = (id, first, last, email, password) => {
    return db.query(
        `
    UPDATE users SET first = $2, last = $3, email = $4, password = $5
    WHERE users.id = $1
    `,
        [id, first, last, email, password]
    );
};

module.exports.editProfilesPwChanged = (id, age, city, url) => {
    return db.query(
        `
    INSERT INTO user_profiles (user_id, age, city, url)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET age = $2, city = $3, url = $4
    `,
        [id, age || null, city || null, url || null]
    );
};

//////////////////////numbers of signers////////////////
module.exports.number = () => {
    return db.query(`SELECT COUNT(*) FROM signers`);
};
