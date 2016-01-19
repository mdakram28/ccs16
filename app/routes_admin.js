var User = require("./models/user");
var Ques = require("./models/ques");
var inter = require("./interceptor");

module.exports = function(app, passport) {

	app.get("/admin/users",inter.isLoggedIn,inter.isAdmin,function(req,res){
		User.find({},function(err,users){
			var ret = [];
			users.forEach(function(user){
				ret.push(user);
			});
			res.json(ret);
		});
	});

  app.get("/admin/editQuestions",inter.isLoggedIn,inter.isAdmin,function(req,res){
		res.locals.message = req.flash("editQuestionsMessage");
    Ques.find({},function(err,quess){
      res.locals.quess = quess;
      res.render("quesedit");
    });
  });

	app.get("/admin/removeQuestion",inter.isLoggedIn,inter.isAdmin,function(req,res){
		var qn = parseInt(req.query.quesNum);
		Ques.findOne({quesNum:qn},function(err,ques){
			if(err){
				req.flash("editQuestionsMessage",err);
				return res.redirect("/admin/editQuestions");
			}
			ques.remove(function(err){
				if(err){
					req.flash("editQuestionsMessage",err);
					return res.redirect("/admin/editQuestions");
				}
				Ques.find({},function(err, quess) {
					if(err){
						req.flash("editQuestionsMessage",err);
						return res.redirect("/admin/editQuestions");
					}
				    quess.forEach(function(ques){
				    	if(ques.quesNum>qn){
				    		ques.quesNum--;
				    		ques.save();
				    	}
				    });
				    req.flash("editQuestionsMessage","Delete Successful");
					return res.redirect("/admin/editQuestions")
				});
				
			});
		});
	});


  app.post("/admin/addQuestion",inter.isLoggedIn,inter.isAdmin,function(req,res,next){
    Ques.find({},function(err,quess){
			if(err){
				return res.redirect("/admin/editQuestions");
			}
      res.locals.quess = quess;
			req.quess = quess;
			next();
    });
  },function(req,res,next){
		var qn;
		if(req.body.quesNum!=''){
			qn = parseInt(req.body.quesNum);
			if(qn>((req.quess.length||0)+1)){
				qn = (req.quess.length||0)+1;
			}
		}else{
			qn = (req.quess.length||0)+1;
		}
		console.log(qn);

		req.quess.forEach(function(ques){
			if(ques.quesNum>=qn){
				ques.quesNum++;
				ques.save();
			}
		});


		var ques = new Ques();
		ques.quesNum = qn;
		ques.ques = req.body.ques;
		ques.answer = req.body.answer;
		ques.hint = req.body.hint;
		ques.story = req.body.story;
		ques.closeAnswers = req.body.closeAnswers.split("\n");
				console.log(ques);
		ques.save(function(err){
			if(err){
				req.flash("editQuestionsMessage",err);
				return res.redirect("/admin/editQuestions");
			}
			next();
		});
	},function(req,res){
		req.flash("editQuestionsMessage","Question successfully added");
		res.redirect("/admin/editQuestions");
	});
}
