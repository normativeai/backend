const { createLogger, format, transports } = require('winston');

const level = process.env.LOG_LEVEL || 'debug';

const logger = createLogger({
    transports: [
        new transports.Console({
            level: level,
            timestamp: function () {
                return (new Date()).toISOString();
            }
        })
    ]
});

module.exports = logger
