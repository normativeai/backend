var logger = require('../config/winston');
var fs = require("fs");

function parse(proof, errors, cb) {
  var mtch = proof.match(/problem.*\sis\sa\smodal\s\(multi\/const\)\s(Theorem|Non-Theorem)\n(?:.*\n(.*)\n.*)?/);
  if (mtch) {
    cb(mtch[1],mtch[2]);
  } else {
    cb(null,`MleanCoP error: ${errors}`, 0);
  }
}

function exec(theories, assumptions, goal, cb) {
  var cmd = "";
  if (theories.length == 0 && assumptions == 0) {
    cmd = `f((${goal})).`
  } else if (theories.length == 0) {
    cmd = `f(((${assumptions.join(",")}) => ${goal})).`
  } else if (assumptions.length == 0) {
    cmd = `f(((${theories.join(",")}) => ${goal})).`
  } else {
    cmd = `f(((${theories.join(",")},${assumptions.join(",")}) => ${goal})).`
  }
  const { execFile } = require('child_process');
  var path = require('path');
  const fileName = `problem${Math.floor(Math.random() * 10000000)}`
  var cmdPath = path.resolve('tools', './mleancop.sh');
  var filePath = path.resolve('tools', fileName);
  var curDir = path.resolve('tools', '.');
  fs.writeFile(`tools/${fileName}`, cmd, function(err, data) {
    if (err) {
      logger.error(err)
      cb(null, `Internal server error ${err}`, 0);
    } else {
      const child = execFile('./mleancop.sh', [fileName], {cwd: curDir, timeout: 5000}, (error, stdout, stderr) => {
        if (stdout) {
          logger.info(`MleanCoP response: ${stdout} --- stderr: ${stderr}`);
          fs.unlinkSync(`tools/${fileName}`);
          parse(stdout,stderr,cb);
        } else {
          logger.error(`MleanCoP timeout: ${error}`);
          fs.unlinkSync(`tools/${fileName}`);
          cb(null, `MleanCoP timeout ${error}`, 2); // 2 stands for timeout
        }
      });
    }
  });
}

module.exports = {parse: parse, exec: exec}
