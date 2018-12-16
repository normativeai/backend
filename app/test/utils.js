'use strict';

 //  Modified from https://github.com/elliotf/mocha-mongoose

 var config = require('../config/development');
 var mongoose = require('mongoose');
const user = require('./fixtures/user.json').User;

 before(function (done) {

   function clearDB() {
     for (var i in mongoose.connection.collections) {
       mongoose.connection.collections[i].remove(function() {});
     }
     return done();
   }

   if (mongoose.connection.readyState === 0) {
     mongoose.connect(config.db, function (err) {
       if (err) {
         throw err;
       }
       return clearDB();
     });
   } else {
     return clearDB();
   }
 });

 after(function (done) {
   mongoose.disconnect();
   return done();
 });

function login(server, token, done) {
	server
    .post("/api/login")
    .send(user)
		.end(function(err, response){
      token.token = response.body.token;
			done();
		});
};

module.exports.login = login;
