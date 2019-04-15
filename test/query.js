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
const theory4 = require('./fixtures/theory.json').Theory4;
const Query = require('../models/query');
const query = require('./fixtures/query.json').Query;
const query2 = require('./fixtures/query.json').Query2;
const query3 = require('./fixtures/query.json').Query3;
const query4 = require('./fixtures/query.json').Query4;
const query5 = require('./fixtures/query.json').Query5;
const query6 = require('./fixtures/query.json').Query6;

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

describe("Get queries", function(){

  var token = {token: undefined};

  const q1 = Object.assign({}, query);
  const q2 = Object.assign({}, query2);

	before(function(done) {
		User.create(user, function (err) {
    utils.login(server, token, () => {
    theory.user = user;
    Theory.create(theory, function(err) {
		query.user = user;
		query.theory = theory;
		Query.create(query, function (err) {
		query2.user = user;
		Query.create(query2, function (err) {
      done();
    })})})})});
	});

	after(done => {
		Query.deleteOne({'name': query.name}, function (err) {
		Query.deleteOne({'name': query2.name}, function (err) {
		Theory.deleteOne({'name': theory.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})})});
	});

	it("should return an array of all queries of connected user", function(done){
			server
				.get("/api/queries")
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {"data": [q1, q2]}, done);
		});

  it("should return a chosen query of connected user with all information", function(done){
			server
				.get(`/api/queries/${query._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(200)
        .then(response => {
          const t = response.body.data;
          assert(query.name == t.name);
          assert(query.description == t.description);
          assert(JSON.stringify(query.assumptions) == JSON.stringify(t.assumptions));
          assert(query.goal == t.goal);
          assert(query.theory._id == t.theory._id);
          done();
        }).catch(err => {
          console.log(err);
        })
		});
});

describe("Update query", function(){

  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
		utils.login(server, token, () => {
		query.user = user;
		Query.create(query, function (err) {done();})})});
	});

	after(done => {
		Query.deleteOne({"name": "temp"}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})});
	});

	it("should return 200 on success", function(done){
      const t = Object.assign({}, query);
      t.name = "temp";
			server
				.put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.send(t)
        .expect(200, { "message": 'Query updated'
        },	done);
  });

  it("should return 404 on inability to find query to update", function(done){
			server
				.put('/api/queries/111')
        .set('Authorization', `Bearer ${token.token}`)
				.send(query)
        .expect(404, { err: 'Query could not be found'
        },	done);
  });

});

describe("Delete query", function(){

  const t = Object.assign({}, query);
  t.name = "temp";
  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
		utils.login(server, token, () => {
		query.user = user;
    t.user = user;
		Query.create(query, function (err) {done();})})});
	});

	after(done => {
		User.deleteOne({'email': user.email}, function (err) {done();});
	});

	it("should return 200 on success", function(done){
			server
				.delete(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(200, { message: 'Query deleted'
        },	done);
  });
  it("should return 404 on inability to find the query to delete", function(done){
			server
				.delete('/api/queries/111')
        .set('Authorization', `Bearer ${token.token}`)
        .expect(404, { err: 'Query could not be found'
        },	done);
  });

});

describe("Execute query", function(){

  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
    utils.login(server, token, () => {
    theory.user = user;
    Theory.create(theory, function(err, theory) {
    query.theory = theory._id;
    Query.create(query, function(err, query) {
    query2.theory = theory._id;
    Query.create(query2, function(err, query2) {
    query3.theory = theory._id;
    Query.create(query3, function(err, query3) {
    Theory.create(theory4, function(err, theory4) {
    query4.theory = theory4._id;
    Query.create(query4, function(err, query4) {
    done();})})})})})})});
	})});

	after(done => {
		Query.deleteOne({'name': query.name}, function (err) {
		Query.deleteOne({'name': query2.name}, function (err) {
		Query.deleteOne({'name': query3.name}, function (err) {
		Query.deleteOne({'name': query4.name}, function (err) {
		Theory.deleteOne({'name': theory.name}, function (err) {
		Theory.deleteOne({'name': theory4.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})})})})})});
	});

  it("should return true and the proof when it is a theorem @slow", function(done){
			server
				.get(`/api/queries/${query._id}/exec`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(200)
        .expect(function(res) {
          if (res.body.data.result != "Theorem") throw new Error(`Expected Theorem by got ${res.body.data.result}`)
        })
        .end(done)
  });

	it("should return false and no proof when it is a Non-theorem @slow", function(done){
			server
				.get(`/api/queries/${query2._id}/exec`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(200, { data: {"result": "Non-Theorem"}
        },	done);
  });
  it("should return code 400 if query is illegal @slow", function(done){
      this.timeout(5000);
			server
				.get(`/api/queries/${query3._id}/exec`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(400)
        .then(response => {done()});
  });
  it("should return code true and proof for a theorem with empty assumptions @slow", function(done){
			server
				.get(`/api/queries/${query4._id}/exec`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(200, {data: {"result": "Theorem", "proof": "[[a : []], [[-(a) : -([])]]]"}
        },	done);
  });

});

describe("Execute query with missing information", function(){

  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
    utils.login(server, token, () => {
    Query.create(query, function(err, query) {
    done();})})});
	});

	after(done => {
		Query.deleteOne({'name': query.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})});
	});

  it("should return code 400 if theory was not set", function(done){
			server
				.get(`/api/queries/${query._id}/exec`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(400, {err: 'Query is not associated with a specific theory. Please set the theory before trying to execute queries'}, done);
  });
});

describe("Checking a query assumptions for consistency with relation to a theory", function(){

  var token = {token: undefined};

	before(function(done) {
		User.create(user, function (err) {
    utils.login(server, token, () => {
		theory4.user = user;
		Theory.create(theory4, function (err) {
		query4.user = user;
		query4.theory = theory4._id;
		Query.create(query4, function (err) {
		query5.user = user;
		query5.theory = theory4._id;
		Query.create(query5, function (err) {
		query6.user = user;
		query6.theory = theory4._id;
		Query.create(query6, function (err) {
      done();
    })})})})})});
	});

	after(done => {
		Query.deleteOne({'name': query4.name}, function (err) {
		Query.deleteOne({'name': query5.name}, function (err) {
		Query.deleteOne({'name': query6.name}, function (err) {
		Theory.deleteOne({'name': theory4.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})})})});
	});

	it("should return true in case it is consistent @slow", function(done){
			server
				.get(`/api/queries/${query4._id}/consistency`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {data: {"consistent": true}}, done);
  });
  it("should return false in case it is inconsistent @slow", function(done){
			server
				.get(`/api/queries/${query5._id}/consistency`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {data: {"consistent": false}}, done);
		});
  it("should return false in case it is inconsistent among the assumptions only @slow", function(done){
			server
				.get(`/api/queries/${query6._id}/consistency`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {data: {"consistent": false}}, done);
		});

  it("should return 404 in case it cannot find the query", function(done){
			server
				.get('/api/queries/111/consistency')
        .set('Authorization', `Bearer ${token.token}`)
				.expect(404, { err:  'Cannot find query'  }, done);
		});
});

