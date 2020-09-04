-- this is how you write a commen in an SQL file
--DROP TABLE IF EXISTS signers;

CREATE TABLE signers
(
    id SERIAL primary key,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    sign TEXT NOT NULL
);

INSERT INTO signers
    (firstname, lastname, sign)
VALUES
    ('Angela', 'Schumacher', 'VERY LONG TEXT');


INSERT INTO signers
    (firstname, lastname, sign)
VALUES
    ('Brigitte', 'Markmann', 'VERY LONG TEXT');


INSERT INTO signers
    (firstname, lastname, sign)
VALUES
    ('Marion', 'Mohr', 'VERY LONG TEXT');



