// config/auth.js

// expose our config directly to our application using module.exports

var serverConfig = require("../serverFiles/config");
module.exports = {

	'facebookAuth' : {
		'clientID' 		: '1081360455228014', // your App ID
		'clientSecret' 	: 'a6d271e93398bd65b9ca1ee73a40966a', // your App Secret
		'callbackURL' 	: serverConfig.domain+'/auth/facebook/callback'
	},

	'googleAuth' : {
		'clientID' 		: '716486705233-dflg393u6vrjsbmdtpnvk25k2pinbc51.apps.googleusercontent.com',
		'clientSecret' 	: 'lInwZhdwjnJZW0gkp8q1MHAo',
		'callbackURL' 	: serverConfig.domain+'/auth/google/callback'
	}

};
