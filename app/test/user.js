var supertest = require("supertest");
var server = supertest.agent("http://localhost:3000");
const utils = require('./utils.js');
const User = require('../models/user');
const user = require('./fixtures/user.json').User;

describe("Creation of users",function(){

  it("should return the user if all input is ok",function(done){
    server
    .post("/signup")
    .send(user)
		.expect(200)
		.then(response => {
			done();
		})
  });
});

describe("Login",function(){

	before(done => {
		User.create(user, function (err) { done();});
	});

  it("should return code 200 on success",function(done){
    server
    .post("/login")
		.send({email: 'test@test.com', password: 'test'})
    .expect(200)
		.then(response => {
			done();
		})
  });

	it("should return code 400 on unknown user",function(done){
    server
    .post("/login")
		.send({email: 'unknown@test.com', password: 'test'})
		.expect(400, [false, {
			message: 'Incorrect username.'
		}], done);
  });

	it("should return code 400 on wrong password",function(done){
    server
    .post("/login")
		.send({email: 'test@test.com', password: 'wrong'})
		.expect(400, [false, {
			message: 'Incorrect password.'
		}], done);
  });
});

describe("Logout",function(){

	before(done => {
		User.create(user, function (err) { done();});
	});

  it("should return code 200",function(done){
    server
    .get("/logout")
		.expect(200, {
		}, done);
  });
});

describe("Connecting to API",function(){

	before(done => {
		User.create(user, function (err) { done();});
	});

  it("should return code 401 on unauthenticated user",function(done){
    server
    .get("/api/users")
		.expect(401, {
		}, done);
  });

	describe("with authenticated user",function(){

		before(function(done){
			utils.login(server,done);
		});

		it("should return code 200",function(done){
			server
			.get("/api/users")
			.expect(200)
			.end(function(err, response){
				done();
			});
		});
	});
});


