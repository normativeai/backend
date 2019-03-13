//Require Mongoose
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
		user 							: { type: Schema.Types.ObjectId, ref: 'User' }
});

querySchema.methods.execQuery = function(cb) {
	// in case query is not in cache and cache is not invalidated
  var helper = require('./queryHelper');

  if (!!!this.theory) {
    cb(false, false, 'Query is not associated with a specific theory. Please set the theory before trying to execute queries');
  } else if (!this.goal) {
    cb(false, false, 'Query has no goal. Please assign goals before trying to execute queries');
  } else {
    helper.mleancop(this.theory.formalizationAsString(this.assumptions), this.goal, cb);
  }
};

querySchema.methods.isConsistent = function(cb) {
	// in case the query is not dirty
  var helper = require('./queryHelper');

  if (!!!this.theory) {
    cb(false, false, 'Query is not associated with a specific theory. Please set the theory before trying to check for consistency');
  } else {
    helper.mleancop(this.theory.formalizationAsString(this.assumptions), "(x, (~ x))", function(theorem, proof) {
      if (theorem) {
        cb(1, theorem != 'Theorem');
      } else {
        cb(0, proof);
      }
    });
  }
};


module.exports = mongoose.model('Query', querySchema );
