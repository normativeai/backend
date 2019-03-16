//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var theorySchema = new Schema({
    lastUpdate        : Date,
    name 		          : String,
    description       : String,
    content           : String,
    vocabulary        : [{symbol: String, original: String}],
    formalization     : [{original: String, formula: String}],
		user 							: { type: Schema.Types.ObjectId, ref: 'User' },
    clonedForm        : { type: Schema.Types.ObjectId, ref: 'Theory' }
});

theorySchema.methods.formalizationAsString = function(possibleFurtherAssumtions) {
  if (possibleFurtherAssumtions) {
    return JSON.stringify(this.formalization.map(f => f.formula).concat(possibleFurtherAssumtions)).replace(/\"/g,"");
  } else {
    return JSON.stringify(this.formalization.map(f => f.formula)).replace(/\"/g,"");
  }
};

theorySchema.methods.isConsistent = function(cb) {
	// in case the theory is not dirty
  var helper = require('./queryHelper');
  helper.mleancop(this.formalizationAsString(), "(x, (~ x))", function(theorem, proof) {
    if (theorem) {
      cb(1, theorem != 'Theorem');
    } else {
      cb(0, proof);
    }
  });
};

module.exports = mongoose.model('Theory', theorySchema );
