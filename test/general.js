var assert = require('assert')
var supertest = require("supertest");
const utils = require('./utils.js');
const User = require('../models/user');
const generalConstroller = require('../controllers/generalController')
const user = require('./fixtures/user.json').User;
var server = supertest.agent("http://localhost:3000");

describe("Requesting the connectives", function(){

  var token

	beforeEach(async function() {
		await User.create(user)
    token = await utils.login(user)
	});

	afterEach(done => {
		User.deleteOne({'email': user.email}, function (err) {done();});
	});

  it('should return an object containing the connectives, their codes and their arities', function(done){
			server
				.get(`/api/general/connectives`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .then(response => {
          var or = response.body.data.or
          assert(or['name'],'Or')
          assert(or['arity'],'Two or more')
          var obif = response.body.data.obif
          assert(obif['name'],'Obligation If')
          assert(obif['arity'],'One')
          done();
        })
  });
});
