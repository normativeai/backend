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
const user3 = require('./fixtures/user.json').User3;
const theory = require('./fixtures/theory.json').Theory;
const theory2 = require('./fixtures/theory.json').Theory2;
const theory3 = require('./fixtures/theory.json').Theory3;
const theory4 = require('./fixtures/theory.json').Theory4;
const theory5 = require('./fixtures/theory.json').Theory5;
const theory6 = require('./fixtures/theory.json').Theory6;
const theory7 = require('./fixtures/theory.json').Theory7;
const theory8 = require('./fixtures/theory.json').Theory8;

describe("Create theory", function(){

  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
    utils.login(server, token, user, () => {
      done();});
	})});

	after(done => {
		Theory.deleteOne({'name': theory.name}, function (err) {
		Theory.deleteOne({'name': theory6.name}, function (err) {
		Theory.deleteOne({'name': theory7.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})});
	})});
  it("should return the created theory and check it was added to the user", function(done){
    server
      .post("/api/theories")
      .set('Authorization', `Bearer ${token.token}`)
      .send(theory)
      .expect(201)
      .then(response => {
        User.findById(user._id, function(err, user) {
          assert.equal(user.theories[0]._id, theory._id);
        });
        done();
      })
  });
	it("should check that the auto formaliztion and vocabulary were created correctly", function(done){
      let json_string = fs.readFileSync("./test/fixtures/rome1.json", "utf8");
      let voc0 = {"symbol": "contract", "original": "A contract", "full": "contract(Law,Part)" }
      let voc1 = {"symbol": "validChoice", "original": "the law chosen by the parties", "full": "validChoice(Law,Part)" }
			server
				.post("/api/theories")
        .set('Authorization', `Bearer ${token.token}`)
				.send(theory6)
        .expect(201)
        .then(response => {
          Theory.findById(theory6._id, function(err, theory) {
            assert.equal(JSON.stringify(theory.autoFormalization[0].json), JSON.stringify(JSON.parse(json_string)));
            assert.equal(theory.autoFormalization[0].formula, "(validChoice(Law,Part) O> contract(Law,Part))");
            const vocdb0 = theory.autoVocabulary[0]
            const vocobj0 = {'symbol': vocdb0.symbol, 'original': vocdb0.original, 'full': vocdb0.full}
            assert.equal(JSON.stringify(vocobj0), JSON.stringify(voc0));
            const vocdb1 = theory.autoVocabulary[1]
            const vocobj1 = {'symbol': vocdb1.symbol, 'original': vocdb1.original, 'full': vocdb1.full}
            assert.equal(JSON.stringify(vocobj1), JSON.stringify(voc1));
            done();
          });
        })
  });
  it("should report correct errors if the auto formaliztion were not created correctly", function(done){
			server
				.post("/api/theories")
        .set('Authorization', `Bearer ${token.token}`)
				.send(theory7)
        .expect(400, {"error": 'Frontend error: Connective band is not known.'}, done)
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
    utils.login(server, token, user, () => {
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
          assert.equal(theory.name, t.name);
          assert.equal(theory.description, t.description);
          assert.equal(JSON.stringify(theory.formalization), JSON.stringify(t.formalization));
          assert.equal(theory.content, t.content);
          assert.equal(JSON.stringify(theory.vocabulary),JSON.stringify(t.vocabulary));
          done();
        }).catch(err => {
          //console.log(err);
        })
		});
});

describe("Update theory", function(){

  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
		utils.login(server, token, user, () => {
		theory.user = user;
		Theory.create(theory, function (err) {;
		theory8.user = user;
		Theory.create(theory8, function (err) {done();})})})});
	});

	after(done => {
		Theory.deleteOne({"name": "temp"}, function (err) {
		Theory.deleteOne({"name": "Test8"}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})});
	});

	it("should return 200 on successfull update", function(done){
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
        .expect(404, { error:  'Theory could not be found'
        },	done);
  });
  it("should check that the auto formaliztion were updated correctly 1", function(done){
      const t = Object.assign({}, theory);
      t.content = theory6.content
      let json_string = fs.readFileSync("./test/fixtures/rome1.json", "utf8");
      let voc0 = {"symbol": "contract", "original": "A contract", "full": "contract(Law,Part)" }
      let voc1 = {"symbol": "validChoice", "original": "the law chosen by the parties", "full": "validChoice(Law,Part)" }
      // update theory
      server
        .put(`/api/theories/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .send(t).end(function() {
          server
            .get(`/api/theories/${t._id}`)
            .set('Authorization', `Bearer ${token.token}`)
            .expect(200)
            .then(response => {
              const t = response.body.data;
              assert.equal(JSON.stringify(t.autoFormalization[0].json), JSON.stringify(JSON.parse(json_string)));
              assert.equal(t.autoFormalization[0].formula, "(validChoice(Law,Part) O> contract(Law,Part))");
              const vocdb0 = t.autoVocabulary[0]
              const vocobj0 = {'symbol': vocdb0.symbol, 'original': vocdb0.original, 'full': vocdb0.full}
              assert.equal(JSON.stringify(vocobj0), JSON.stringify(voc0));
              const vocdb1 = t.autoVocabulary[1]
              const vocobj1 = {'symbol': vocdb1.symbol, 'original': vocdb1.original, 'full': vocdb1.full}
              assert.equal(JSON.stringify(vocobj1), JSON.stringify(voc1));
              done();
  })})})
  it("should check that the auto formaliztion were updated correctly 2", function(done){
      const t = Object.assign({}, theory);
      t.content = "<h2>Article 3 - Freedom of choice</h2> <p><br></p> <ol>   <li>     <span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\">       <span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span>       shall be governed by       <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"valid_choice(Law,Part)\">the law chosen by the parties</span>.     </span>     The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract.   </li>  </ol>"
      // update theory
      server
        .put(`/api/theories/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .send(t)
        .expect(200)
        .then(response => {
          done();
  })})
  it("should report correct errors if the auto formaliztion were not updated correctly", function(done){
      const t = Object.assign({}, theory);
      t.content = theory7.content
      // update theory
      server
        .put(`/api/theories/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .send(t)
        .expect(400, {"error": 'Frontend error: Connective band is not known.'}, done)
  })
  it("should report correct errors if the auto formaliztion were not updated correctly 2", function(done){
      const t = Object.assign({}, theory);
      t.content = "<h2>Article 3 - Freedom of choice</h2> <p><br></p> <ol>   <li>     <span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\">       <span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span>       shall be <span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1012\" data-term=\"error\">governed</span> by       <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"valid_choice(Law,Part)\">the law chosen by the parties</span>.     </span>     The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract.   </li>  </ol>"
      // update theory
      server
        .put(`/api/theories/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .send(t)
        .expect(400, {"error": 'The sentence        A contract       shall be governed by       the law chosen by the parties.      contains the connective It Ought to be ___ If ___ which expectes 2 operands, but 3 were given.'}, done)
  })
  it("should return 400 and correct message on an update of a write protected theory", function(done){
      const t = Object.assign({}, theory8);
      t.name = "temp";
			server
				.put(`/api/theories/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.send(t)
        .expect(400, { "error": 'Theory cannot be updated since it is write protected'
        },	done);
  });
  it("should return 400 and correct message on an update of a theory of a write protected user", function(done){
      const t = Object.assign({}, theory8);
      t.name = "temp";
			server
				.put(`/api/theories/${t._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.send(t)
        .expect(400, { "error": 'Theory cannot be updated since it is write protected'
        },	done);
  });
});

describe("Delete theory", function(){

  const t = Object.assign({}, theory);
  t.name = "temp";
  var token = {token: undefined};

	before(done => {
		User.create(user, function (err) {
		utils.login(server, token, user, () => {
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
        .expect(404, { error:  'Theory could not be found'
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
    utils.login(server, token, user, () => {
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

	beforeEach(function(done) {
		User.create(user, function (err) {
    utils.login(server, token, user, () => {
		User.create(user2, function (err) {
		theory.user = user;
		Theory.create(theory, function (err) {
		theory3.user = user2;
		Theory.create(theory3, function (err) {
      done();
    })})})})});
	});

	afterEach(done => {
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
            assert.equal(user.theories[0]._id, response.body.data.theory._id);
          });
          done();
        })

		});
    it("should change the theory name into <name> (Clone)", function(done){
			server
				.post(`/api/theories/${theory3._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(201)
        .then(response => {
          Theory.findById(response.body.data.theory._id, function(err, theory) {
            assert.equal(theory.name, (theory3.name + " (Clone)"));
          });
          done();
        })

		});
});

describe("Checking a theory for consistency", function(){

  var token = {token: undefined};

	before(function(done) {
		User.create(user, function (err) {
    utils.login(server, token, user, () => {
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
				.expect(200, {message: 'The legislation is consistent', type: 'success'}, done);
  });
  it("should return false in case it is inconsistent @slow", function(done){
			server
				.get(`/api/theories/${theory2._id}/consistency`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {message: 'The legislation is not consistent', type: 'info'}, done);
		});
  it("should return true in case it is inconsistent but the formula is inactive  @slow", function(done){
			server
				.get(`/api/theories/${theory5._id}/consistency`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {message: 'The legislation is consistent', type: 'success'}, done);
		});

  it("should return 404 in case it cannot find the theory", function(done){
			server
				.get('/api/theories/111/consistency')
        .set('Authorization', `Bearer ${token.token}`)
				.expect(404, { error:  'Cannot find theory'  }, done);
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
    utils.login(server, token, user, () => {
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
				.expect(200, {message: 'The norm is logically independent from the rest of the legislation',
          type: 'success'}, done);
  });
  it("should return false in case it is dependent @slow", function(done){
			server
				.get(`/api/theories/${theory4._id}/independent/${theory4.formalization[1]._id}`)
        .set('Authorization', `Bearer ${token.token}`)
				.expect(200, {message: 'The norm is not logically independent from the rest of the legislation',
          type: 'info'}, done);
  });
  it("should return true in case it is independent and is being called twice @slow", function(done){
			server
				.get(`/api/theories/${theory4._id}/independent/${theory4.formalization[2]._id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(200, {message: 'The norm is logically independent from the rest of the legislation',
          type: 'success'}, done)
        .end(function() {
          server
            .get(`/api/theories/${theory4._id}/independent/${theory4.formalization[2]._id}`)
            .set('Authorization', `Bearer ${token.token}`)
            .expect(200, {message: 'The norm is logically independent from the rest of the legislation',
              type: 'success'}, done);
        })
  });
});

describe("Checking theory static computeViolations", function(){

	it("should compute correctly all violations", function(done){
    let voc = {"symbol": "contract", "original": "A contract", "full": "contract(Law,Part)" }
    let json =  {
      "text": "A contract shall be governed by the law chosen by the parties.",
      "connective": {
        "name": "It Ought to be ___ If ___",
        "code": "obonif",
        "formulas": [
          {
            "text": "A contract",
            "term": {
              "name": "contract(Law,Part)"
            }
          },
          {
            "text": "the law chosen by the parties",
            "term": {
              "name": "validChoice(Law,Part)"
            }
          }
        ]
      }
    }
    let violations =  [{"original":"Violation of A contract shall be governed by the law chosen by the parties.","json":{"text":"Violation of A contract shall be governed by the law chosen by the parties.","connective":{"name":"Definitional Only If","code":"defonif","formulas":[{"text":"Violating the text","term":{"name":"violation"}},{"text":"A contract shall be governed by the law chosen by the parties.","connective":{"name":"And","code":"and","formulas":[{"text":"the law chosen by the parties","term":{"name":"validChoice(Law,Part)"}},{"text":"Negation of A contract","connective":{"name":"Negation","code":"neg","formulas":[{"text":"A contract","term":{"name":"contract(Law,Part)"}}]}}]}}]}},"formula":"((validChoice(Law,Part) , (~ contract(Law,Part))) => violation)"}]
    assert.equal(JSON.stringify(Theory.computeViolations([json])),JSON.stringify(violations))
    done()
  });
});

describe("Checking theory static computeAutomaticVocabulary", function(){

	it("should parse correctly terms with parentheses", function(done){
    let voc = {"symbol": "contract", "original": "A contract", "full": "contract(Law,Part)" }
    let json = {
        "text": "A contract",
        "term": {
          "name": "contract(Law,Part)"
        }
      }
    assert.equal(JSON.stringify(Theory.computeAutomaticVocabulary([json])),JSON.stringify([voc]))
    done()
  });
  it("should parse correctly atomic terms", function(done){
    let voc = {"symbol": "contract", "original": "A contract", "full": "contract" }
    let json = {
        "text": "A contract",
        "term": {
          "name": "contract"
        }
      }
    assert.equal(JSON.stringify(Theory.computeAutomaticVocabulary([json])),JSON.stringify([voc]))
    done()
  });
});

describe("Changing theories of write protected user", function(){

  var token = {token: undefined};

	before(done => {
		User.create(user3, function (err) {
		utils.login(server, token, user3, () => {
		theory.user = user3;
		Theory.create(theory, function (err) {;
      done();})});
	})});

	after(done => {
		Theory.deleteOne({"name": "temp"}, function (err) {
		User.deleteOne({'email': user3.email}, function (err) {done();})});
	});

  it("should check that a theory cannot be created", function(done){
    server
      .post("/api/theories")
      .set('Authorization', `Bearer ${token.token}`)
      .send(theory)
      .expect(400, {error: "Theory cannot be created since the user is write protected"}, done);
  });
  it("should check that a theory cannot be updated", function(done){
    server
      .put(`/api/theories/${theory._id}`)
      .set('Authorization', `Bearer ${token.token}`)
      .send(theory)
      .expect(400, {error: "Theory cannot be updated since the user is write protected"}, done);
  });
  it("should check that a theory cannot be deleted", function(done){
    server
      .delete(`/api/theories/${theory._id}`)
      .set('Authorization', `Bearer ${token.token}`)
      .expect(400, {error: "Theory cannot be deleted since the user is write protected"}, done);
  });
  it("should check that a theory cannot be cloned", function(done){
    server
      .post(`/api/theories/${theory._id}`)
      .set('Authorization', `Bearer ${token.token}`)
      .expect(400, {error: "Theory cannot be cloned since the user is write protected"}, done);
  });
})
