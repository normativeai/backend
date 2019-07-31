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
		.expect(400, {error: 'User already exists'}, done);
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

  it("should be case insensitive on email",function(done){
    server
    .post("/api/login")
		.send({email: 'Test@tEst.com', password: 'test'})
    .expect(200)
		.then(response => {
			done();
		})
  });

	it("should return code 400 on unknown user",function(done){
    server
    .post("/api/login")
		.send({email: 'unknown@test.com', password: 'test'})
		.expect(400, {data: false,
			err: 'Username and/or password are unknown or incorrect'
		}, done);
  });

	it("should return code 400 on wrong password",function(done){
    server
    .post("/api/login")
		.send({email: 'test@test.com', password: 'wrong'})
		.expect(400, {data: false,
			err: 'Username and/or password are unknown or incorrect'
		}, done);
  });
});

describe("Logout",function(){

  var token = {token: undefined};
	before(done => {
		User.create(user, function (err) {
    utils.login(server,token, user, done)});
	});

	after(done => {
		User.deleteOne({'email': user.email}, function (err) {done();});
	});
  it("should access user data before logout",function(done){
    server
    .get("/api/users")
    .set('Authorization', `Bearer ${token.token}`)
		.expect(200)
		.then(response => {
			done();
		})
  });
  it("should return code 200",function(done){
    server
    .get("/api/logout")
    .set('Authorization', `Bearer ${token.token}`)
		.expect(200, { "message": "Logged out."
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

  var u;

	before(done => {
		User.create(user, function (err, user) { u = user; done();});
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

    const Theory = require('../models/theory');
    const theory = require('./fixtures/theory.json').Theory;
    const theory2 = require('./fixtures/theory.json').Theory2;
    const Query = require('../models/query');
    const query = require('./fixtures/query.json').Query;
    const query2 = require('./fixtures/query.json').Query2;

    const t1 = {
      _id: theory._id,
      name: theory.name,
      description: theory.description,
      lastUpdate: theory.lastUpdate
    };
    const t2 = {
      _id: theory2._id,
      name: theory2.name,
      description: theory2.description,
      lastUpdate: theory2.lastUpdate
    };

    const q1 = {
      _id: query._id,
      name: query.name,
      description: query.description,
      lastUpdate: query.lastUpdate,
      theory: t1._id
    }
    const q2 = {
      _id: query2._id,
      name: query2.name,
      description: query2.description,
      lastUpdate: query2.lastUpdate,
      theory: t1._id

    }

    var token = {token: undefined};

    before(function(done) {
      utils.login(server, token, user, () => {
      theory.user = u;
      Theory.create(theory, function (err) {
      theory2.user = u;
      Theory.create(theory2, function (err) {
      query.user = u;
      Query.create(query, function (err) {
      query2.user = u;
      Query.create(query2, function (err) {
      u.theories.push(theory);
      u.theories.push(theory2);
      u.queries.push(query);
      u.queries.push(query2);
      u.save(function (err, u2) {
        done();
      })})})})})});
    });
    after(done => {
      Theory.deleteOne({'name': theory.name}, function (err) {
      Theory.deleteOne({'name': theory2.name}, function (err) {
      Query.deleteOne({'name': query.name}, function (err) {
      Query.deleteOne({'name': query2.name}, function (err) {
        done();
      })})})});
    });

		it("should return code 200 and all dashboard information",function(done){
			server
			.get("/api/users")
      .set('Authorization', `Bearer ${token.token}`)
			.expect(200, { data: {'_id': user._id, 'name': user.name, 'email': user.email, 'theories': [t1, t2], 'queries': [q1,q2] }
      },	done);
		});
	});
});


