var User = require("./models/user");
var inter = require("./interceptor");
var Ques = require("./models/ques");
var jwt = require('jsonwebtoken');

//var leaderboard = [];
var data;
var activePlayers = {};//{username,socket._id}
var userSockets = {};//username : socketId
/*
XYZ : top of leaderboard by clearing level 6
friendUsername : cleared level 12 and has now a rank of 124
*/
function move(oldIndex,newIndex){
	console.log("moving",oldIndex,newIndex);
	for(var i=newIndex;i<oldIndex;i++){
		sendToAll("updateFriendRank",{username:data.leaderboard[i].profile.username,rank:i+2});
	}
	
	sendToAll("updateFriendRank",{username:data.leaderboard[oldIndex].profile.username,rank:newIndex+1});
	data.leaderboard.splice(newIndex,0,data.leaderboard.splice(oldIndex,1)[0]);
}

function getRank(username){
	for(var i=0;i<data.leaderboard.length;i++){
		if(data.leaderboard[i].profile.username == username){
			return i+1;
		}
	}
	return 0;
}

function updateRank(user){
	var prevRank = 0;
	for(var i=0;i<data.leaderboard.length;i++){
		if(data.leaderboard[i].profile.username == user.profile.username){
			prevRank = i;
			break;
		}
	}
	console.log(prevRank);
	if(prevRank==0)return;
	data.leaderboard[prevRank] = user;
	var newRank = 0;
	for(var i=prevRank-1;i>=0;i--){
		 var diff = inter.difference(user,data.leaderboard[i]);
		 console.log(user.status.currentQues,data.leaderboard[i].status.currentQues,diff);
		 if(diff<0){
		 	move(prevRank,i+1);
		 	
		 	newRank = i+1;
		 	break;
		 }
	}
	if(newRank==0){
		move(prevRank,0);
	}
	//console.log(data.leaderboard);
	return newRank;
}
var totalQuestions;

var wrongAnswerMessages=[
	"No luck try next time",
	"No luck try dfdsnext time",
	"No luck dfdsftry next time",
	"No luck try next sdfdsftime",
	"No luck dsfdstry next time",
	"No luck dfdfdtry next time",
	"No luck try nsdfsdfext time"
];
var nearAnswerMessages=[
	"You are near bro..",
	"nearer",
	"Just some more tries",
	"Come on you have just done it"
];

function random(lower,upper){
	return lower+Math.floor(Math.random()*(upper-lower));
}
var sendToAll;
var send;
var sendTOFriends;

module.exports = function(app,passport,data2){
	data = data2;
	
	sendToAll = function sendToAll(event,data){
		app.io.emit(event,data);
	}
	
	send = function send(username,event,data){
		console.log(data);
		var socket = app.io.sockets.connected[userSockets[username]];
		console.log(socket);
		if(!socket){
			return;
		}
		socket.emit("helloooooo");
	}
	
	sendToFriends = function sendToFriends(user,event,data) {
		User.find({followers:user.profile.username},function(err,users){
			if(err)return;
			users.forEach(function(err,friend){
				if(err)return;
				send(friend.profile.username,event,data);
			});
		});
	}
	
	app.get("/game",inter.isLoggedIn,function(req,res){
		jwt.sign({ username : req.user.profile.username }, "riddlerSocket@!@#$$%^", {algorithm:'HS256'}, function(token) {
			res.locals.socketToken = token;
			res.locals.currentQues = req.user.status.currentQues;
			res.locals.credits = req.user.status.credits;
			res.locals.rank = getRank(req.user.profile.username);
			User.find({"followers":req.user.profile.username},function(err, users) {
				var friends = [];
			    users.forEach(function(friend){
			    	friends.push({
			    		username : friend.profile.username,
			    		fullName : friend.profile.fullName,
			    		rank : getRank(friend.profile.username)
			    	});
			    });
			    res.locals.friends = friends;
			    res.locals.user = req.user;
				res.render("question");
			});
		});
	});
	
	// app.get("/api/getRank",inter.isLoggedInAPI,function(req,res){
	// 	User.find({},function(err,users){
	// 		for(var i=0;i<users.length;i++){
	// 			if(users.profile.username==req.user.profile.username){
					
	// 			}
	// 		}
	// 	});
	// });
	
	app.post('/api/addFriend',function(req,res) {
	    var username = req.body.username.toString();
	    User.findOne({"profile.username":username},function(err, user) {
	        if(err){
	        	return res.json({
	        		success:false,
	        		error:true,
	        		message:"Unknown error"
	        	});
	        }
	        if(!user){
	        	return res.json({
	        		success:false,
	        		error:false,
	        		message:"User not found"
	        	});
	        }
	        if(user.followers.indexOf(req.user.profile.username)>=0){
	        	return res.json({
	        		success:false,
	        		error:false,
	        		message:"Already following"
	        	});
	        }
	        user.followers.push(req.user.profile.username);
	        user.save();
	        res.json({
	        	success:true,
	        	friend:{
	        		username:user.profile.username,
	        		fullName:user.profile.fullName,
	        		rank:getRank(user.profile.username)
	        	}
	        });
	    });
	});
	
	app.get("/api/removeFriend",function(req, res) {
		if(!req.query.username)return 404;
	    var username= req.query.username.toString();
	    User.findOne({"profile.username":username},function(err, user) {
	        if(err){
	        	return res.json({
	        		success:false,
	        		error:true,
	        		message:"Some error occurred"
	        	});
	        }
	        if(!user){
	        	return res.json({
	        		success:false,
	        		error:false,
	        		message:"User not found"
	        	});
	        }
	        console.log(user);
	        var index = user.followers.indexOf(req.user.profile.username);
	        if(index==-1){
	        	return res.json({
	        		success:false,
	        		error:false,
	        		message:"User is not followed"
	        	});
	        }
	        user.followers.splice(index,1);
	        user.save();
	        return res.json({
	        	success:true,
	        	message:"User successfully unfollowed"
	        })
	    })
	});
	
	app.get("/api/searchFriends",inter.isLoggedInAPI,function(req, res) {
		if(!req.query.search)return 404;
	    var search= req.query.search.toString();
	    User.find({detailsFilled:true},function(err, users) {
	        var results=[];
	        users.forEach(function(user,index){
	        	if(index>=20)return;
	        	if(user.profile.username==req.user.profile.username)return;
	        	var patt = new RegExp(search.toUpperCase());
	        	if(patt.test(user.profile.username.toUpperCase()) || patt.test(user.profile.fullName.toUpperCase())){
		        	results.push({
		        		username:user.profile.username,
		        		fullName:user.profile.fullName
		        	});
	        	}
	        });
	        res.json(results);
	    });
	});
	
	app.io.on('connection',function(socket) {
	    socket.on('ready',function(data){
	    	data = data.toString();
			jwt.verify(data, 'riddlerSocket@!@#$$%^', function(err, decoded) {
				if(err)return;
				console.log(decoded);
				userSockets[decoded.username] = socket.id;
			});
	    });
	    socket.emit("Connected to server");
	});

	app.get("/api/currentQuestion",inter.isLoggedInAPI,function(req,res){
		Ques.findOne({quesNum:req.user.status.currentQues},function(err,ques){
			if(err){
				return res.send(500);
			}
			if(!ques){
				return res.json({
					end : true,
					alert:"Congratulations !! ... You cleared riddler . You will be contacted soon."
				});
			}
			return res.json({
				quesNum : ques.quesNum,
				story : ques.story,
				ques : ques.ques,
				credits:ques.credits,
				hintBought : req.user.status.hints.indexOf(ques.quesNum)>=0
			});
		});
	});
	
	app.get("/api/getHint",inter.isLoggedInAPI,function(req, res) {
	    Ques.findOne({quesNum:req.user.status.currentQues},function(err,ques){
			if(err || !ques){
				return res.send(500);
			}
			if(req.user.status.hints.indexOf(ques.quesNum)>=0){
				return res.json({
					success:true,
					hint:ques.hint
				});
			}
			if(req.user.status.credits<ques.credits){
				return res.json({
					success:false,
					error:false,
					message:"Not enough credits to buy hint for this question"
				});
			}
			req.user.status.credits -= ques.credits;
			req.user.status.hints.push(ques.quesNum);
			req.user.save();
			
			res.json({
				success:true,
				message:"Hint for question bought",
				hint:ques.hint,
				credits:req.user.status.credits
			});
		});
	});
	
	app.get("/api/reset",inter.isLoggedIn,function(req,res){
		req.user.status.currentQues = 1;
		req.user.status.credits = 0;
		req.user.status.lastSolvedTime = undefined;
		req.user.status.hints.splice(0,req.user.status.hints.length);
		req.user.save(function(err){
			inter.refreshLeaderboard();
			res.redirect("/game");
		});
	});
	
	app.get("/api/invite",inter.isLoggedInAPI,function(req, res) {
		if(req.user.authType!="google"){
			return res.json({
				success:false,
				message:"Sorry. Non - Vitian account cannot invite."
			});
		}
		if(req.user.invitedEmail!="" && req.user.invitedEmail!=undefined){
			return res.json({
				success:false,
				message:"Sorry ... You can invite just a single email account."
			});
		}
	    var email = req.query.email;
	    if(!email)return 500;
	    email = email.toUpperCase();
	    var match_email = (/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i).test(email);
		if(!match_email){
			return res.json({
				success:false,
				message:"Invalid email format"
			});
		}
		req.user.invitedEmail = email;
		req.user.save();
		res.json({
			success:true,
			message:"Invite sent to the email . Now user can register on the email account. Invite is sent to the email id."
		});
	});
	
	app.get("/leaderboard",function(req,res){
		res.json(data.leaderboard);
	});

	app.post("/api/attempt",inter.isLoggedInAPI,function(req,res,next){
		var ans = req.body.ans.toString();
		console.log(req.body);
		if(ans==""){
			return res.json({
				success:false,
				error:true,
				alert:true,
				message:"Answer field cannot be empty"
			});
		}
		if(!(/^[a-zA-Z0-9 ]+$/).test(ans)){
			return res.send(500);
		}
		req.user.status.attempts++;
		req.user.save();
		Ques.findOne({quesNum:req.user.status.currentQues},function(err,ques){
			if(err || !ques){
				return res.send(500);
			}
			ques.attemptCount++;
			ques.save();
			if(ans.toUpperCase()==ques.answer.toUpperCase()){
				req.user.status.credits += ques.credits;
				if(ques.solvedCount==0){
					sendToAll("notify",req.user.profile.fullName + " just cleared level "+ques.quesNum+" for the first time.");
				}
				ques.solvedCount++;
				ques.save();
				next(); //success ... do other updations
			}else{
				var near = false;
				ques.closeAnswers.forEach(function(closeAnswer){
					closeAnswer = closeAnswer.split("\r").join("");
					console.log("|"+closeAnswer+"|    |"+ans+"|");
					if(ans.toUpperCase()==closeAnswer.toUpperCase()){
						near = true;
					}
				});
				if(near){
					return res.json({
						success:false,
						error:false,
						message:nearAnswerMessages[random(0,nearAnswerMessages.length)]
					});
				}else{
					return res.json({
						success:false,
						error:false,
						message:wrongAnswerMessages[random(0,wrongAnswerMessages.length)]
					});
				}
			}
		});
	},function(req,res){ // correct answer
			req.user.status.currentQues++;
			req.user.status.attempts = 0;
			req.user.status.lastSolveTime = new Date();
			req.user.save(function(err){
				var newRank = updateRank(req.user);
				res.json({
					success:true,
					currentQues:req.user.status.currentQues,
					rank : newRank+1,
					credits : req.user.status.credits
				});
			});
	});
}
