var User = require("./models/user");
var inter = require("./interceptor");
var Ques = require("./models/ques");

var leaderBoard = [];

function updateRanks(){
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

module.exports = function(app,passport){
	app.get("/game",inter.isLoggedIn,function(req,res){
		res.render("question");
	});

	app.get("/api/currentQuestion",inter.isLoggedInAPI,function(req,res){
		Ques.findOne({quesNum:req.user.status.currentQues},function(err,ques){
			if(err || !ques){
				return res.send(500);
			}
			console.log(ques);
			return res.json({
				story : ques.story,
				ques : ques.ques
			});
		});
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
			if(req.user.status.currentQues==req.data.totalQuestions+1){
				return res.send("Game ended");
			}
			req.user.save();
			res.json({
				success:true
			});
	});
}
