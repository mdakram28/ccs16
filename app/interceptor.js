var User = require("./models/user");
var Ques = require("./models/ques");
var data;

var startTime = new Date("Wed Sep 07 2016 06:00:21 GMT+0530 (India Standard Time)").getTime();
var endTime = new Date("Wed Sep 07 2016 07:00:21 GMT+0530 (India Standard Time)").getTime();
// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	//console.log(req.user);
	if (!req.isAuthenticated())
		return res.redirect('/');
	if(!req.user.detailsFilled){
		return res.redirect('/details');
	}
	var userInfo = {
		regNo : req.user.details.regNo,
		mobNo : req.user.details.mobNo,
		fullName : req.user.details.fullName,
		email : req.user.google.email,
		password : req.user.google.token
	}

	req.userInfo = userInfo;
	res.locals.userInfo = userInfo;
	res.locals.user = req.user;
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

var admins = [
	"15BIT0166"
	];
function allRequests(req,res,next){
	res.locals.categories = Ques.schema.path("category").enumValues;
	res.locals.isAuthenticated = req.isAuthenticated();
	if(res.locals.isAuthenticated){
		req.isAdmin = res.locals.isAdmin = (admins.indexOf(req.user.details.regNo.toUpperCase())>=0);
	}else{
		req.isAdmin = res.locals.isAdmin = false;
	}
	req.data = data;
	res.locals.category = '';
	res.locals.active = '';
	res.locals.categoryName = {
	    webdev : "Web Development",
	    logical : "Logical",
	    security : "Security",
	    design : "Design"
	};
	res.locals.startTime = startTime;
	res.locals.endTime = endTime;
	next();
}

function dbStart(){
	Ques.find({},function(err,quess){
		if(err)throw err;
		data.totalQuestions = quess.length;
		data.questions = quess;
	});
	//refreshLeaderboard();
}

function refreshLeaderboard(){
	User.find({},function(err,users){
		for(var i=users.length-1;i>=0;i--){
			if(!users[i].detailsFilled){
				users.splice(i,1);
			}
		}
		users.sort(function(user1,user2){
			var diff = difference(user2,user1);;
			return diff;
		});
		data.leaderboard = users;
		//console.log(users);
	});
}

function difference(user1,user2){
	if(!user1.status.lastSolveTime && !user2.status.lastSolveTime)return 0;
	if(!user1.status.lastSolveTime)return -1;
	if(!user2.status.lastSolveTime)return 1;
	var diff = user1.status.currentQues - user2.status.currentQues;
	if(diff!=0){
		return diff;
	}
	return user2.status.lastSolveTime.valueOf() - user1.status.lastSolveTime.valueOf();
}

module.exports.isLoggedIn = isLoggedIn;
module.exports.isAdmin = isAdmin;
module.exports.isLoggedInAPI = isLoggedInAPI;
module.exports.allRequests = allRequests;
module.exports.dbStart = dbStart;
module.exports.difference = difference;
module.exports.refreshLeaderboard = refreshLeaderboard;

module.exports.init = function(data2){
	data = data2;
	return module.exports;
}
