//Import the mongoose module
var mongoose = require('mongoose');

module.exports = function (mongo) {

	//Set up default mongoose connection
	var connection = mongoose.connect(mongo);
	// Get Mongoose to use the global promise library
	mongoose.Promise = global.Promise;

	connection
		.then(db => {
			logger.info(
				`Successfully connected to ${mongo} MongoDB cluster`
			);
			return db;
		})
		.catch(err => {
			if (err.message.code === 'ETIMEDOUT') {
				logger.info('Attempting to re-establish database connection.');
				mongoose.connect(mongo);
			} else {
				logger.error('Error while attempting to connect to database:', { err });
			}
		});

	return connection;
}
