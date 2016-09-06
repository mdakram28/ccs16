var User = require("./models/user");
var inter = require("./interceptor");
var Ques = require("./models/ques");
var jwt = require('jsonwebtoken');

function random(lower,upper){
	return lower+Math.floor(Math.random()*(upper-lower));
}

module.exports = function(app,passport){

	app.get("/test/:category",inter.isLoggedIn,function(req,res){
		var category = req.params.category.toString();
		if(Ques.schema.path("category").enumValues.indexOf(category)==-1){
			return res.sendStatus(500);
		}
		res.locals.category = category.substr(0,1).toUpperCase() + category.substr(1);
		res.locals.user = req.user;
		res.render("question");
	});

	app.get("/api/allQuestions/:category",inter.isLoggedInAPI,function(req,res){
		var category = req.params.category.toString();
		console.log(Ques.schema.path("category").enumValues,category);
		if(Ques.schema.path("category").enumValues.indexOf(category)==-1){
			return res.send(500);
		}
		Ques.find({category : category},function(err,ques){
			if(err || !ques){
				return res.send(500);
			}
			ques.forEach(function(q){
				q.answer = undefined;
				if(req.user.attempts && req.user.attempts[q._id.toString()]){
					q.attempt = req.user.attempts[q._id.toString()].ans;
				}else{
					q.attempt = "";
				}
			});
			console.log(ques);
			return res.json(ques);
		});
	});

	app.post("/api/attempt",inter.isLoggedInAPI,function(req,res,next){
		if(req.user.completed)return res.send(500);
		var ans = req.body.ans.toString();
		var qid = req.body.qid.toString();
		console.log(req.body);
		if(!(/^[a-zA-Z0-9 ]+$/).test(ans)){
			return res.sendStatus(500);
		}
		Ques.findOne({_id: qid},function(err,ques){
			if(err || !ques){
				return res.sendStatus(500);
			}
			req.ques = ques;
			req.ans = ans;
			next();
		});
	},function(req,res){
		if(req.user.attempts==undefined)req.user.attempts = {};
			req.user.attempts[req.ques._id.toString()] = {
			ans : req.ans,
			time : new Date()
		};
		//req.user.attempts = {};
		req.user.markModified("attempts");
		console.log(req.user);
		req.user.save(function(err){
			if(err)throw err;
			res.send(200);
		});
	});
}
