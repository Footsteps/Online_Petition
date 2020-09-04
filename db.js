const spicedPg = require("spiced-pg");
var db = spicedPg("postgres:angela:twilight@localhost:5432/petition");

//I am going to call this function in the server, whenever the /cities page gets a get request
//spiced pg is looking in my database --> actors
//table --> cities

module.exports.getSigners = () => {
    return db.query(`SELECT * FROM signers`);
};

module.exports.addSigner = (firstname, lastname, sign) => {
    return db.query(
        `
    INSERT INTO signers (firstname, lastname, sign)
    VALUES ($1, $2, $3)
    RETURNING id
    `,
        [firstname || null, lastname || null, sign || null]
    );
};

module.exports.deliverSigner = () => {
    db.query(`SELECT firstname, lastname FROM signers `);
};
