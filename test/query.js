var supertest = require("supertest");
var assert = require('assert')
const sinon = require('sinon');
const userController = require('../controllers/userController');
var server = supertest.agent("http://localhost:3000");
const utils = require('./utils.js');
const User = require('../models/user');
const Theory = require('../models/theory');
const user = require('./fixtures/user.json').User;
const theory = require('./fixtures/theory.json').Theory;
const Query = require('../models/query');
const query = require('./fixtures/query.json').Query;

describe("Create query", function(){

  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
    utils.login(server, token, () => {
    theory.user = user;
    Theory.create(theory, function(err) {
      query.theory = theory._id;
      done();})});
	})});

	after(done => {
		Query.deleteOne({'name': query.name}, function (err) {
		Theory.deleteOne({'name': theory.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})});
	});

	it("should return the created query and check it was added to the user", function(done){
			server
				.post("/api/queries")
        .set('Authorization', `Bearer ${token.token}`)
				.send(query)
        .expect(201)
        .then(response => {
          User.findById(user._id, function(err, user) {
            assert(user.queries[0]._id == query._id);
          });
          done();
        })
		});
});
