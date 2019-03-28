var logger = require('../config/winston');
var parser = require('./queryParser')
var fs = require("fs");

class QueryHelper {
	static parse(proof, errors, cb) {
    var mtch = proof.match(/problem.*\sis\sa\smodal\s\(multi\/const\)\s(Theorem|Non-Theorem)\n(?:.*\n(.*)\n.*)?/);
    if (mtch) {
      cb(mtch[1],mtch[2]);
    } else {
      cb(null,`MleanCoP error: ${errors}`);
    }
	}

  static mleancop(theory, query, cb) {
    const { execFile } = require('child_process');
    var path = require('path');
    const fileName = `problem${Math.floor(Math.random() * 10000000)}`
    var cmdPath = path.resolve('tools', './mleancop.sh');
    var filePath = path.resolve('tools', fileName);
    var curDir = path.resolve('tools', '.');
    const computed_query = `(${theory.toString()}, ${query})`;
    var cmd = false
    try {
      cmd = parser.parse(computed_query);
    } catch (error) {
      logger.info(`Query parsing error. ${error}`);
      cb(null, `Cannot parse your query ${computed_query} - Error: ${error}`);
      return;
    }
    logger.info(`MleanCoP Query: ${computed_query} ---- Command: ${cmd}`);
    fs.writeFile(`tools/${fileName}`, cmd, function(err, data) {
      if (err) {
        logger.error(err)
        cb(null, `Internal server error ${err}`);
      } else {
        const child = execFile('./mleancop.sh', [fileName], {cwd: curDir}, (error, stdout, stderr) => {
          if (stdout) {
            logger.info(`MleanCoP response: ${stdout} --- stderr: ${stderr}`);
            fs.unlinkSync(`tools/${fileName}`);
            QueryHelper.parse(stdout,stderr,cb);
          } else {
            logger.error(`Internal server error: ${error}`);
            fs.unlinkSync(`tools/${fileName}`);
            cb(null, `Internal server error ${error}`);
          }
        });
      }
    });
  }
}

module.exports = QueryHelper;
