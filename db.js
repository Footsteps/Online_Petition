const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:angela:twilight@localhost:5432/petition"
);

//I am going to call this function in the server, whenever the /cities page gets a get request
//spiced pg is looking in my database --> actors
//table --> cities

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
    return db.query(`SELECT * FROM users WHERE email = $1`, [email]);
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

//////////////////edits///////////////////////////////

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
