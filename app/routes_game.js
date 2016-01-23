var User = require("./models/user");
var inter = require("./interceptor");
var Ques = require("./models/ques");

//var leaderboard = [];
var data;

function move(oldIndex,newIndex){
	console.log("moving",oldIndex,newIndex);
	data.leaderboard.splice(newIndex,0,data.leaderboard.splice(oldIndex,1)[0]);
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

module.exports = function(app,passport,data2){
	data = data2;
	app.get("/game",inter.isLoggedIn,function(req,res){
		res.render("question");
	});
	
	app.get("/api/getRank",inter.isLoggedInAPI,function(req,res){
		User.find({},function(err,users){
			for(var i=0;i<users.length;i++){
				if(users.profile.username==req.user.profile.username){
					
				}
			}
		});
	});

	app.get("/api/currentQuestion",inter.isLoggedInAPI,function(req,res){
		Ques.findOne({quesNum:req.user.status.currentQues},function(err,ques){
			if(err || !ques){
				return res.send(500);
			}
			console.log(ques);
			return res.json({
				quesNum : ques.quesNum,
				story : ques.story,
				ques : ques.ques
			});
		});
	});
	
	app.get("/api/reset",inter.isLoggedIn,function(req,res){
		req.user.status.currentQues = 1;
		req.user.status.credits = 0;
		req.user.status.lastSolvedTime = undefined;
		req.user.save(function(err){
			inter.refreshLeaderboard();
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
			if(ans.toUpperCase()==ques.answer.toUpperCase()){
				req.user.status.credits += ques.credits;
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
				updateRank(req.user);
			});
			res.json({
				success:true,
				currentQues:req.user.status.currentQues
			});
	});
}
