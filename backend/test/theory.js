var supertest = require("supertest");
const sinon = require('sinon');
const userController = require('../controllers/userController');
var server = supertest.agent("http://localhost:3000");
const utils = require('./utils.js');

describe("Create theory", function(){

	before(done => {
		//await utils.dropDBs();
		//await utils.seedUser();
		utils.login(done);
		//await loadFixture('initial-data', 'articles');
		//article = await Article.findOne({});
		//expect(article).to.not.be.null;
		//expect(article.rss).to.not.be.null;
	});

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

