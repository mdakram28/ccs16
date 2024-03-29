// server.js

// set up ======================================================================
// get all the tools we need
var serverConfig = require("./serverFiles/config");
var express  = require('express');
var app      = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.io = io;
var port     = process.env.PORT || serverConfig.port;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var path = require("path");
var data = require("./app/data");

var inter = require("./app/interceptor").init(data);

var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database
mongoose.connection.on('connected', inter.dbStart);

require('./config/passport')(passport,data); // pass passport for configuration

app.configure(function() {
	app.use(express.static(path.join(__dirname, 'public')));

	// set up our express application
	app.use(express.logger('dev')); // log every request to the console
	app.use(express.cookieParser()); // read cookies (needed for auth)
	app.use(express.bodyParser()); // get information from html forms

	app.set('view engine', 'ejs'); // set up ejs for templating
	app.set('json spaces', 4);

	// required for passport
	app.use(express.session({ secret: '<REDACTED>' })); // session secret
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
require('./app/routes_auth.js')(app, passport, data); // load our routes and pass in our app and fully configured passport
require('./app/routes_admin.js')(app, passport);
require('./app/routes_game.js')(app, passport, data);

// launch ======================================================================
http.listen(port);
console.log('The magic happens on port ' + port);
