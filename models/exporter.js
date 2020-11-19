var logger = require('../config/winston');
var fs = require("fs");

class Exporter {

  static export(formulas, assumptions, goal, exporter, cb) {
    var Theory = require('../models/theory');
    var cmd = exporter.header()
    var hadValue = false;
    for (let i = 0; i < formulas.length; i++) {
      if (Theory.isActive(formulas[i])) {
        if (hadValue) {
          cmd += exporter.formulaSep();
        }
        var f = formulas[i].formula;
        try {
          var f_parsed = exporter.exportFormula(f);
          cmd += f_parsed;
          hadValue = true;
        } catch (error) {
          logger.info(`Cannot export formula ${i+1} out of ${formulas.length} formulae: ${f} - Error: ${error}`);
          cb(`Cannot export formula ${i+1} out of ${formulas.length} formulae: ${f} - Error: ${error}`, 0);
          return;
        }
      }
    };
    for (let i = 0; i < assumptions.length; i++) {
      var f = assumptions[i];
      try {
        var f_parsed = exporter.exportFormula(f);
        cmd += exporter.formulaSep();
        cmd += f_parsed;
      } catch (error) {
        logger.info(`Cannot export query assumption ${i+1} out of ${assumptions.length} formulae: ${f} - Error: ${error}`);
        cb(`Cannot export query assumption ${i+1} out of ${assumptions.length} formulae:  ${f} - Error: ${error}`, 0);
        return;
      }
    };

    try {
      var goal_parsed = exporter.exportGoal(goal);
      cmd += exporter.goalSep()
      cmd += goal_parsed
    } catch (error) {
      logger.info(`Cannot export goal ${goal} - Error: ${error}`);
      cb(`Cannot export goal ${goal} - Error: ${error}`, 0);
      return;
    }
    logger.info(cmd);
    cb(cmd)
  }
}

module.exports = Exporter;
