//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var querySchema = new Schema({
    name 		          : String,
    content           : String,
		cached_result			: String,
		theory						: { type: Schema.Types.ObjectId, ref: 'Theory' },
});

querySchema.methods.execQuery = function(cb) {
	// in case query is not in cache and cache is not invalidated
	const { execFile } = require('child_process');
	var execStr = "ruby -Ctools prove1.rb " + this.content;
	console.log(execStr);
	const child = execFile("ruby", ["-Ctools", "prove1.rb", this.content], (error, stdout, stderr) => {
		var helper = require('./queryHelper');
		console.log('stderr: %s', stderr);
		console.log('ok: %s',stdout);
		cb(helper.parse(stdout,stderr));
	});
};

module.exports = mongoose.model('Query', querySchema );
