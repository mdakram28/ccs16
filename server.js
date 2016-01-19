// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var path = require("path");

var inter = require("./app/interceptor");

var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

app.configure(function() {
	app.use(express.static(path.join(__dirname, 'public')));

	// set up our express application
	app.use(express.logger('dev')); // log every request to the console
	app.use(express.cookieParser()); // read cookies (needed for auth)
	app.use(express.bodyParser()); // get information from html forms

	app.set('view engine', 'ejs'); // set up ejs for templating
	app.set('json spaces', 4);

	// required for passport
	app.use(express.session({ secret: 'u4y5gbj0i987tcr54ewzx65' })); // session secret
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session
	app.use(function(req,res,next){
		res.locals.user = req.user;
		res.locals.isAuthenticated = req.isAuthenticated();
		next();
	});
	
	app.use(inter.allRequests);
});

// routes ======================================================================
require('./app/routes_auth.js')(app, passport); // load our routes and pass in our app and fully configured passport
require('./app/routes_admin.js')(app, passport);

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
