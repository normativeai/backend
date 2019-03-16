class QueryHelper {
	static parse(proof, errors, cb) {
    var mtch = proof.match(/problem\sis\sa\smodal\s\(multi\/const\)\s(Theorem|Non-Theorem)\n(?:.*\n(.*)\n.*)?/);
    if (mtch) {
      cb(mtch[1],mtch[2]);
    } else {

      cb(null,`MleanCoP error: ${errors}`);
    }
	}

  static mleancop(theory, query, cb) {
    const { execFile } = require('child_process');
    const cmd = `(${theory.toString()}, ${query})`;
    const child = execFile("ruby", ["-Ctools", "prove1.rb", cmd], {"timeout": 5000}, (error, stdout, stderr) => {
      QueryHelper.parse(stdout,stderr,cb);
    });
  }
}

module.exports = QueryHelper;
