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
const user3 = require('./fixtures/user.json').User3;
const theory = require('./fixtures/theory.json').Theory;
const theory4 = require('./fixtures/theory.json').Theory4;
const Query = require('../models/query');
const query = require('./fixtures/query.json').Query;
const query2 = require('./fixtures/query.json').Query2;
const query3 = require('./fixtures/query.json').Query3;
const query4 = require('./fixtures/query.json').Query4;
const query5 = require('./fixtures/query.json').Query5;
const query6 = require('./fixtures/query.json').Query6;
const query7 = require('./fixtures/query.json').Query7;
const query8 = require('./fixtures/query.json').Query8;
const query9 = require('./fixtures/query.json').Query9;

describe("Create query", function(){

  var token = {token: undefined};

	beforeEach(done => {
		User.create(user, function (err) {
    utils.login(server, token, user, () => {
    theory.user = user;
    Theory.create(theory, function(err) {
      done();})});
	})});

	afterEach(done => {
		Query.deleteOne({'name': query.name}, function (err) {
		Query.deleteOne({'name': query9.name}, function (err) {
		Theory.deleteOne({'name': theory.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})})});
	});

	it("should return the created query and check it was added to the user", function(done){
    server
      .post("/api/queries")
      .set('Authorization', `Bearer ${token.token}`)
      .send(query)
      .expect(201)
      .then(response => {
        User.findById(user._id, function(err, user) {
          assert.equal(user.queries[0]._id, query._id);
        });
        done();
      })
  });
  it("should check that the auto assumptions were created correctly", function(done){
      const t = Object.assign({}, query);
      let json_string = fs.readFileSync("./test/fixtures/rome_query.json", "utf8");
      t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol><li><span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span> shall be governed by <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"validChoice(Law,Part)\">the law chosen by the parties</span>.</span> The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li> <li><span id=\"some-id\" class=\"annotator-goal\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1016\" data-term=\"contract(Law,Part)\">A contract</span></span></li></ol>"
			server
				.post("/api/queries")
        .set('Authorization', `Bearer ${token.token}`)
				.send(t)
        .expect(201)
        .then(response => {
          Query.findById(query._id, function(err, query) {
            assert.equal(JSON.stringify(query.autoAssumptions[0].json), JSON.stringify(JSON.parse(json_string)[0]));
            assert.equal(query.autoAssumptions[0].formula, "(validChoice(Law,Part) O> contract(Law,Part))");
            assert.equal(JSON.stringify(query.autoGoal.json), JSON.stringify(JSON.parse(json_string)[1]));
            assert.equal(query.autoGoal.formula, "contract(Law,Part)");
            done();
          });
        })
  });
  it("should check that the auto assumptions were created correctly 2", function(done){
      const t = Object.assign({}, query9);
      let json_string = fs.readFileSync("./test/fixtures/rome_query.json", "utf8");
			server
				.post("/api/queries")
        .set('Authorization', `Bearer ${token.token}`)
				.send(t)
        .expect(201)
        .then(response => {
          Query.findById(t._id, function(err, query) {
            assert.equal(JSON.stringify(query.autoAssumptions[0].json), JSON.stringify(JSON.parse(json_string)[0]));
            assert.equal(query.autoAssumptions[0].formula, "(validChoice(Law,Part) O> contract(Law,Part))");
            assert.equal(JSON.stringify(query.autoGoal.json), JSON.stringify(JSON.parse(json_string)[1]));
            assert.equal(query.autoGoal.formula, "contract(Law,Part)");
            done();
          });
        })
  });
  it("should create query even if no goal exists", function(done){
      const t = Object.assign({}, query);
      t.content = "<h2>Article 3 - Freedom of choice</h2> <p><br></p> <ol>   <li>     <span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\">       <span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span>       shall be governed by       <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"valid_choice(Law,Part)\">the law chosen by the parties</span>.     </span>     The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract.   </li></ol>"
			server
				.post("/api/queries")
        .set('Authorization', `Bearer ${token.token}`)
				.send(t)
        .expect(201, done)
  });
  it("should report correct errors if the auto formaliztion were not created correctly", function(done){
      const t = Object.assign({}, query);
      t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol><li><span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span> shall be governed by <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"validChoice(Law,Part)\">the law chosen by the parties</span>.</span> The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li> <li><span id=\"some-id\" class=\"annotator-gol\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1016\" data-term=\"contract(Law,Part)\">A contract</span></span></li></ol>"
			server
				.post("/api/queries")
        .set('Authorization', `Bearer ${token.token}`)
				.send(t)
        .expect(400, {"error": 'Cannot parse XML. Unknown annotator value: gol'}, done)
  });
  it("should check a query is created correctly even when no theory is associated with it", function(done){
    query.theory = undefined
    server
      .post("/api/queries")
      .set('Authorization', `Bearer ${token.token}`)
      .send(query)
      .expect(201)
      .then(response => {
        Query.findById(query._id, function(err, query) {
          assert.equal(query.theory, undefined);
        });
        done();
      })
  });
});

describe("Get queries", function(){

  var token = {token: undefined};

	before(function(done) {
		User.create(user, function (err) {
    utils.login(server, token, user, () => {
    theory.user = user;
    Theory.create(theory, function(err) {
		query.user = user;
		query.theory = theory;
		Query.create(query, function (err) {
		query2.user = user;
		Query.create(query2, function (err) {
		Query.create(query9, function (err) {
      done();
    })})})})})});
	});

	after(done => {
		Query.deleteOne({'name': query.name}, function (err) {
		Query.deleteOne({'name': query2.name}, function (err) {
		Query.deleteOne({'name': query9.name}, function (err) {
		Theory.deleteOne({'name': theory.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})})})});
	});

	it("should return an array of all queries of connected user", function(done){
			server
				.get("/api/queries")
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200)
        .then(response => {
          var arr = JSON.parse(response.text).data
          assert.equal(arr[0].name, query.name)
          assert.equal(arr[1].name, query2.name)
          assert.equal(arr[0].lastUpdate, query.lastUpdate)
          assert.equal(arr[1].lastUpdate, query2.lastUpdate)
          assert.equal(arr[0].description, query.description)
          assert.equal(arr[1].description, query2.description)
          done()
        })
		});

  it("should return a chosen query of connected user with all information if it is manual only", function(done){
			server
				.get(`/api/queries/${query._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(200)
        .then(response => {
          const t = response.body.data;
          assert.equal(query.name, t.name);
          assert.equal(query.description, t.description);
          assert.equal(JSON.stringify(query.assumptions), JSON.stringify(t.assumptions));
          assert.equal(query.goal, t.goal);
          assert.equal(query.theory._id, t.theory._id);
          assert.equal(JSON.stringify(query.theory.vocabulary), JSON.stringify(t.theory.vocabulary));
          done();
        }).catch(err => {
          console.log(err);
        })
		});

    it("should return a chosen query of connected user with all information if it is automatic only", function(done){
			server
				.get(`/api/queries/${query9._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(200)
        .then(response => {
          const t = response.body.data;
          assert.equal(query9.name, t.name);
          assert.equal(query9.description, t.description);
          assert.equal(JSON.stringify(query9.content), JSON.stringify(t.content));
          done();
        }).catch(err => {
          console.log(err);
        })
		});
});

describe("Update query", function(){

  var token = {token: undefined};

	beforeEach(done => {
		User.create(user, function (err) {
		utils.login(server, token, user, () => {
		query.user = user;
		Query.create(query, function (err) {;
		query8.user = user;
		Query.create(query8, function (err) {;
		query7.user = user;
		Query.create(query7, function (err) {done();})})})})});
	});

	afterEach(done => {
		Query.deleteOne({"name": "temp"}, function (err) {
		Query.deleteOne({"name": "Query 7"}, function (err) {
		Query.deleteOne({"name": "Query 8"}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})})});
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
        .expect(404, { error: 'Query could not be found'
        },	done);
  });
  it("should return 400 and correct message on an update of a write protected query", function(done){
      const t = Object.assign({}, query7);
      t.name = "temp";
			server
				.put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.send(t)
        .expect(400, { "error": 'Query cannot be updated since it is write protected'
        },	done);
  });
  it("should check that the auto assumptions were updated correctly", function(done){
      const t = Object.assign({}, query);
      let json_string = fs.readFileSync("./test/fixtures/rome_query.json", "utf8");
      t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol><li><span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span> shall be governed by <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"validChoice(Law,Part)\">the law chosen by the parties</span>.</span> The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li> <li><span id=\"some-id\" class=\"annotator-goal\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1016\" data-term=\"contract(Law,Part)\">A contract</span></span></li></ol>"
      // update theory
      server
        .put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .send(t).end(function() {
          server
            .get(`/api/queries/${t._id}`)
            .set('Authorization', `Bearer ${token.token}`)
            .expect(200)
            .then(response => {
              Query.findById(query._id, function(err, query) {
                assert.equal(JSON.stringify(query.autoAssumptions[0].json), JSON.stringify(JSON.parse(json_string)[0]));
                assert.equal(query.autoAssumptions[0].formula, "(validChoice(Law,Part) O> contract(Law,Part))");
                assert.equal(JSON.stringify(query.autoGoal.json), JSON.stringify(JSON.parse(json_string)[1]));
                assert.equal(query.autoGoal.formula, "contract(Law,Part)");
                done();
              });
            })
  })})
  it("should check that the auto assumptions were updated correctly 2", function(done){
      const t = Object.assign({}, query8);
      let json_string = fs.readFileSync("./test/fixtures/rome_query.json", "utf8");
      t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol><li><span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span> shall be governed by <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"validChoice(Law,Part)\">the law chosen by the parties</span>.</span> The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li> <li><span id=\"some-id\" class=\"annotator-goal\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1016\" data-term=\"contract(Law,Part)\">A contract</span></span></li></ol>"
      // update theory
      server
        .put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .send(t).end(function() {
          server
            .get(`/api/queries/${t._id}`)
            .set('Authorization', `Bearer ${token.token}`)
            .expect(200)
            .then(response => {
              Query.findById(query._id, function(err, query) {
                assert.equal(JSON.stringify(query.autoAssumptions[0].json), JSON.stringify(JSON.parse(json_string)[0]));
                assert.equal(query.autoAssumptions[0].formula, "(validChoice(Law,Part) O> contract(Law,Part))");
                assert.equal(JSON.stringify(query.autoGoal.json), JSON.stringify(JSON.parse(json_string)[1]));
                assert.equal(query.autoGoal.formula, "contract(Law,Part)");
                done();
              });
            })
  })})
  it("should check that the auto assumptions were updated correctly when only a goal is annotated", function(done){
      const t = Object.assign({}, query8);
      let json_string = fs.readFileSync("./test/fixtures/rome_query.json", "utf8");
      t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol>The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li> <li><span id=\"some-id\" class=\"annotator-goal\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1016\" data-term=\"contract(Law,Part)\">A contract</span></span></li></ol>"
      // update theory
      server
        .put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .send(t).end(function() {
          server
            .get(`/api/queries/${t._id}`)
            .set('Authorization', `Bearer ${token.token}`)
            .expect(200)
            .then(response => {
              Query.findById(query8._id, function(err, query) {
                assert.equal(query.autoAssumptions.length, 0);
                assert.equal(JSON.stringify(query.autoGoal.json), JSON.stringify(JSON.parse(json_string)[1]));
                assert.equal(query.autoGoal.formula, "contract(Law,Part)");
                done();
              });
            })
  })})

  it("should report correct errors if the auto formaliztion were not updated correctly", function(done){
      const t = Object.assign({}, query);
      let json_string = fs.readFileSync("./test/fixtures/rome_query.json", "utf8");
      t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol><li><span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span> shall be governed by <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"validChoice(Law,Part)\">the law chosen by the parties</span>.</span> The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li> <li><span id=\"some-id\" class=\"annotator-gol\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1016\" data-term=\"contract(Law,Part)\">A contract</span></span></li></ol>"
      // update theory
      server
        .put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .send(t)
        .expect(400, {"error": 'Cannot parse XML. Unknown annotator value: gol'}, done)
  })
  it("should check a query is updated correctly even when no theory is associated with it", function(done){
      const t = Object.assign({}, query);
      t.theory = undefined
      t.name = "temp";
			server
				.put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.send(t)
        .expect(200, { "message": 'Query updated'
        },	done);
  });
  it("should check that the auto assumptions were updated correctly even if no goal is associated", function(done){
      const t = Object.assign({}, query);
      let json_string = fs.readFileSync("./test/fixtures/rome_query.json", "utf8");
      t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol><li><span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span> shall be governed by <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"validChoice(Law,Part)\">the law chosen by the parties</span>.</span> The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li></ol>"
      // update theory
      server
				.put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.send(t)
        .expect(200, { "message": 'Query updated'
        },	done);
  })
 /*it("should check that the auto vocabulary were updated correctly when they are not part of the theory", function(done){
      const t = Object.assign({}, query);
      t.content = '<p>   <span class="connective-depth-1 annotator-connective" id="2f889ffb-9f47-4df4-b912-1362944e050b" data-connective="or" title="Or">     a     <span class="annotator-term" id="588b8d7c-02eb-40a3-8944-93e2974997e5" data-term="aaa" title="aaa">sdia sidja</span>     dja sdjia js     <span class="annotator-term" id="c912f84c-60c6-41de-86fd-a90c783792a3" data-term="aaa" title="aaa">doija dj</span>     as   </span>   id </p> <p>   aij   <span class="annotator-goal" id="d2cfc40e-5e16-43df-b784-c274de39cfaa" title="Goal">     d oi     <span class="connective-depth-1 annotator-connective" id="723949b3-0997-44eb-a6ed-ece47ff9c13c" data-connective="and" title="And">       <span class="annotator-term" id="8873cab2-8e8f-49a9-a153-d0c145f1a142" data-term="aaa" title="aaa">ad</span>       sj       <span class="annotator-term" id="2b0cb2b0-abe8-47c2-80ff-f6b769639fda" data-term="asdasd" title="asdasd">ai s</span>     </span>     dia   </span>   jds asd   <span class="annotator-term" id="718d8b97-3ba9-47aa-af8f-ec95121e5def" data-term="xaz" title="xaz">as</span>   d </p>'
      let json_string = fs.readFileSync("./test/fixtures/rome_query.json", "utf8");
      t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol><li><span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span> shall be governed by <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"validChoice(Law,Part)\">the law chosen by the parties</span>.</span> The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li></ol>"
      // update theory
      server
				.put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.send(t)
        .expect(200, { "message": 'Query updated'
        },	done);
  })*/

});

describe("Delete query", function(){

  const t = Object.assign({}, query);
  t.name = "temp";
  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
		utils.login(server, token, user, () => {
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
        .expect(404, { error: 'Query could not be found'
        },	done);
  });

});

describe("Execute query", function(){

  var token = {token: undefined};

	beforeEach(done => {
		User.create(user, function (err) {
    utils.login(server, token, user, () => {
    theory.user = user;
    Theory.create(theory, function(err, theory) {
    query.theory = theory._id;
    query.user = user;
    Query.create(query, function(err, query) {
    query2.theory = theory._id;
    query2.user = user;
    Query.create(query2, function(err, query2) {
    query3.theory = theory._id;
    query3.user = user;
    Query.create(query3, function(err, query3) {
    Theory.create(theory4, function(err, theory4) {
    query4.theory = theory4._id;
    query4.user = user;
    Query.create(query4, function(err, query4) {
    query8.theory = theory._id;
    query8.user = user;
    Query.create(query8, function(err, query8) {
    done();})})})})})})})});
	})});

	afterEach(done => {
		Query.deleteOne({'name': query.name}, function (err) {
		Query.deleteOne({'name': query2.name}, function (err) {
		Query.deleteOne({'name': query3.name}, function (err) {
		Query.deleteOne({'name': query4.name}, function (err) {
		Query.deleteOne({'name': query8.name}, function (err) {
		Theory.deleteOne({'name': theory.name}, function (err) {
		Theory.deleteOne({'name': theory4.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})})})})})})});
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
  it("should succeed executing a query generated from annotations and is with a goal @slow", function(done){
    const t = Object.assign({}, query8);
    t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol><li><span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span> shall be governed by <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"validChoice(Law,Part)\">the law chosen by the parties</span>.</span> The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li> <li><span id=\"some-id\" class=\"annotator-goal\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1016\" data-term=\"contract(Law,Part)\">A contract</span></span></li></ol>"
    // update theory
    server
      .put(`/api/queries/${t._id}`)
      .set('Authorization', `Bearer ${token.token}`)
      .send(t)
      .end(function() {
        server
          .get(`/api/queries/${t._id}/exec`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(200)
          .then(response => {
            assert.equal(JSON.parse(response.text).data.result, "Non-Theorem")
            done();
            });
          })
  });

  it("should fail executing a query generated from annotations and is without a goal", function(done){
    const t = Object.assign({}, query8);
    t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol><li><span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span> shall be governed by <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"validChoice(Law,Part)\">the law chosen by the parties</span>.</span> The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li></ol>"
    // update theory
    server
      .put(`/api/queries/${t._id}`)
      .set('Authorization', `Bearer ${token.token}`)
      .send(t)
      .end(function() {
        server
          .get(`/api/queries/${t._id}/exec`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(400, {error: 'Query has no goal. Please assign goals before trying to execute queries'}, done)
      })
  });

});

describe("Execute query with missing information", function(){

  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
    utils.login(server, token, user, () => {
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
        .expect(400, {error: 'Query is not associated with a specific theory. Please set the theory before trying to execute queries'}, done);
  });
});

describe("Checking a query assumptions for consistency with relation to a theory", function(){

  var token = {token: undefined};

	before(function(done) {
		User.create(user, function (err) {
    utils.login(server, token, user, () => {
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

describe("Changing queries of write protected user", function(){

  var token = {token: undefined};

	before(done => {
		User.create(user3, function (err) {
		utils.login(server, token, user3, () => {
		query.user = user3;
		Query.create(query, function (err) {;
      done();})});
	})});

	after(done => {
		Query.deleteOne({"name": query.name}, function (err) {
		User.deleteOne({'email': user3.email}, function (err) {done();})});
	});

  it("should check that a query cannot be created", function(done){
    server
      .post("/api/queries")
      .set('Authorization', `Bearer ${token.token}`)
      .send(query)
      .expect(400, {error: "Query cannot be created since the user is write protected"}, done);
  });
  it("should check that a query cannot be updated", function(done){
    server
      .put(`/api/queries/${query._id}`)
      .set('Authorization', `Bearer ${token.token}`)
      .send(query)
      .expect(400, {error: "Query cannot be updated since the user is write protected"}, done);
  });
  it("should check that a query cannot be deleted", function(done){
    server
      .delete(`/api/queries/${query._id}`)
      .set('Authorization', `Bearer ${token.token}`)
      .expect(400, {error: "Query cannot be deleted since the user is write protected"}, done);
  });
})
