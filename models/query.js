//Require Mongoose
var logger = require('../config/winston');
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var querySchema = new Schema({
    lastUpdate        : Date,
    name 		          : String,
    assumptions       : [String],
    goal              : String,
    description       : String,
		cached_result			: String,
		theory						: { type: Schema.Types.ObjectId, ref: 'Theory' },
		user 							: { type: Schema.Types.ObjectId, ref: 'User' },
    lastQueryDate     : Date,
    lastQueryTheorem  : String,
    lastQueryProof    : String,
    lastConsistencyDate : Date,
    lastConsistency   : Boolean
});

querySchema.methods.execQuery = function(cb) {
  if (true) { //(typeof this.lastQueryDate === 'undefined' || this.lastUpdate > this.lastQueryDate) {
    var helper = require('./queryHelper');

    if (!!!this.theory) {
      cb(false, 'Query is not associated with a specific theory. Please set the theory before trying to execute queries');
    } else if (!this.goal) {
      cb(false, 'Query has no goal. Please assign goals before trying to execute queries');
    } else {
      var obj = this
      helper.executeQuery(this.theory.getFormalization(), this.assumptions, this.goal, function(theorem, proof) {
        obj.lastQueryTheorem = theorem;
        obj.lastQueryProof = proof;
        obj.lastQueryDate = new Date();
        obj.save(function (err) {
          if (err)
            logger.error(`Cannot save query state. ${err}`);
        });
        cb(theorem, proof);
      });
    }
  } else {
    cb(this.lastQueryTheorem, this.lastQueryProof);
  }
};

querySchema.methods.isConsistent = function(cb) {
  if (typeof this.lastConsistencyDate === 'undefined' || this.lastUpdate > this.lastConsistencyDate) {
    var helper = require('./queryHelper');

    if (!!!this.theory) {
      cb(false, 'Query is not associated with a specific theory. Please set the theory before trying to check for consistency');
    } else {
      var obj = this
      helper.executeQuery(this.theory.getFormalization(), this.assumptions, "(x, (~ x))", function(theorem, proof) {
        if (theorem) {
        obj.lastConsistency = (theorem != 'Theorem');
        obj.lastConsistencyDate = new Date();
        obj.save(function (err) {
          if (err)
            logger.error(`Cannot save consistency state. ${err}`);
        });
          cb(1, theorem != 'Theorem');
        } else {
          cb(0, proof);
        }
      });
    }
  } else {
    cb(1, this.lastConsistency);
  }
};


module.exports = mongoose.model('Query', querySchema );
