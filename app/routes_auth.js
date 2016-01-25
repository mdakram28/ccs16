var User = require("./models/user");

var inter = require("./interceptor");

module.exports = function(app, passport, data) {

// normal routes ===============================================================

	// show the home page (will also have our login links)
	app.get('/',function(req, res) {
		res.render('index.ejs',{message:req.flash("indexMessage")});
	});

	// PROFILE SECTION =========================
	app.get('/profile',inter.isLoggedIn, function(req, res) {
		if(req.isAdmin){
			User.find({},function(err, users) {
				var validUsers = [];
				users.forEach(function(user){
					if(user.authType=="local"){
						if(user.local.verified==true){
							validUsers.push(user);
						}
					}else{
						validUsers.push(user);
					}
				});
			    res.locals.users = validUsers;
			    res.render("profile.ejs");
			});
		}else{
			res.render('profile.ejs');
		}
	});


	//details page

	app.get('/details', function(req,res){
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
		var regNo = req.body.regNo || "";
		regNo = regNo.toUpperCase();
		var username = req.body.username;
		var fullName = req.body.fullName;
		var mobNo = req.body.mobNo;

		if(!username || !mobNo || !fullName){
			req.flash("detailsMessage","Please fill all the details.");
			return res.redirect("/details");
		}
		
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

		//var match_username = username.match(/\w{5,15}/);
		if(!(/[\w_\-@.]{5,20}/).test(username)){
			req.flash("detailsMessage","Invalid username. It can contain alphanumric characters and _ $ - . @ characters. Length should be between 5 to 20 .");
			return res.redirect("/details");
		}

		//var match_mobNo = mobNo.match(/\d{9,11}/);
		if(!(/\d{9,11}/).test(mobNo)){
			req.flash("detailsMessage","Invalid mobile Number.");
			return res.redirect("/details");
		}
		
		User.findOne({"profile.username":{ $regex : new RegExp(username, "i") }},function(err, user) {
		    if(err){
		    	req.flash("detailsMessage","Some error occurred");
		    	return res.redirect('/details');
		    };
		    if(user!=undefined && req.user._id.toString()!=user._id.toString()){
		    	req.flash("detailsMessage","Username already exists.");
		    	return res.redirect('/details');
		    };
		    console.log(user);
		    
		    req.user.profile.regNo = regNo;
			req.user.profile.username = username;
			req.user.profile.mobNo = mobNo;
			req.user.profile.fullName = fullName;
			req.user.detailsFilled = true;
			req.user.save(function(err){
				if(err){
					req.flash("detailsMessage","Some error occurred while updating user profile.");
					return res.redirect("/details");
				}
				data.leaderboard.push(req.user);
				return res.redirect("/profile");
			});
		});
	});
	// LOGOUT ==============================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get("/auth/local/verifyEmail",function(req,res,next){
		User.findOne({"local.email":req.query.email},function(err,user){
			if(err || !user){
				return res.send("Verification failed due to url error. Please try again");
			}
			if(user.authType!="local"){
				return res.send("Invalid request");
			}
			if(user.local.verified==true){
				return res.send("User already verified");
			}
			if(user.local.vrfToken != req.query.token){
				return res.send("Verification failed due to url error. Please try again");
			}
			var wasVerified = user.local.verified;
			user.local.verified = true;
			user.save(function(err){
				if(err){
					return res.send("Verification failed due to url error. Please try again");
				}
				console.log(req.user);
				if(req.isAuthenticated()){
					req.flash("detailsMessage","Email successfully verified");
					res.redirect("/details");
				}else{
					req.skipPasswordCheck = true;
					next();
					// req.flash("loginMessage","Email verified. Login to edit your details.");
					// res.redirect("/login");
				}
			});
		});
//	});
	},passport.authenticate('local-login', {
		successRedirect : '/details', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

	// locally --------------------------------
		// LOGIN ===============================
		// show the login form
		app.get('/login', function(req, res) {
			res.render('login.ejs', { message: req.flash('loginMessage') });
		});

		// process the login form
		app.post('/login', passport.authenticate('local-login', {
			successRedirect : '/profile', // redirect to the secure profile section
			failureRedirect : '/login', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

		// SIGNUP =================================
		// show the signup form
		app.get('/signup', function(req, res) {
			res.render('login.ejs', { message: req.flash('signupMessage') });
		});

		// process the signup form
		app.post('/signup', passport.authenticate('local-signup', {
			successRedirect : '/profile', // redirect to the secure profile section
			failureRedirect : '/signup', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

	// facebook -------------------------------

		// send to facebook to do the authentication
		app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

		// handle the callback after facebook has authenticated the user
		app.get('/auth/facebook/callback',
			passport.authenticate('facebook', {
				successRedirect : '/profile',
				failureRedirect : '/',
				scope:'email'
			}));

	// google ---------------------------------

		// send to google to do the authentication
		app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

		// the callback after google has authenticated the user
		app.get('/auth/google/callback',
			passport.authenticate('google', {
				successRedirect : '/profile',
				failureRedirect : '/login'
			}));
};

// route middleware to ensure user is logged in

