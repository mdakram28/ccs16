var User = require("./models/user");

var inter = require("./interceptor");

module.exports = function(app, passport, data) {

	app.get('/',function(req, res) {
		if(req.isAuthenticated()){
			return res.redirect('/profile');
		}
		return res.render('index.ejs',{message:req.flash("loginMessage")});
	});

	app.get('/profile',inter.isLoggedIn, function(req, res) {
		res.locals.active = "profile";
		if(req.isAdmin){
			User.find({},function(err, users) {
				res.locals.users = users;
				res.render("profile.ejs");
			});
		}else{
			res.render('profile.ejs');
		}
	});

	app.get('/details', function(req,res){
		res.locals.active = "details";
		if(!req.isAuthenticated()){
			return res.redirect('/');
		}
		res.locals.user = req.user;
		res.render("details",{message:req.flash("detailsMessage")});
	});

	app.post('/details', function(req,res){
		if(!req.isAuthenticated()){
			return res.redirect('/');
		}
		var regNo = req.body.regNo;
		var fullName = req.body.fullName;
		var mobNo = req.body.mobNo;
		var projects = req.body.projects;
		var experience = req.body.experience;

		if(!regNo || !mobNo || !fullName || !projects || !experience){
			req.flash("detailsMessage","Please fill all the details.");
			return res.redirect("/details");
		}

		regNo = regNo.toString().toUpperCase();
		fullName = fullName.toString();
		mobNo = mobNo.toString();
		projects = projects.toString();
		experience = experience.toString();

		if(!(/^[a-zA-Z ]+$/).test(fullName)){
			req.flash("detailsMessage","Invalid Name , Name cannot contain characters.");
			return res.redirect("/details");
		}
		//console.log("15BIT1234".match(/\d{2}\w{3}\d{4}/));
		//var match_regNo = regNo.match(/\d{2}\w{3}\d{4}/);
		if( regNo!="" && !(/\d{2}\w{3}\d{4}/).test(regNo)){
			req.flash("detailsMessage","Invalid registration number. It should be in the format 15BIT1234.");
			return res.redirect("/details");
		}

		//var match_mobNo = mobNo.match(/\d{9,11}/);
		if(!(/\d{9,11}/).test(mobNo)){
			req.flash("detailsMessage","Invalid mobile Number.");
			return res.redirect("/details");
		}
			req.user.details.regNo = regNo;
			req.user.details.mobNo = mobNo;
			req.user.details.fullName = fullName;
			req.user.details.experience = experience;
			req.user.details.projects = projects;
			req.user.detailsFilled = true;
			req.user.save(function(err){
				if(err){
					req.flash("detailsMessage","Some error occurred while updating user profile.");
					return res.redirect("/details");
				}
				return res.redirect("/profile");
			});
	});

	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

	app.post("/auth/adminLogin",function(req,res,next){
		req.body.email = "MOHDAKRAM.ANSARI2015@VIT.AC.IN";
		req.body.password = "78945";
		next();
	}, passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	app.get('/auth/google/callback',
	passport.authenticate('google', {
		successRedirect : '/profile',
		failureRedirect : '/'
	}));
};
