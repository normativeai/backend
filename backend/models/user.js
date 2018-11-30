//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var userSchema = new Schema({
    name 		          : String,
    email             : String,
		password    			: String,
		theories					: [{ type: Schema.Types.ObjectId, ref: 'Theory' }],
		queries						: [{ type: Schema.Types.ObjectId, ref: 'Query' }],
});

module.exports = mongoose.model('User', userSchema );
