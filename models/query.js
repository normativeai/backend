//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var querySchema = new Schema({
    name 		          : String,
    content           : String,
		cached_result			: String,
		theory						: { type: Schema.Types.ObjectId, ref: 'Theory' },
		user 							: { type: Schema.Types.ObjectId, ref: 'User' }
});

querySchema.methods.execQuery = function(cb) {
	// in case query is not in cache and cache is not invalidated
  var helper = require('./queryHelper');
  helper.mleancop(theory.formalization.formula, this.content,cb);
};

module.exports = mongoose.model('Query', querySchema );
