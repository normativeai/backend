var supertest = require("supertest");
const fs = require('fs');
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
const theory4 = require('./fixtures/theory.json').Theory4;
const theory5 = require('./fixtures/theory.json').Theory5;
const theory6 = require('./fixtures/theory.json').Theory6;

describe("Create theory", function(){

  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
    utils.login(server, token, () => {
      done();});
	})});

	after(done => {
		Theory.deleteOne({'name': theory.name}, function (err) {
		Theory.deleteOne({'name': theory6.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})});
	})});
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
	it("should check that the auto formaliztion were created correctly", function(done){
      let json_string = fs.readFileSync("./test/fixtures/rome1.json", "utf8");
			server
				.post("/api/theories")
        .set('Authorization', `Bearer ${token.token}`)
				.send(theory6)
        .expect(201)
        .then(response => {
          Theory.findById(theory6._id, function(err, theory) {
            console.log(theory.autoFormalization[0].formula)
            assert(JSON.stringify(theory.autoFormalization[0].json) == JSON.stringify(JSON.parse(json_string)));
            assert(theory.autoFormalization[0].formula == "(validChoice(Law,Part) O> contract(Law,Part))");
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
    lastUpdate: theory.lastUpdate
  };
  const t2 = {
    _id: theory2._id,
    name: theory2.name,
    description: theory2.description,
    lastUpdate: theory2.lastUpdate
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
				.expect(200, {data: [t1, t2]}, done);
		});

  it("should return a chosen theory of connected user with all information", function(done){
			server
				.get(`/api/theories/${theory._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(200)
        .then(response => {
          const t = response.body.data;
          assert(theory.name == t.name);
          assert(theory.description == t.description);
          assert(JSON.stringify(theory.formalization) == JSON.stringify(t.formalization));
          assert(theory.content == t.content);
          assert(JSON.stringify(theory.vocabulary) == JSON.stringify(t.vocabulary));
          done();
        }).catch(err => {
          console.log(err);
        })
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
        .expect(200, { message: 'Theory updated'
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
        .expect(404, { err:  'Theory could not be found'
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
        .expect(200, { message: 'Theory deleted'
        },	done);
  });
  it("should return 404 on inability to find theory to delete", function(done){
			server
				.delete('/api/theories/111')
        .set('Authorization', `Bearer ${token.token}`)
        .expect(404, { err:  'Theory could not be found'
        },	done);
  });

});

describe("Find theories", function(){

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
				.expect(200, {data: [t2]}, done);
		});

	it("should find a theory by a keyword in name", function(done){
			server
				.get("/api/theories/find?query=name")
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {data: [t2]}, done);
		});

  it("should find all theories when given .*", function(done){
			server
				.get("/api/theories/find?query=.*")
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {data: [t1,t2]}, done);
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
            assert(user.theories[0]._id == response.body.data.theory._id);
          });
          done();
        })

		});
});

describe("Checking a theory for consistency", function(){

  var token = {token: undefined};

	before(function(done) {
		User.create(user, function (err) {
    utils.login(server, token, () => {
		theory.user = user;
		Theory.create(theory, function (err) {
		theory2.user = user;
		Theory.create(theory2, function (err) {
		theory3.user = user;
		Theory.create(theory3, function (err) {
		theory5.user = user;
		Theory.create(theory5, function (err) {
      done();
    })})})})})});
	});

	after(done => {
		Theory.deleteOne({'name': theory.name}, function (err) {
		Theory.deleteOne({'name': theory2.name}, function (err) {
		Theory.deleteOne({'name': theory3.name}, function (err) {
		Theory.deleteOne({'name': theory5.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})})})});
	});

	it("should return true in case it is consistent @slow", function(done){
			server
				.get(`/api/theories/${theory._id}/consistency`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {data: {"consistent": true}}, done);
  });
  it("should return false in case it is inconsistent @slow", function(done){
			server
				.get(`/api/theories/${theory2._id}/consistency`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {data: {"consistent": false}}, done);
		});
  it("should return true in case it is inconsistent but the formula is inactive  @slow", function(done){
			server
				.get(`/api/theories/${theory5._id}/consistency`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {data: {"consistent": true}}, done);
		});

  it("should return 404 in case it cannot find the theory", function(done){
			server
				.get('/api/theories/111/consistency')
        .set('Authorization', `Bearer ${token.token}`)
				.expect(404, { err:  'Cannot find theory'  }, done);
		});
  it("should return 400 in case it cannot parse the prover output from some reason @slow", function(done){
      this.timeout(5000);
			server
				.get(`/api/theories/${theory3._id}/consistency`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(400)
        .then(response => {done()});
		});
});

describe("Checking a formula in the formalization for independency", function(){

  var token = {token: undefined};

	before(function(done) {
		User.create(user, function (err) {
    utils.login(server, token, () => {
		theory4.user = user;
		Theory.create(theory4, function (err) {
      done();
    })})});
	});

	after(done => {
		Theory.deleteOne({'name': theory4.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})});
	});

	it("should return true in case it is independent @slow", function(done){
			server
				.get(`/api/theories/${theory4._id}/independent/${theory4.formalization[2]._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {data: {"independent": true}}, done);
  });
  it("should return false in case it is dependent @slow", function(done){
			server
				.get(`/api/theories/${theory4._id}/independent/${theory4.formalization[1]._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {data: {"independent": false}}, done);
  });
});
