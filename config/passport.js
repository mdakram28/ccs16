// load all the things we need
var serverConfig = require("../serverFiles/config");
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var fs = require("fs");
// load up the user model
var User = require('../app/models/user');

// load the auth variables
var configAuth = require('./auth'); // use this one for testing

module.exports = function(passport,data) {

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new GoogleStrategy({

      clientID: configAuth.googleAuth.clientID,
      clientSecret: configAuth.googleAuth.clientSecret,
      callbackURL: configAuth.googleAuth.callbackURL,
      passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {
      console.log(profile.emails[0].value);
      if (!profile.emails[0].value.toUpperCase().endsWith("@VIT.AC.IN")) {
        return done(null, false, req.flash("loginMessage", "Please use your VIT.AC.IN accounts in google login"));
      }

      // asynchronous
      process.nextTick(function() {

        // check if the user is already logged in
        if (!req.user) {

          User.findOne({
            'google.id': profile.id
          }, function(err, user) {
            if (err)
              return done(err);

            if (user) {
              return done(null, user);
            }
            else {
              var newUser = new User();

              newUser.google.id = profile.id;
              newUser.google.token = token;
              newUser.google.name = profile.displayName;
              newUser.google.email = profile.emails[0].value; // pull the first email

              newUser.save(function(err) {
                if (err)
                  throw err;
                return done(null, newUser);
              });
            }
          });
        }
      });
    }));

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
      },
      function(req, email, password, done) {
        // asynchronous
        process.nextTick(function() {
          User.findOne({
            'details.regNo': '15BIT0166'
          }, function(err, user) {
            // if there are any errors, return the error
            if (err)
              return done(err);

            // if no user is found, return the message
            if (!user)
              return done(null, false, req.flash('loginMessage', 'admin not found.'));
            else
              return done(null, user);
          });
        });

      }));
};
