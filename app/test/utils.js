'use strict';

 //  Modified from https://github.com/elliotf/mocha-mongoose

 var config = require('../config/development');
 var mongoose = require('mongoose');

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

function login(server, done) {
	server
    .post("/login")
    .send({"email": 'test@test.com', "password": 'test'})
		.end(function(err, response){
			done();
		});
};

module.exports.login = login;
