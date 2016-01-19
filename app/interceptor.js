
// route middleware to ensure user is logged in
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

function isLoggedInAPI(req,res,next){
	if(!req.isAuthenticated()){
		res.send(401);	// unauthorized
	}else if(!req.user.detailsFilled || req.user.detailsFilled==false){
		res.send(401);	// unauthorized
	}else{
		next();
	}
}
function isAdmin(req,res,next){
	if(!req.isAdmin){
		return res.send(401);
	}
  next();
}

function allRequests(req,res,next){
	res.locals.isAuthenticated = req.isAuthenticated();
	if(res.locals.isAuthenticated){
		req.isAdmin = res.locals.isAdmin = req.user.local.email.toUpperCase()=="MDAKRAM28@GMAIL.COM";
	}else{
		req.isAdmin = res.locals.isAdmin = false;
	}
	next();
}


module.exports.isLoggedIn = isLoggedIn;
module.exports.isAdmin = isAdmin;
module.exports.isLoggedInAPI = isLoggedInAPI;
module.exports.allRequests = allRequests;