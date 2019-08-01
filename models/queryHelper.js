var logger = require('../config/winston');
var fs = require("fs");

class QueryHelper {
  static executeQuery(formulas, assumptions, goal, engine, parser, cb) {
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
    engine.exec(cmd,cb);
  }
}

module.exports = QueryHelper;

