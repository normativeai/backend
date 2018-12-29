var supertest = require("supertest");
var assert = require('assert')
const sinon = require('sinon');
const userController = require('../controllers/userController');
var server = supertest.agent("http://localhost:3000");
const utils = require('./utils.js');
const User = require('../models/user');
const Theory = require('../models/theory');
const user = require('./fixtures/user.json').User;
const user2 = require('./fixtures/user.json').User2;
const theory = require('./fixtures/theory.json').Theory;
const theory2 = require('./fixtures/theory.json').Theory2;
const theory3 = require('./fixtures/theory.json').Theory3;

describe("Create theory", function(){

  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
    utils.login(server, token, () => {
      done();});
	})});

	after(done => {
		Theory.deleteOne({'name': theory.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})});
	});

	it("should return the created theory and check it was added to the user", function(done){
			server
				.post("/api/theories")
        .set('Authorization', `Bearer ${token.token}`)
				.send(theory)
        .expect(201)
        .then(response => {
          User.findById(user._id, function(err, user) {
            assert(user.theories[0]._id == theory._id);
          });
          done();
        })
		});
});

describe("Get theories", function(){

  const t1 = {
    _id: theory._id,
    name: theory.name,
    description: theory.description,
  };
  const t2 = {
    _id: theory2._id,
    name: theory2.name,
    description: theory2.description,
  };
  var token = {token: undefined};

	before(function(done) {
		User.create(user, function (err) {
    utils.login(server, token, () => {
		theory.user = user;
		Theory.create(theory, function (err) {
		theory2.user = user;
		Theory.create(theory2, function (err) {
      done();
    })})})});
	});

	after(done => {
		Theory.deleteOne({'name': theory.name}, function (err) {
		Theory.deleteOne({'name': theory2.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})});
	});

	it("should return an array of all theories of connected user", function(done){
			server
				.get("/api/theories")
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, [t1, t2], done);
		});

  it("should return a chosen theory of connected user", function(done){
			server
				.get(`/api/theories/${theory._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, t1, done);
		});
});

describe("Update theory", function(){

  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
		utils.login(server, token, () => {
		theory.user = user;
    theory.user = user;
		Theory.create(theory, function (err) {done();})})});
	});

	after(done => {
		Theory.deleteOne({"name": "temp"}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})});
	});

	it("should return 200 on success", function(done){
      const t = Object.assign({}, theory);
      t.name = "temp";
			server
				.put(`/api/theories/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.send(t)
        .expect(200, {
        },	done);
  });

  /*Mongo doesnt give this information it("should return 204 on no update was needed", function(done){
			server
				.put(`/api/theories/${theory._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.send(theory)
        .expect(204, {
        },	done);
  });*/
  it("should return 404 on inability to find theory to update", function(done){
			server
				.put('/api/theories/111')
        .set('Authorization', `Bearer ${token.token}`)
				.send(theory)
        .expect(404, {
        },	done);
  });

});

describe("Delete theory", function(){

  const t = Object.assign({}, theory);
  t.name = "temp";
  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
		utils.login(server, token, () => {
		theory.user = user;
    t.user = user;
		Theory.create(theory, function (err) {done();})})});
	});

	after(done => {
		User.deleteOne({'email': user.email}, function (err) {done();});
	});

	it("should return 200 on success", function(done){
			server
				.delete(`/api/theories/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(200, {
        },	done);
  });
  it("should return 404 on inability to find theory to delete", function(done){
			server
				.delete('/api/theories/111')
        .set('Authorization', `Bearer ${token.token}`)
        .expect(404, {
        },	done);
  });

});

describe("Find theories", function(){

  const t2 = {
    _id: theory2._id,
    name: theory2.name,
    description: theory2.description,
  };
  var token = {token: undefined};

	before(function(done) {
		User.create(user, function (err) {
    utils.login(server, token, () => {
		theory.user = user;
		Theory.create(theory, function (err) {
		theory2.user = user;
		Theory.create(theory2, function (err) {
      done();
    })})})});
	});

	after(done => {
		Theory.deleteOne({'name': theory.name}, function (err) {
		Theory.deleteOne({'name': theory2.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})});
	});

	it("should find a theory by a keyword in description", function(done){
			server
				.get("/api/theories/find?query=blah")
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, [t2], done);
		});

	it("should find a theory by a keyword in name", function(done){
			server
				.get("/api/theories/find?query=name")
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, [t2], done);
		});
});

describe("Clone a theory", function(){

  var token = {token: undefined};

	before(function(done) {
		User.create(user, function (err) {
    utils.login(server, token, () => {
		User.create(user2, function (err) {
		theory.user = user;
		Theory.create(theory, function (err) {
		theory3.user = user2;
		Theory.create(theory3, function (err) {
      done();
    })})})})});
	});

	after(done => {
		Theory.deleteOne({'name': theory.name}, function (err) {
		Theory.deleteOne({'name': theory2.name}, function (err) {
		Theory.deleteOne({'name': theory3.name}, function (err) {
		Theory.deleteOne({'name': theory3.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})})})});
	});

	it("should duplicate a theory of another user and check it is connected to the current user", function(done){
			server
				.post(`/api/theories/${theory3._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(201)
        .then(response => {
          User.findById(user._id, function(err, user) {
            assert(user.theories[0]._id == response.body.theory._id);
          });
          done();
        })

		});
});


