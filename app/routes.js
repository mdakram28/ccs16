var User = require("./models/user");

module.exports = function(app, passport) {

// normal routes ===============================================================

	// show the home page (will also have our login links)
	app.get('/',function(req, res) {
		res.render('index.ejs',{message:req.flash("indexMessage")});
	});

	// PROFILE SECTION =========================
	app.get('/profile',isLoggedIn, function(req, res) {
		res.render('profile.ejs');
	});

	///removeAccount
	app.get('/removeAccount',isLoggedIn,function(req,res){
		User.findOne({_id:req.user._id}).remove(function(err){
			if(err){
				return res.send("Some error occurred");
			}
			req.flash("indexMessage","Account removed");
			res.redirect("/");
		});

	});

	app.get("/users",isLoggedIn,function(req,res){
		if(req.user.local.email!="MDAKRAM28@GMAIL.COM"){
			return res.json("Unauthorized");
		}
		User.find({},function(err,users){
			var ret = [];
			users.forEach(function(user){
				ret.push(user);
			});
			res.json(ret);
		});
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
		var regNo = req.body.regNo.toUpperCase();
		var username = req.body.username;
		var mobNo = req.body.mobNo;

		if(!regNo || !username || !mobNo){
			req.flash("detailsMessage","Please fill all the details.");
			return res.redirect("/details");
		}
		//console.log("15BIT1234".match(/\d{2}\w{3}\d{4}/));
		//var match_regNo = regNo.match(/\d{2}\w{3}\d{4}/);
		if(!(/\d{2}\w{3}\d{4}/).test(regNo)){
			req.flash("detailsMessage","Invalid registration number. It should be in the format 15BIT1234.");
			return res.redirect("/details");
		}

		//var match_username = username.match(/\w{5,15}/);
		if(!(/\w{5,15}/).test(username)){
			req.flash("detailsMessage","Invalid username. It should be in the format /\\w{5,15}/ .");
			return res.redirect("/details");
		}

		//var match_mobNo = mobNo.match(/\d{9,11}/);
		if(!(/\d{9,11}/).test(mobNo)){
			req.flash("detailsMessage","Invalid mobile Number. It should be in the format /\\d{9,11}/.");
			return res.redirect("/details");
		}
		req.user.profile.regNo = regNo;
		req.user.profile.username = username;
		req.user.profile.mobNo = mobNo;
		req.user.detailsFilled = true;
		req.user.save(function(err){
			if(err){
				req.flash("detailsMessage","Some error occurred while updatin user profile.");
				return res.redirect("/details");
			}
			return res.redirect("/profile");
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
			if(user.local.vrfToken != req.query.token){
				return res.send("Verification failed due to url error. Please try again");
			}
			user.local.verified = true;
			user.save(function(err){
				if(err){
					return res.send("Verification failed due to url error. Please try again");
				}
				if(req.isAuthenticated()){
					req.flash("detailsMessage","Email successfully verified");
					res.redirect("/details");
				}else{
					req.flash("loginMessage","Email verified. Login to edit your details.");
					res.redirect("/login");
				}
			});
		});
	});
	// },passport.authenticate('local-login', {
	// 	successRedirect : '/details', // redirect to the secure profile section
	// 	failureRedirect : '/login', // redirect back to the signup page if there is an error
	// 	failureFlash : true // allow flash messages
	// }));

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
				failureRedirect : '/'
			}));
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/login');
	if(!req.user.detailsFilled){
		return res.redirect('/details');
	}
	var userInfo = {
		username : req.user.profile.username,
		regNo : req.user.profile.regNo,
		mobNo : req.user.profile.mobNo,
		authType : req.user.authType
	}
	if(userInfo.authType=="local"){
		userInfo.email = req.user.local.email;
		userInfo.password = req.user.local.password;
	}else if(userInfo.authType=="facebook"){
		userInfo.email = req.user.facebook.email;
		userInfo.password = req.user.facebook.token;
	}else if(userInfo.authType=="twitter"){
		userInfo.email = "";
		userInfo.password = req.user.twitter.token;
	}else if(userInfo.authType=="google"){
		userInfo.email = req.user.google.email;
		userInfo.password = req.user.google.token;
	}
	req.userInfo = userInfo;
	res.locals.userInfo = userInfo;
	next();
}