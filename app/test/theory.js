var supertest = require("supertest");
const sinon = require('sinon');
const userController = require('../controllers/userController');
var server = supertest.agent("http://localhost:3000");
const utils = require('./utils.js');
const User = require('../models/user');
const Theory = require('../models/theory');
const user = require('./fixtures/user.json').User;
const theory = require('./fixtures/theory.json').Theory;
const theory2 = require('./fixtures/theory.json').Theory2;

describe("Create theory", function(){

  const t = Object.assign({}, theory);
  t.name = "temp";

  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {});
		utils.login(server, token, done);
	});

	after(done => {
		Theory.deleteOne({"name": "temp"}, function (err) {done();});
	});

	it("should return the created theory", function(done){
			server
				.post("/api/theories")
				.send(t)
				.expect(200)
				.end(function(err, response){
					done();
				});
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
		Theory.deleteOne({"name": "temp"}, function (err) {done();});
	});

	it("should return 200 on success", function(done){
			server
				.put(`/api/theories/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.send(t)
        .expect(200, {
        },	done);
  });
});
