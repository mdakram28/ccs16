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

	app.get("/admin/user/:userId",inter.isLoggedIn,inter.isAdmin,function(req,res){
		User.findOne({_id:req.params.userId},function(err,user){
			if(err)return res.send(500);
			if(!user)return res.send("User not found");
			res.locals.u = user;
			Ques.find({},function(err,quess){
				if(err || !quess){
					return res.send(500);
				}
				var quessCat = {};
				res.locals.categories.forEach(function(cat){
					quessCat[cat] = [];
					console.log(cat);
					quess.forEach(function(ques){
						if(ques.category == cat && user.attempts[ques._id.toString()]){
							ques.answer = user.attempts[ques._id.toString()];
							//console.log(ques.answer);
							quessCat[cat].push(ques);
						}
					});
					// quessCat[cat].sort(function(q1,q2){
					// 	return q1.qno < q2.qno;
					// });
				});
				res.locals.quessCat = quessCat;
				res.render("userDetails",{
					message : req.flash("message")
				});
			});
		});
	});

	app.get('/admin/submissions',inter.isLoggedIn,inter.isAdmin,function(req,res){
		User.find({},function(err,users){
			res.locals.users = users;
			Ques.find({},function(err,quess){
				res.locals.quess = quess;
				var quessCat = {};
				res.locals.categories.forEach(function(cat){
					quessCat[cat] = [];
					quess.forEach(function(ques){
						//console.log(ques,cat);
						if(ques.category == cat){
							quessCat[cat].push(ques);
						}
					});
				});
				res.locals.quessCat = quessCat;
				console.log(quessCat);
				res.render("submissions",{
					message : req.flash("message")
				});
			});
		});
	});

	///removeAccount
	app.get('/admin/removeAccount',inter.isLoggedInAPI,function(req,res){
		var id = req.query.id;
		if(!id){
			return res.send(500);
		}

		User.findOne({_id:id},function(err,user){
			if(err){
				return res.send("Some error occurred");
			}
			if(!user){
				return res.send("User not found");
			}
			user.remove(function(err){
				if(err){
					return res.send("Some error occurred");
				}
				return res.send("User removed");
			});
		});
	});

  app.get("/admin/editQuestions",inter.isLoggedIn,inter.isAdmin,function(req,res){
		res.locals.message = req.flash("editQuestionsMessage");
    Ques.find({},function(err,quess){
      res.locals.quess = quess;
	  res.locals.categories = Ques.schema.path("category").enumValues;
      res.render("quesedit");
    });
  });

	app.get("/admin/removeQuestion",inter.isLoggedIn,inter.isAdmin,function(req,res){
		var qid = req.query.qid;
		Ques.findOne({_id:qid},function(err,ques){
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
				    quess.forEach(function(q){
				    	if(q.qno>ques.qno && q.category==ques.category){
				    		q.quesNum--;
				    		q.save();
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
		var qno;
		if(req.body.qno!=''){
			qno = parseInt(req.body.qno);
		}else{
			//qno = (req.quess.length||0)+1;
			var count = 0;
			req.quess.forEach(function(q){
				if(q.category == req.body.category){
					count++;
				}
			});
			qno = count + 1;
		}
		console.log(qno);

		req.quess.forEach(function(ques){
			if(ques.qno>=qno && ques.category==req.body.category){
				ques.qno++;
				ques.save();
			}
		});


		var ques = new Ques();
		ques.qno = qno;
		ques.ques = req.body.ques;
		ques.answer = req.body.answer;
		ques.choices = req.body.options.split("<opt>");
		ques.category = req.body.category;

		if(ques.choices.length==1 && ques.choices[0]==""){
			ques.choices = [];
		}
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
