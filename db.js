const spicedPg = require("spiced-pg");
var db = spicedPg("postgres:angela:twilight@localhost:5432/petition");

//I am going to call this function in the server, whenever the /cities page gets a get request
//spiced pg is looking in my database --> actors
//table --> cities

module.exports.getTableSigners = () => {
    return db.query(`SELECT * FROM signers`);
};

module.exports.getTableUsers = () => {
    return db.query(`SELECT * FROM users`);
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
    return db.query(`SELECT first, last FROM users`);
};

module.exports.getSignature = (id) => {
    return db.query(`SELECT sign FROM signers WHERE ${id} = id;`);
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

/////////////////get password/////////////////////////
