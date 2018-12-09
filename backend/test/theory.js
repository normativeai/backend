var supertest = require("supertest");
const sinon = require('sinon');
const userController = require('../controllers/userController');
var server = supertest.agent("http://localhost:3000");

var login = function(done) {
  server
    .post("/api/login")
    .send({email: 'test@test.com', password: 'test'})
    .then(response => {
      done();
    });
};

describe("Create theory", function(){

	before(function(done) {
		login(done);
	})

	it("should return the created theory", function(done){
			server
				.post("/api/theory")
				.send({
					name: 'Test ',
					description: 'Desc',
					content: 'Content',
					vocabulary: [{symbol: 'D', original: 'Delivery'}, {symbol: 'I', original: 'Insurance'}],
					formalization: [{original: 'Delivery means you should make Insurance', formula: 'D => I'}],
				})
				.expect(200, {
					name: 'Test',
					description: 'Desc',
					content: 'Content',
					vocabulary: [{symbol: 'D', original: 'Delivery'}, {symbol: 'I', original: 'Insurance'}],
					formalization: [{original: 'Delivery means you should make Insurance', formula: 'D => I'}],
				}, done);
		});
});

