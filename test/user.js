const request = require("supertest");
const expect = require('chai').expect
const app = require('../app');
const utils = require('./utils.js');
const User = require('../models/user');
const user = require('./fixtures/user.json').User;

describe("Creation of users",function(){

	afterEach(done => {
		User.deleteOne({'email': user.email}, function (err) {done();});
	});

  it("should return code 201 and created the user if all input is ok", async function() {
    const res = await request(app)
      .post("/api/signup")
      .send(user)
    expect(res.statusCode).equals(201)
  });
  it("should return code 400 if user already exists", async function() {
		User.create(user);
    const res = await request(app)
      .post("/api/signup")
      .send(user)
    expect(res.statusCode).equals(400)
    expect(res.body).to.have.property('error', 'User already exists')
  });
  it("should return code 422 and message if no email was given", async function() {
    var obj = Object.assign({}, user);
    obj.email = '';
    const res = await request(app)
      .post("/api/signup")
      .send(obj)
    expect(res.statusCode).equals(422)
    expect(res.body).to.have.property('errors').to.eql([ { location: 'body', param: 'email', msg: 'email required', value: '' }])
  });
  it("should return code 422 and message if no password was given", async function() {
    var obj = Object.assign({}, user);
    obj.password= '';
    const res = await request(app)
      .post("/api/signup")
      .send(obj)
    expect(res.statusCode).equals(422)
    expect(res.body).to.have.property('errors').to.eql([ { location: 'body', param: 'password', msg: 'password required', value: '' }])
  });
});

describe("Login",function(){

	beforeEach(done => {
		User.create(user, function (err) { done();});
	});

	afterEach(done => {
		User.deleteOne({'email': user.email}, function (err) {done();});
	});

  it("should return code 200 on success", async function() {
    const res = await request(app)
      .post("/api/login")
      .send({email: 'test@test.com', password: 'test'})
    expect(res.statusCode).equals(200)
  });

  it("should be case insensitive on email", async function() {
    const res = await request(app)
      .post("/api/login")
      .send({email: 'Test@tEst.com', password: 'test'})
    expect(res.statusCode).equals(200)
  });

	it("should return code 400 on unknown user", async function() {
    const res = await request(app)
      .post("/api/login")
      .send({email: 'unknown@test.com', password: 'test'})
    expect(res.statusCode).equals(400)
    expect(res.body).to.have.property('err', 'Username and/or password are unknown or incorrect')
  });

	it("should return code 400 on wrong password", async function() {
    const res = await request(app)
      .post("/api/login")
      .send({email: 'test@test.com', password: 'wrong'})
    expect(res.statusCode).equals(400)
    expect(res.body).to.have.property('err', 'Username and/or password are unknown or incorrect')
  });
});

describe("Logout",function(){

  var token

	beforeEach(async function() {
		await User.create(user)
    token = await utils.login(user)
	});

	afterEach(async function() {
		await User.deleteOne({'email': user.email})
	});

  it("should access user data before logout", async function() {
    const res = await request(app)
      .get("/api/users")
      .set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).equals(200)
  });
  it("should return code 200", async function(){
    const res = await request(app)
      .get("/api/logout")
      .set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).equals(200)
    expect(res.body).to.have.property('message', 'Logged out.')
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

	beforeEach(async function() {
		u = await User.create(user)
	});

	afterEach(async function() {
		await User.deleteOne({'email': user.email})
	});

  it("should return code 401 on unauthenticated user", async function(){
    const res = await request(app)
      .get("/api/users")
    expect(res.statusCode).equals(401)
  });

	describe("with authenticated user", function(){

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

    var token

    beforeEach(async function() {
      token = await utils.login(user);
      theory.user = u;
      let theoryt = await Theory.create(theory)
      theory2.user = u;
      let theoryt2 = await Theory.create(theory2)
      query.user = u;
      query.theory= theoryt;
      let queryq = await Query.create(query)
      query2.user = u;
      query2.theory= theoryt;
      let queryq2 = await Query.create(query2)
      u.theories.push(theoryt);
      u.theories.push(theoryt2);
      u.queries.push(queryq);
      u.queries.push(queryq2);
      await u.save()
    });
    afterEach(async function() {
      await Query.deleteOne({'name': query.name})
      await Query.deleteOne({'name': query2.name})
      await Theory.deleteOne({'name': theory.name})
      await Theory.deleteOne({'name': theory2.name})
    });

		it("should return code 200 and all dashboard information", async function(){
      const res = await request(app)
        .get("/api/users")
        .set('Authorization', `Bearer ${token}`)
      expect(res.statusCode).equals(200)
      expect(res.body).to.have.property('data').to.eql({'_id': user._id, 'name': user.name, 'email': user.email, 'theories': [t1, t2], 'queries': [q1,q2] })
		});
	});
});


