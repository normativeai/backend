var logger = require('../config/winston');
var parser = require('./queryParser')
var fs = require("fs");
var _ = require("lodash");

function parse(proof, errors, cb) {
  var mtch = proof.match(/problem.*\sis\sa\smodal\s\(multi\/const\)\s(Theorem|Non-Theorem)\n(?:.*\n(.*)\n.*)?/);
  if (mtch) {
    cb(mtch[1],mtch[2]);
  } else {
    cb(null,`MleanCoP error: ${errors}`, 0);
  }
}

function header() {
  return "thf(problem, logic , ( $modal := [\n  $constants := $rigid,  $quantification := $constant,\n  $consequence := $local, $modalities := $modal_system_D] )).\n\n"
}

var axname = 0

function axiom(f, i) {
  return `thf(axiom_${i}, axiom, ${f}).\n\n`
}

function conjecture(f) {
  return `thf(con, conjecture, ${f}).`
}

function exec(theories, assumptions, goal, cb) {
  var cmd = "";
  if (theories.length == 0 && assumptions == 0) {
    cmd = header() + Array.from(goal[1]).join(",\n\n") + "\n\n" + conjecture(goal[0]);
  } else if (theories.length == 0) {
    var set = _.union(Array.from(assumptions).map(x => x[1]).push(goal[1]))
    cmd = header() + set.join(",\n\n") + "\n\n" + assumptions.map(function(x,i) {return axiom(x[0],i)}).join(",\n\n") + "\n\n" + conjecture(goal[0]);
  } else if (assumptions.length == 0) {
    var set = _.union(theories.map(x => x[1]).push(goal[1]))
    cmd = header() + set.join(",\n\n") + "\n\n" + Array.from(theories).map(function(x,i) {return axiom(x[0],i)}).join(",\n\n") + "\n\n" + conjecture(goal[0]);
  } else {
    var set = _.union([].concat(theories.map(x => x[1]).concat(assumptions.map(x => x[1]))))
    cmd = header() + set.join("\n\n") + "\n\n" + theories.concat(assumptions).map(function(x,i) {return axiom(x[0],i)}).join(",\n\n") + "\n\n" + conjecture(goal[0]);
  }


  console.log(`>>>>>>>${cmd}`);

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
