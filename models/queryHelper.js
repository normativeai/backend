var logger = require('../config/winston');
var parser = require('./queryParser')
var fs = require("fs");

class QueryHelper {
	static parse(proof, errors, cb) {
    var mtch = proof.match(/problem.*\sis\sa\smodal\s\(multi\/const\)\s(Theorem|Non-Theorem)\n(?:.*\n(.*)\n.*)?/);
    if (mtch) {
      cb(mtch[1],mtch[2]);
    } else {
      cb(null,`MleanCoP error: ${errors}`, 0);
    }
	}

  static executeQuery(formulas, assumptions, goal, cb) {
    var Theory = require('../models/theory');
    var cmd = "f(((";
    var hadValue = false;
    for (let i = 0; i < formulas.length; i++) {
      if (Theory.isActive(formulas[i])) {
        if (hadValue) {
          cmd += ", ";
        }
        var f = formulas[i].formula;
        try {
      console.log(f)
          var f_parsed = parser.parseFormula(f);
          cmd += f_parsed;
          hadValue = true;
        } catch (error) {
          logger.info(`Cannot parse formula ${i+1} out of ${formulas.length} formulae: ${f} - Error: ${error}`);
          cb(null, `Cannot parse formula ${i+1} out of ${formulas.length} formulae: ${f} - Error: ${error}`, 0);
          return;
        }
      }
    };
    for (let i = 0; i < assumptions.length; i++) {
      var f = assumptions[i];
      try {
        var f_parsed = parser.parseFormula(f);
        cmd += ", ";
        cmd += f_parsed;
      } catch (error) {
        logger.info(`Cannot parse query assumption ${i+1} out of ${assumptions.length} formulae: ${f} - Error: ${error}`);
        cb(null, `Cannot parse query assumption ${i+1} out of ${assumptions.length} formulae:  ${f} - Error: ${error}`, 0);
        return;
      }
    };

    try {
      var goal_parsed = parser.parseFormula(goal);
      cmd += `) => ${goal_parsed})).`
    } catch (error) {
      logger.info(`Cannot parse goal ${goal} - Error: ${error}`);
      cb(null, `Cannot parse goal ${goal} - Error: ${error}`, 0);
      return;
    }
    logger.info(cmd);
    QueryHelper.mleancop(cmd,cb);
  }

  static mleancop(cmd, cb) {
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
        const child = execFile('./mleancop.sh', [fileName], {cwd: curDir, timeout: 100000}, (error, stdout, stderr) => {
          if (stdout) {
            logger.info(`MleanCoP response: ${stdout} --- stderr: ${stderr}`);
            fs.unlinkSync(`tools/${fileName}`);
            QueryHelper.parse(stdout,stderr,cb);
          } else {
            logger.error(`MleanCoP timeout: ${error}`);
            fs.unlinkSync(`tools/${fileName}`);
            cb(null, `MleanCoP timeout ${error}`, 2); // 2 stands for timeout
          }
        });
      }
    });
  }
}

module.exports = QueryHelper;
