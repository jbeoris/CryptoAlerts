var config = require('./config');
var fs = require('fs');
var Client = require('coinbase').Client;
var coinbaseClient = new Client({
	'apiKey':config.api.coinbase.key,
	'apiSecret':config.api.coinbase.secret
});
var twilio = require('twilio');
var twilioClient = new twilio(config.api.twilio.sid, config.api.twilio.token);
var Promise = require("bluebird");

var CURRENCY_FORMAT = config.currencyFormat;
var COOLDOWN = config.alertCooldownInMinutes * 60 * 1000;

var targets = config.targets;

var getPrice = function(target) {
	return new Promise(function(resolve, reject) {
		var descriptor = formTargetDescriptor(target.token);

		coinbaseClient.getBuyPrice({'currencyPair': descriptor}, function(err, obj) {
			if (err || !obj) {
				reject(err || "Something went wrong.");
			} else {
				resolve(obj);
			}
		});
	});
}

var formTargetDescriptor = function(type) {
	return type + "-" + CURRENCY_FORMAT;
}

var fromPriceMessage = function(token, amount) {
	return "Current " + token + " price is " + amount + " " + CURRENCY_FORMAT + "."
}

var formAlertMessage = function(action) {
	return "You should " + action + " according to your triggers."
}

var scanPrices = function() {
	targets.forEach(function(target) {
		getPrice(target).then(function(obj) {
			logPrice(target, obj.data);
			checkTriggers(target, obj.data);
		}).catch(function(err) {
			console.error(err);
		});
	});
}

var logPrice = function(target, data) {
	console.log(fromPriceMessage(target.token, data.amount));
}

var checkTriggers = function(target, data) {
	if (target.buy >= data.amount) {
		sendAlert(target.token, data.amount, 'buy');
	}

	if (target.sell <= data.amount) {
		sendAlert(target.token, data.amount, 'sell');
	}
}

var sendAlert = function(token, amount, action) {
	isMessagingPermitted().then(function() {
		var message = [fromPriceMessage(token, amount), formAlertMessage(action)].join(' ');

		sendTwilioMessage(message);
	}).catch(function(err) {
		console.error(err);
	})
}

var sendTwilioMessage = function(message) {
	twilioClient.messages.create({
	    body: message,
	    to: config.api.twilio.receiver,
	    from: config.api.twilio.sender
	})
	.then(function(message) {
		console.log('Message sent: ', message.sid)
		logMessage();
	});
}

var isMessagingPermitted = function() {
	return new Promise(function(resolve, reject) {
		fs.readFile('./messageLog.txt', 'utf-8', function(err, data) {
			if (err) {
				reject(err || "Something went wrong!");
				return;
			}

			var lines = data.trim().split('\n');
			var lastLine = lines.slice(-1)[0];

			if (lastLine) {
				var data = JSON.parse(lastLine);

				var lastDate = new Date(data.sentAt);

				if (lastDate) {
					var lastTime = lastDate.getTime();
					var dateNow = new Date()
					var timeNow = dateNow.getTime();
					var diff = timeNow - lastTime;

					if (diff > COOLDOWN) {
						resolve(true);
					} else {
						reject("Last message sent too recently.");
					}
				} else {
					resolve(true);
				}
			} else {
				resolve(true);
			}
		});
	});
}

var logMessage = function() {
	var dateNow = new Date();

	var data = {
		"sentAt" : dateNow
	};

	var stringData = JSON.stringify(data) + '\n';

	fs.appendFile('./messageLog.txt', stringData, function(err) {
		if (err) {
			console.error(err);
		}
	});
}

module.exports = {
	'scanPrices' : scanPrices
}