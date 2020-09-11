-- this is how you write a commen in an SQL file
--psql -d petition -f signers.sql;

DROP TABLE IF EXISTS signers;

CREATE TABLE signers
(
    id SERIAL primary key,
    user_id INT NOT NULL REFERENCES users(id),
    sign TEXT NOT NULL
    
);





