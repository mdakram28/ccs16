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
			return res.render('message',{
				message : "No questions in test domain"
			});
		}
		if(req.user.giving==category){
			res.locals.category = category.substr(0,1).toUpperCase() + category.substr(1);
			res.locals.user = req.user;
			return res.render("question");
		}else if(req.user.submitted.indexOf(category)>=0){
			return res.render('message',{
				message : "Test already completed"
			});
		}else if(req.user.giving=="" || !req.user.giving){
			return res.render('message',{
				message : "Click buttton to start test <br/><small>Once you enter the test you wont be allowed to enter another test unless you submit this test.</small><br/><a class='btn btn-danger btn-lg' href='/startTest/"+category+"'>Enter test</a>"
			});
		}else{
			return res.render("message",{
				message : "Please submit the '"+req.user.giving.toUpperCase()+"' test to give this test."
			})
		}
	});

	app.get("/startTest/:category",inter.isLoggedIn,function(req,res){
		var category = req.params.category.toString();
		if(Ques.schema.path("category").enumValues.indexOf(category)==-1){
			return res.render('message',{
				message : "No questions in test domain"
			});
		}
		if(req.user.giving==category || req.user.submitted.indexOf(category)>=0){
			return res.redirect("/test/"+category);
		}else if(req.user.giving=="" || !req.user.giving){
			req.user.giving = category;
			req.user.save(function(err){
				if(err){
					return res.send(500);
				}else{
					return res.redirect("/test/"+category);
				}
			});
		}
	});

	app.get("/endTest/:category",inter.isLoggedIn,function(req,res){
		var category = req.params.category.toString();
		if(Ques.schema.path("category").enumValues.indexOf(category)==-1){
			return res.render('message',{
				message : "Test domain not found"
			});
		}
		if(req.user.giving==category){
			req.user.giving = "";
			req.user.submitted.push(category);
			req.user.save(function(err){
				if(err)return res.send(500);
				return res.render("message",{
					message : "Test ended. You may now process with other tests"
				});
			});
		}
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
			return res.json(JSON.parse(JSON.stringify(ques)));
		});
	});

	app.post("/api/attempt",inter.isLoggedInAPI,function(req,res,next){
		if(new Date().getTime() > res.locals.endTime){
			return res.send(500);
		}
		var ans = req.body.ans.toString();
		var qid = req.body.qid.toString();
		console.log(req.body);
		// if(!(/^[a-zA-Z0-9 ]+$/).test(ans)){
		// 	return res.send(500);
		// }
		Ques.findOne({_id: qid},function(err,ques){
			if(err || !ques){
				return res.send(500);
			}
			if(req.user.giving != ques.category){
				return res.send(500);
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
