'use strict';

const request = require("supertest");
const app = require('../app');

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

async function login(user) {
  const res = await request(app)
    .post("/api/login")
    .send(user)
  return res.body.token;
};

module.exports.login = login;
