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

module.exports = mongoose.model('Theory', theorySchema );
