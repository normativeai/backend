//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var theorySchema = new Schema({
    name 		          : String,
    content           : String,
});

module.exports = mongoose.model('Theory', theorySchema );
