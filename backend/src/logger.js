const winston = require('winston');

let level = 'debug';
if((process.env.NODE_ENV !== 'test') && (process.env.NODE_ENV !== 'production')){
	level ='debug';
}

if(process.env.NODE_ENV == 'production'){
	level ='info';
}

if(process.env.NODE_ENV == 'test'){
	level ='error';
}

const logger = new winston.Logger({
	transports: [
		new winston.transports.Console({
			level: level
		})
	]
});

module.exports = logger;