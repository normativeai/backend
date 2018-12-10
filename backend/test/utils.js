var db = require('mongoose');
var supertest = require("supertest");

async function dropDBs() {
	const mongo = await db;
	await mongo.connection.dropDatabase();
};
function seedUser(server, done) {
	const user = require('./fixtures/user.json');
	server
    .post("/api/user")
    .send(user)
    .then(response => {
			done();
    });
};
function login(server, done) {
	server
    .post("/api/login")
    .send({"email": 'test@test.com', "password": 'test'})
		.end(function(err, response){
			done();
		});
};



module.exports.dropDBs = dropDBs;
module.exports.seedUser = seedUser;
module.exports.login = login;
