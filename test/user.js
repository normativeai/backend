var supertest = require("supertest");
var server = supertest.agent("http://localhost:3000");
const utils = require('./utils.js');
const User = require('../models/user');
const user = require('./fixtures/user.json').User;

describe("Creation of users",function(){

	after(done => {
		User.deleteOne({'email': user.email}, function (err) {done();});
	});

  it("should return code 201 and created the user if all input is ok",function(done){
    server
    .post("/api/signup")
    .send(user)
		.expect(201)
		.then(response => {
			done();
		})
  });
  it("should return code 400 if user already exists",function(done){
		User.create(user, function (err) { });
    server
    .post("/api/signup")
    .send(user)
		.expect(400, 'User already exists', done);
  });
  it("should return code 422 and message if no email was given",function(done){
    var obj = Object.assign({}, user);
    obj.email = '';
    server
    .post("/api/signup")
    .send(obj)
		.expect(422, { errors:
       [ { location: 'body', param: 'email', msg: 'email required', value: '' }]}, done);
  });
  it("should return code 422 and message if no password was given",function(done){
    var obj = Object.assign({}, user);
    obj.password= '';
    server
    .post("/api/signup")
    .send(obj)
		.expect(422, { errors:
       [ { location: 'body', param: 'password', msg: 'password required', value: '' }]}, done);
  });
});

describe("Login",function(){

	before(done => {
		User.create(user, function (err) { done();});
	});

	after(done => {
		User.deleteOne({'email': user.email}, function (err) {done();});
	});

  it("should return code 200 on success",function(done){
    server
    .post("/api/login")
		.send({email: 'test@test.com', password: 'test'})
    .expect(200)
		.then(response => {
			done();
		})
  });

	it("should return code 400 on unknown user",function(done){
    server
    .post("/api/login")
		.send({email: 'unknown@test.com', password: 'test'})
		.expect(400, [false, {
			message: 'Incorrect username.'
		}], done);
  });

	it("should return code 400 on wrong password",function(done){
    server
    .post("/api/login")
		.send({email: 'test@test.com', password: 'wrong'})
		.expect(400, [false, {
			message: 'Incorrect password.'
		}], done);
  });
});

describe("Logout",function(){

  var token = {token: undefined};
	before(done => {
		User.create(user, function (err) {
    utils.login(server,token, done)});
	});

	after(done => {
		User.deleteOne({'email': user.email}, function (err) {done();});
	});
  it("should access user data before logout",function(done){
    server
    .get("/api/users")
    .set('Authorization', `Bearer ${token.token}`)
		.expect(200, {
		}, done);
  });
  it("should return code 200",function(done){
    server
    .get("/api/logout")
    .set('Authorization', `Bearer ${token.token}`)
		.expect(200, {
		}, done);
  });
  /*it("should fail to access user data after logout",function(done){
    server
    .get("/api/users")
    .set('Authorization', `Bearer ${token.token}`)
		.expect(401, {
		}, done);
  })*/;
  // it seems impossible to logout a user with JWT on the server side https://medium.com/devgorilla/how-to-log-out-when-using-jwt-a8c7823e8a6
});

describe("Connecting to API",function(){

	before(done => {
		User.create(user, function (err) { done();});
	});

	after(done => {
		User.deleteOne({'email': user.email}, function (err) {done();});
	});

  it("should return code 401 on unauthenticated user",function(done){
    server
    .get("/api/users")
		.expect(401, {
		}, done);
  });

	describe("with authenticated user",function(){

    var token = {token: undefined};

		before(function(done){
			utils.login(server,token, done);
		});

		it("should return code 200",function(done){
			server
			.get("/api/users")
      .set('Authorization', `Bearer ${token.token}`)
			.expect(200, {
      },	done);
		});
	});
});


