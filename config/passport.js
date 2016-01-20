// load all the things we need
var serverConfig = require("../serverFiles/config");
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;
var randtoken = require('rand-token');

var fs = require("fs");

var vrfEmailFormat = fs.readFileSync("./config/verification_email_format.txt",'utf8');

var nodemailer = require('nodemailer');
 
var mandrillTransport = require('nodemailer-mandrill-transport');
 
var transport = nodemailer.createTransport(mandrillTransport({
  auth: {
    apiKey: 'VlebD23ANBQI0q6TzKdx2Q'
  }
}));




// load up the user model
var User       = require('../app/models/user');

// load the auth variables
var configAuth = require('./auth'); // use this one for testing

function verifyCred(email,password){
  	var match_email = (/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i).test(email);
  	console.log(match_email);
		if(!match_email){
		  return "email";
		}
		var match_pass = (/^.{5,20}/).test(password);
		if(!match_pass){
		  return "password";
		}
		return false;
}

module.exports = function(passport) {

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use('local-login', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
  },
  function(req, email, password, done) {
    email = email.toUpperCase();

    // asynchronous
    process.nextTick(function() {
      User.findOne({ 'local.email' :  email }, function(err, user) {
        // if there are any errors, return the error
        if (err)
        return done(err);

        // if no user is found, return the message
        if (!user)
        return done(null, false, req.flash('loginMessage', 'No user found.'));

        if (!user.validPassword(password) && !req.skipPasswordCheck)
        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

        if(user.local.verified==false){
          return done(null, false, req.flash('loginMessage', 'Email not verified.'));
        }
        // all is well, return user
        else
        return done(null, user);
      });
    });

  }));

  passport.use('local-signup', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
  },
  function(req, email, password, done) {
    if(password != req.body.password2){
      return done(null,false,req.flash("signupMessage","Passwords dont match"));
    }
    email = email.toUpperCase();
    
    // asynchronous
    process.nextTick(function() {
      
    var verify = verifyCred(email,password);
    if(verify=="email"){
      return done(null,false,req.flash("signupMessage","Invalid email address"));
    }else if(verify=="password"){
      return done(null,false,req.flash("signupMessage","Password must be of length 5 - 20"));
    }
      //  Whether we're signing up or connecting an account, we'll need
      //  to know if the email address is in use.
      User.findOne({'local.email': email}, function(err, existingUser) {

        // if there are any errors, return the error
        if (err)
        return done(err);

        // check to see if there's already a user with that email
        if (existingUser){
          console.log(existingUser);
          if(existingUser.local.verified==true){
            return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
          }else{
            User.findOne({"local.email":email}).remove().exec();
          }
        }

        var newUser            = new User();

        newUser.local.email    = email.toUpperCase();
        newUser.local.vrfToken = randtoken.generate(50);
        newUser.local.password = newUser.generateHash(password);
        newUser.local.verified = false;
        newUser.authType = "local";

        newUser.save(function(err) {
          if (err)
          throw err;

          // server.send({
          //   text:    "https://riddler-mdakram28.c9users.io/auth/local/verifyEmail?email="+encodeURIComponent(email)+"&token="+encodeURIComponent(newUser.local.vrfToken),
          //   from:    "riddler <mdakram28@gmail.com>",
          //   to:      "RiddlerUser <"+email+">",
          //   subject: "Riddler email verification",
          //   attachment:
          //   [
          //     {data:"<html>Click link below to verify your riddler account.<br/><a href='https://riddler-mdakram28.c9users.io/auth/local/verifyEmail?email="+encodeURIComponent(email)+"&token="+encodeURIComponent(newUser.local.vrfToken)+"'>Verify my mail</a></html>", alternative:true}
          //   ]
          // }, function(err, message) { console.log(err || message); });
          var verLink = serverConfig.domain+"/auth/local/verifyEmail?email="+encodeURIComponent(email)+"&token="+encodeURIComponent(newUser.local.vrfToken);
          console.log(verLink);
          var emailHtml = "<html>Click here to verify : <a href=\""+verLink+"\">Verify my email</a></html>";
          console.log(emailHtml);
          transport.sendMail({
             //text:    emailHtml, 
             from:    "riddler <riddler@csivit.com>", 
            to:      "RiddlerUser <"+email+">",
             subject: "Riddler email verification",
             html:vrfEmailFormat.split("{{link}}").join(verLink)
            // attachment:
            // [
            //   {data:emailHtml, alternative:true}
            // ]
          }, function(err, message) { 
            
          //console.log(vrfEmailFormat);
            //console.log(err || message); 
            
          });

          return done(null, false, req.flash('signupMessage', 'Verification email is sent. If not sent then re-register to resend email.'));
        });

      });
    });

  }));

  passport.use(new FacebookStrategy({

    clientID        : configAuth.facebookAuth.clientID,
    clientSecret    : configAuth.facebookAuth.clientSecret,
    callbackURL     : configAuth.facebookAuth.callbackURL,
    passReqToCallback : true, // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    profileFields: ['id', 'emails', 'name']
  },
  function(req, token, refreshToken, profile, done) {

    // asynchronous
    process.nextTick(function() {

      // check if the user is already logged in
      if (!req.user) {

        User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
          if (err)
          return done(err);

          if (user) {

            // if there is a user id already but no token (user was linked at one point and then removed)
            if (!user.facebook.token) {
              user.facebook.token = token;
              user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
              if(profile.emails!=undefined && profile.emails[0]!=undefined){
                user.facebook.email = profile.emails[0].value;
              }else{
                user.facebook.email = "NAN";
              }
              

              user.save(function(err) {
                if (err)
                throw err;
                return done(null, user);
              });
            }

            return done(null, user); // user found, return that user
          } else {
            // if there is no user, create them
            var newUser            = new User();

            newUser.facebook.id    = profile.id;
            newUser.facebook.token = token;
            newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
            console.log(profile);
            if(profile.emails!=undefined && profile.emails[0]!=undefined){
                newUser.facebook.email = profile.emails[0].value;
              }else{
                newUser.facebook.email = "NAN";
              }
            newUser.authType = "facebook";

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
  passport.use(new GoogleStrategy({

    clientID        : configAuth.googleAuth.clientID,
    clientSecret    : configAuth.googleAuth.clientSecret,
    callbackURL     : configAuth.googleAuth.callbackURL,
    passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

  },
  function(req, token, refreshToken, profile, done) {

    // asynchronous
    process.nextTick(function() {

      // check if the user is already logged in
      if (!req.user) {

        User.findOne({ 'google.id' : profile.id }, function(err, user) {
          if (err)
          return done(err);

          if (user) {

            // if there is a user id already but no token (user was linked at one point and then removed)
            if (!user.google.token) {
              user.google.token = token;
              user.google.name  = profile.displayName;
              user.google.email = profile.emails[0].value; // pull the first email

              user.save(function(err) {
                if (err)
                throw err;
                return done(null, user);
              });
            }

            return done(null, user);
          } else {
            var newUser          = new User();

            newUser.google.id    = profile.id;
            newUser.google.token = token;
            newUser.google.name  = profile.displayName;
            newUser.google.email = profile.emails[0].value; // pull the first email
            newUser.authType = "google";

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
};
