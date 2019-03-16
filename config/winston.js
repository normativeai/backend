var appRoot = require('app-root-path');
var winston = require('winston');

var {Loggly} = require('winston-loggly-bulk');

winston.add(new Loggly({
      token: "707503a7-70fd-4568-8c49-0672bce93910",
      subdomain: "nai",
      tags: ["Winston-NodeJS"],
      json: true
}));

winston.log('info', "Loggly logging started!");

