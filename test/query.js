const request = require("supertest");
const supertest = require("supertest");
const expect = require('chai').expect
const app = require('../app');
const fs = require('fs');
const assert = require('assert')
const sinon = require('sinon');
const userController = require('../controllers/userController');
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

var server = supertest.agent("http://localhost:3000");

describe("Create query", function(){

  var token

	beforeEach(async function() {
		await User.create(user)
    token = await utils.login(user)
    theory.user = user;
    await Theory.create(theory)
  });

	afterEach(async function() {
		await Query.findByIdAndRemove(query._id)
		await Query.findByIdAndRemove(query9._id)
		await Theory.findByIdAndRemove(theory._id)
		await User.findByIdAndRemove(user._id)
	});

	it("should return the created query and check it was added to the user", async function(){
    var res = await request(app)
      .post("/api/queries")
      .set('Authorization', `Bearer ${token}`)
      .send(query)
    expect(res.statusCode).equals(201)
    var res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
    expect(res.body.data.queries[0]).to.have.property('_id',query._id);
  });
  it("should check that the auto assumptions were created correctly", async function() {
      const t = Object.assign({}, query);
      let json_string = fs.readFileSync("./test/fixtures/rome_query.json", "utf8");
      t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol><li><span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span> shall be governed by <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"validChoice(Law,Part)\">the law chosen by the parties</span>.</span> The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li> <li><span id=\"some-id\" class=\"annotator-goal\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1016\" data-term=\"contract(Law,Part)\">A contract</span></span></li></ol>"
      var res = await request(app)
				.post("/api/queries")
        .set('Authorization', `Bearer ${token}`)
				.send(t)
      expect(res.statusCode).equals(201)
      const q = await Query.findById(t._id)
      expect(q.autoAssumptions[0]).to.have.property('json').to.deep.equal(JSON.parse(json_string)[0])
      expect(q.autoAssumptions[0]).to.have.property('formula').to.equal("(validChoice(Law,Part) O> contract(Law,Part))")
      expect(q.autoGoal).to.have.property('json').to.deep.equal(JSON.parse(json_string)[1])
      expect(q.autoGoal).to.have.property('formula').to.equal("contract(Law,Part)")
  });
  it("should check that the auto assumptions were created correctly 2", async  function() {
      const t = Object.assign({}, query9);
      let json_string = fs.readFileSync("./test/fixtures/rome_query.json", "utf8");
      var res = await request(app)
				.post("/api/queries")
        .set('Authorization', `Bearer ${token}`)
				.send(t)
      expect(res.statusCode).equals(201)
      const q = await Query.findById(t._id)
      expect(q.autoAssumptions[0]).to.have.property('json').to.deep.equal(JSON.parse(json_string)[0])
      expect(q.autoAssumptions[0]).to.have.property('formula').to.equal("(validChoice(Law,Part) O> contract(Law,Part))")
      expect(q.autoGoal).to.have.property('json').to.deep.equal(JSON.parse(json_string)[1])
      expect(q.autoGoal).to.have.property('formula').to.equal("contract(Law,Part)")
  });
  it("should create query even if no goal exists", function(done){
      const t = Object.assign({}, query);
      t.content = "<h2>Article 3 - Freedom of choice</h2> <p><br></p> <ol>   <li>     <span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\">       <span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span>       shall be governed by       <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"valid_choice(Law,Part)\">the law chosen by the parties</span>.     </span>     The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract.   </li></ol>"
			server
				.post("/api/queries")
        .set('Authorization', `Bearer ${token}`)
				.send(t)
        .expect(201, done)
  });
  it("should report correct errors for query if the auto formaliztion were not created correctly", async function() {
      const t = Object.assign({}, query);
      t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol><li><span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span> shall be governed by <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"validChoice(Law,Part)\">the law chosen by the parties</span>.</span> The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li> <li><span id=\"some-id\" class=\"annotator-gol\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1016\" data-term=\"contract(Law,Part)\">A contract</span></span></li></ol>"
      var res = await request(app)
				.post("/api/queries")
        .set('Authorization', `Bearer ${token}`)
				.send(t)
      expect(res.statusCode).equals(400)
      expect(res.body).to.have.property('error','Error: Cannot parse XML. Unknown annotator value: gol')
  });
  it("should check a query is created correctly even when no theory is associated with it", function(done){
    query.theory = undefined
    server
      .post("/api/queries")
      .set('Authorization', `Bearer ${token}`)
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

  var token

	beforeEach(async function() {
		await User.create(user)
    token = await utils.login(user)
    theory.user = user;
    await Theory.create(theory)
		query.user = user;
		query.theory = theory;
		await Query.create(query)
		query2.user = user;
		await Query.create(query2)
		await Query.create(query9)
	});

	afterEach(done => {
		Query.deleteOne({'name': query.name}, function (err) {
		Query.deleteOne({'name': query2.name}, function (err) {
		Query.deleteOne({'name': query9.name}, function (err) {
		Theory.deleteOne({'name': theory.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})})})});
	});

	it("should return an array of all queries of connected user", function(done){
			server
				.get("/api/queries")
        .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`)
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

  var token

	beforeEach(async function() {
		await User.create(user)
		token = await utils.login(user)
		query.user = user;
		await Query.create(query)
		query8.user = user;
		await Query.create(query8)
		query7.user = user;
		await Query.create(query7)
	});

	afterEach(done => {
		Query.deleteOne({"name": "temp"}, function (err) {
		Query.deleteOne({"name": query.name}, function (err) {
		Query.deleteOne({"name": "Query 7"}, function (err) {
		Query.deleteOne({"name": "Query 8"}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})})})});
	});

	it("should return 200 on success", function(done){
      const t = Object.assign({}, query);
      t.name = "temp";
			server
				.put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token}`)
				.send(t)
        .expect(200, { "message": 'Query updated'
        },	done);
  });

  it("should return 404 on inability to find query to update", function(done){
			server
				.put('/api/queries/111')
        .set('Authorization', `Bearer ${token}`)
				.send(query)
        .expect(404, { error: 'Query could not be found'
        },	done);
  });
  it("should return 400 and correct message on an update of a write protected query", function(done){
      const t = Object.assign({}, query7);
      t.name = "temp";
			server
				.put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`)
        .send(t).end(function() {
          server
            .get(`/api/queries/${t._id}`)
            .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`)
        .send(t).end(function() {
          server
            .get(`/api/queries/${t._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(response => {
              Query.findById(t._id, function(err, query) {
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
        .set('Authorization', `Bearer ${token}`)
        .send(t).end(function() {
          server
            .get(`/api/queries/${t._id}`)
            .set('Authorization', `Bearer ${token}`)
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

  it("should report correct errors if the auto formaliztion were not updated correctly", async function(){
      const t = Object.assign({}, query);
      let json_string = fs.readFileSync("./test/fixtures/rome_query.json", "utf8");
      t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol><li><span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span> shall be governed by <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"validChoice(Law,Part)\">the law chosen by the parties</span>.</span> The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li> <li><span id=\"some-id\" class=\"annotator-gol\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1016\" data-term=\"contract(Law,Part)\">A contract</span></span></li></ol>"
      var res = await request(app)
        .put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token}`)
				.send(t)
      expect(res.statusCode).equals(400)
      expect(res.body).to.have.property('error','Error: Cannot parse XML. Unknown annotator value: gol')
  });
  it("should check a query is updated correctly even when no theory is associated with it", function(done){
      const t = Object.assign({}, query);
      t.theory = undefined
      t.name = "temp";
			server
				.put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`)
				.send(t)
        .expect(200, { "message": 'Query updated'
        },	done);
  })
  it("should check that the auto formaliztion were updated correctly even when some contain complex formulae", function(done){
      const t = Object.assign({}, query);
      t.content = '<p><span class=\"annotator-term\" id=\"a8f391d0-469c-4eb8-a83d-f2312a0d48b0\" data-term=\"(~ validChoice(X,Y))\" title=\"(~ validChoice(X,Y))\">The choice was not made</span> and <span class=\"annotator-term\" id=\"b4285291-4b35-49b9-99c2-8719de7703e4\" data-term=\"saleOfGoods\" title=\"saleOfGoods\">it is a contract for the sale of goods</span>.</p><p><br></p><p>Answer: <span class=\"annotator-goal\" id=\"d5ed9a14-f949-40a8-9bc6-8144ef3614f3\" title=\"Goal\"><span class=\"connective-depth-1 annotator-connective\" id=\"f25a4561-5d72-4db9-98fe-ce280aef067d\" data-connective=\"ob\" title=\"Obligation\"><span class=\"annotator-term\" id=\"19148cad-c4c2-4eed-a214-bd1cb9ff16e8\" data-term=\"contract(habitualResidenceSeller,Y)\" title=\"contract(habitualResidenceSeller,Y)\">The applicable law is the law of habitual residence of the seller</span></span></span>.</p>'
      // update theory
      server
				.put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token}`)
				.send(t)
        .end(function() {
          server
            .get(`/api/queries/${t._id}`)
            .set('Authorization', `Bearer ${token}`)
            .then(response => {
              var autoAssumptions = JSON.parse(response.text).data.autoAssumptions
              assert.equal(autoAssumptions.length, 2)
              assert.equal(autoAssumptions[0].formula, '(~ validChoice(X,Y))')
              assert.equal(autoAssumptions[1].formula, 'saleOfGoods')
              done()
            })

        })
  })
  it("should check that the auto vocabulary was updated correctly", function(done){
      const t = Object.assign({}, query);
      t.content = '<p><span class=\"annotator-term\" id=\"a8f391d0-469c-4eb8-a83d-f2312a0d48b0\" data-term=\"(~ validChoice(X,Y))\" title=\"(~ validChoice(X,Y))\">The choice was not made</span> and <span class=\"annotator-term\" id=\"b4285291-4b35-49b9-99c2-8719de7703e4\" data-term=\"saleOfGoods\" title=\"saleOfGoods\">it is a contract for the sale of goods</span>.</p><p><br></p><p>Answer: <span class=\"annotator-goal\" id=\"d5ed9a14-f949-40a8-9bc6-8144ef3614f3\" title=\"Goal\"><span class=\"connective-depth-1 annotator-connective\" id=\"f25a4561-5d72-4db9-98fe-ce280aef067d\" data-connective=\"ob\" title=\"Obligation\"><span class=\"annotator-term\" id=\"19148cad-c4c2-4eed-a214-bd1cb9ff16e8\" data-term=\"contract(habitualResidenceSeller,Y)\" title=\"contract(habitualResidenceSeller,Y)\">The applicable law is the law of habitual residence of the seller</span></span></span>.</p>'
      // update theory
      server
				.put(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token}`)
				.send(t)
        .end(function() {
          server
            .get(`/api/queries/${t._id}`)
            .set('Authorization', `Bearer ${token}`)
            .then(response => {
              var autoVocabulary = JSON.parse(response.text).data.autoVocabulary
              assert.equal(autoVocabulary.length, 3)
              assert.equal(autoVocabulary[0].full, '(~ validChoice(X,Y))')
              assert.equal(autoVocabulary[1].full, 'saleOfGoods')
              assert.equal(autoVocabulary[2].full, 'contract(habitualResidenceSeller,Y)')
              done()
            })

        })
  })
});

describe("Delete query", function(){

  const t = Object.assign({}, query);
  t.name = "temp";
  var token

	beforeEach(async function() {
		await User.create(user)
		token = await utils.login(user)
		query.user = user;
    t.user = user;
		await Query.create(query)
	});

	afterEach(async function() {
		await Query.findByIdAndRemove(query._id)
		await User.findByIdAndRemove(user._id)
	});

	it("should return 200 on success", async function(){
      var res = await request(app)
				.delete(`/api/queries/${t._id}`)
        .set('Authorization', `Bearer ${token}`)
      expect(res.statusCode).equals(200)
      expect(res.body).to.have.property('message','Query deleted')
  });
  it("should return 404 on inability to find the query to delete", async function(){
      var res = await request(app)
				.delete('/api/queries/111')
        .set('Authorization', `Bearer ${token}`)
      expect(res.statusCode).equals(404)
      expect(res.body).to.have.property('error','Query could not be found')
  });
});

describe("Execute query", function(){

  var token

	beforeEach(async function() {
		await User.create(user)
    token = await utils.login(user)
    theory.user = user;
    await Theory.create(theory)
    query.theory = theory._id;
    query.user = user;
    await Query.create(query)
    query2.theory = theory._id;
    query2.user = user;
    await Query.create(query2)
    query3.theory = theory._id;
    query3.user = user;
    await Query.create(query3)
    await Theory.create(theory4)
    query4.theory = theory4._id;
    query4.user = user;
    await Query.create(query4)
    query8.theory = theory._id;
    query8.user = user;
    await Query.create(query8)
	});

	afterEach(async function() {
		await Query.findByIdAndRemove(query._id)
		await Query.findByIdAndRemove(query2._id)
		await Query.findByIdAndRemove(query3._id)
		await Query.findByIdAndRemove(query4._id)
		await Query.findByIdAndRemove(query8._id)
		await Theory.findByIdAndRemove(theory._id)
		await Theory.findByIdAndRemove(theory4._id)
		await User.findByIdAndRemove(user._id)
	});

  it("should return true and the proof when it is a theorem @slow", function(done){
			server
				.get(`/api/queries/${query._id}/exec`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .then(function(res) {
          assert.equal(JSON.parse(res.text).message, 'The query is valid. The goal logically follows from the assumptions and legislation')
          done()
        })
  });

	it("should return false and no proof when it is a Non-theorem @slow", function(done){
			server
				.get(`/api/queries/${query2._id}/exec`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200, { message: 'The query is counter-satisfiable. The goal does not logically follow from the assumptions and legislation',
          type: 'info'},	done);
  });
  it("should return code 400 if query is illegal @slow", function(done){
      this.timeout(5000);
			server
				.get(`/api/queries/${query3._id}/exec`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
        .then(response => {done()});
  });
  it("should return code true and proof for a theorem with empty assumptions @slow", function(done){
			server
				.get(`/api/queries/${query4._id}/exec`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .then(function(res) {
          assert.equal(JSON.parse(res.text).message, 'The query is valid. The goal logically follows from the assumptions and legislation')
          done()
        })
  });
  it("should succeed executing a query generated from annotations and is with a goal @slow", function(done){
    const t = Object.assign({}, query8);
    t.content = "<h2>Article 3 - Freedom of choice</h2><p><br></p><ol><li><span class=\"connective-depth-1 annotator-connective\" id=\"2a7dc4b6-8b46-42d9-8959-7bdb7e010d12\" data-connective=\"obonif\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1013\" data-term=\"contract(Law,Part)\">A contract</span> shall be governed by <span class=\"annotator-term\" id=\"1a3346fb-2d3f-43d1-be2a-dd588c6ad3fd\" data-term=\"validChoice(Law,Part)\">the law chosen by the parties</span>.</span> The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case. By their choice the parties can select the law applicable to the whole or to part only of the contract. </li> <li><span id=\"some-id\" class=\"annotator-goal\"><span class=\"annotator-term\" id=\"7e74072b-b8fd-4cf0-8dc9-387767de1016\" data-term=\"contract(Law,Part)\">A contract</span></span></li></ol>"
    // update theory
    server
      .put(`/api/queries/${t._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(t)
      .end(function() {
        server
          .get(`/api/queries/${t._id}/exec`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .then(response => {
            assert.equal(JSON.parse(response.text).message, "The query is counter-satisfiable. The goal does not logically follow from the assumptions and legislation")
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
      .set('Authorization', `Bearer ${token}`)
      .send(t)
      .end(function() {
        server
          .get(`/api/queries/${t._id}/exec`)
          .set('Authorization', `Bearer ${token}`)
          .expect(400, {error: 'Query has no goal. Please assign goals before trying to execute queries'}, done)
      })
  });

  it("should check that a query can be executed correctly on GDPR article 13", async function(){
      var t = Object.assign({}, theory);
      var q = Object.assign({}, query);
      let txml = fs.readFileSync("./test/fixtures/gdpr_13.xml", "utf8");
      let qxml = fs.readFileSync("./test/fixtures/gdpr_13_query.xml", "utf8");
      t.content = txml
      q.content = qxml
      q.theory = t._id
      // update theory
      var res = await request(app)
        .put(`/api/theories/${t._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(t)
      expect(res.statusCode).equals(200)
      // update query
      var res = await request(app)
        .put(`/api/queries/${q._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(q)
      expect(res.statusCode).equals(200)

      var res = await request(app)
        .get(`/api/queries/${q._id}/exec`)
        .set('Authorization', `Bearer ${token}`)
      expect(res.statusCode).equals(200)
  })


});

describe("Execute query with missing information", function(){

  var token

	beforeEach(async function() {
		await User.create(user)
    token = await utils.login(user)
    await Query.create(query)
	});

	afterEach(done => {
		Query.deleteOne({'name': query.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})});
	});

  it("should return code 400 if theory was not set", function(done){
			server
				.get(`/api/queries/${query._id}/exec`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400, {error: 'Query is not associated with a specific theory. Please set the theory before trying to execute queries'}, done);
  });
});

describe("Checking a query assumptions for consistency with relation to a theory", function(){

  var token

	beforeEach(async function() {
		await User.create(user)
    token = await utils.login(user)
		theory4.user = user;
		await Theory.create(theory4)
		query4.user = user;
		query4.theory = theory4._id;
		await Query.create(query4)
		query5.user = user;
		query5.theory = theory4._id;
		await Query.create(query5)
		query6.user = user;
		query6.theory = theory4._id;
		await Query.create(query6)
	});

	afterEach(done => {
		Query.deleteOne({'name': query4.name}, function (err) {
		Query.deleteOne({'name': query5.name}, function (err) {
		Query.deleteOne({'name': query6.name}, function (err) {
		Theory.deleteOne({'name': theory4.name}, function (err) {
		User.deleteOne({'email': user.email}, function (err) {done();})})})})});
	});

	it("should return true in case it is consistent @slow", function(done){
			server
				.get(`/api/queries/${query4._id}/consistency`)
        .set('Authorization', `Bearer ${token}`)
				.expect(200, {message: 'The assumptions of the query together with the legislation are consistent',
          type: 'success'}, done);
  });
  it("should return false in case it is inconsistent @slow", function(done){
			server
				.get(`/api/queries/${query5._id}/consistency`)
        .set('Authorization', `Bearer ${token}`)
				.expect(200, {message: 'The assumptions of the query together with the legislation are not consistent',
          type: 'info'}, done);
		});
  it("should return false in case it is inconsistent 2 @slow", function(done){
    const q = Object.assign({}, query5);
    q.assumptions = ["a"];
    const t = Object.assign({}, theory4);
    t.formalization =  [{ formula: "(a => b)"},{formula: "(a => (~ b))"} ]
			server
      .put(`/api/queries/${q._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(q).end(function() {
          server
          .put(`/api/theories/${t._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(t).end(function() {
            server
            .get(`/api/queries/${query5._id}/consistency`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200, {message: 'The assumptions of the query together with the legislation are not consistent',
              type: 'info'}, done);
          })
      })
		});
  it("should return false in case it is inconsistent among the assumptions only @slow", function(done){
			server
				.get(`/api/queries/${query6._id}/consistency`)
        .set('Authorization', `Bearer ${token}`)
				.expect(200, {message: 'The assumptions of the query together with the legislation are not consistent',
          type: 'info'}, done);
		});

  it("should return 404 in case it cannot find the query", function(done){
			server
				.get('/api/queries/111/consistency')
        .set('Authorization', `Bearer ${token}`)
				.expect(404, { error:  'Cannot find query'  }, done);
		});
});

describe("Changing queries of write protected user", function(){

  var token

	beforeEach(async function() {
		await User.create(user3)
		token = await utils.login(user3)
		query.user = user3;
		await Query.create(query)
	});

	afterEach(done => {
		Query.deleteOne({"name": query.name}, function (err) {
		User.deleteOne({'email': user3.email}, function (err) {done();})});
	});

  it("should check that a query cannot be created", function(done){
    server
      .post("/api/queries")
      .set('Authorization', `Bearer ${token}`)
      .send(query)
      .expect(400, {error: "Query cannot be created since the user is write protected"}, done);
  });
  it("should check that a query cannot be updated", function(done){
    server
      .put(`/api/queries/${query._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(query)
      .expect(400, {error: "Query cannot be updated since the user is write protected"}, done);
  });
  it("should check that a query cannot be deleted", function(done){
    server
      .delete(`/api/queries/${query._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400, {error: "Query cannot be deleted since the user is write protected"}, done);
  });
})
