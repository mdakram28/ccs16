function isLoggedIn(req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/login');
	if(!req.user.detailsFilled){
		return res.redirect('/details');
	}
	var userInfo = {
		username : req.user.profile.username,
		regNo : req.user.profile.regNo,
		mobNo : req.user.profile.mobNo,
		authType : req.user.authType
	}
	if(userInfo.authType=="local"){
		userInfo.email = req.user.local.email;
		userInfo.password = req.user.local.password;
	}else if(userInfo.authType=="facebook"){
		userInfo.email = req.user.facebook.email;
		userInfo.password = req.user.facebook.token;
	}else if(userInfo.authType=="twitter"){
		userInfo.email = "";
		userInfo.password = req.user.twitter.token;
	}else if(userInfo.authType=="google"){
		userInfo.email = req.user.google.email;
		userInfo.password = req.user.google.token;
	}
	req.userInfo = userInfo;
	res.locals.userInfo = userInfo;
	next();
}

module.exports.isLoggedIn = isLoggedIn;