/**
 * Created by garychen on 11/16/15.
 */
var winston = require('winston');
winston.emitErrs = true;

var logger = new winston.Logger({
	transports: [
    new (winston.transports.Console)({
      level: 'debug',
      colorize: true,
      json: false
    }),
    new (winston.transports.File)({
      filename: 'error.log',
      handleExceptions: true
    })
  ],
  exitOnError: false
});

module.exports = logger;
module.exports.stream = {
	write: function (message, encoding) {
		logger.info(message);
	}
}
