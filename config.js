module.exports = {
	'api' : {
		'twilio' : {
			'sid' : 'YOUR_SID_HERE',
			'token' : 'YOUR_TOKEN_HERE',
			'sender' : 'YOUR_SENDER_NUMBER_HERE',
			'receiver' : 'YOUR_RECEIVER_NUMBER_HERE'
		},
		'coinbase' : {
			'key' : 'YOUR_KEY_HERE',
			'secret': 'YOUR_SECRET_HERE'
		}
	},
	'targets' : [
		{
			'token' : 'ETH',
			'buy' : 350.00,
			'sell' : 400.00
		}
	],
	'currencyFormat': 'USD',
	'alertCooldownInMinutes' : 30
};