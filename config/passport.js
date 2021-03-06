// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var uuid = require('node-uuid');
var bcrypt = require('bcrypt-nodejs');


// load up the user model
var mongoose = require('mongoose');
var configDB = require('./database.js');
var climbtimeConn = mongoose.createConnection(configDB.climbtime_url).on('error', function (err) {
	console.log(err);
});
var barterConn = mongoose.createConnection(configDB.barter_url);
var User = require('../app/models/user.js')(barterConn);
var ClimbtimeUser = require('../app/models/climbtimeuser.js')(climbtimeConn);

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
    	console.log('deserealizing id:' + id);
        ClimbtimeUser.findOne({_id : id.toString()}, function(err, user) {
        	done(err, user);
        });
    });
    
    passport.use('facebook-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
		var facebookId = email;
    	console.log('facebookid = ' + facebookId);
    	// find a user whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists
        User.findOne({ 'facebook.id' :  facebookId }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
            {
            	console.log('error finding user');
                return done(err);
            }
            // if no user is found, create the user
            if (!user) {
            	user = new User();
            	user.facebook.id = String(facebookId);
            	user.facebook.token = String(facebookAccessToken);
            }
            
			console.log('saving session variables in passport login');
            req.session.accessToken = uuid.v1();
            req.session.facebookId = String(facebookId);
            user.save();
            console.log("facebookid = " + req.session.facebookId);
            
            return done(null, user);
        });
        
    }));


 	// =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

		// find a user whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error
            if (err)
           	{
                return done(err);
            }
            // check to see if theres already a user with that email
            if (user) {
            	
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {

				// if there is no user with that email
                // create the user
                var newUser            = new User();

                // set the user's local credentials
                newUser.local.email    = email;
                newUser.local.password = newUser.generateHash(password);

				// save the user
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
                
            }

        });    

        });

    }));
    
    passport.use('climbtime-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, facebookId, password, done) { // callback with email and password from our form
    	console.log('hello there: facebookid = ' + facebookId);
    	// find a usUer whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists
        User.findOne({ 'facebook.id' :  facebookId }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
            {
            	console.log('error finding user');
                return done(err);
            }
            // if no user is found, create user
            if (!user) {
            	
            	user = new User();
            	user.facebook.id = facebookId;
            	user.creation_date = new Date();
            	user.save();
            	console.log('created new user:' + facebookId);
            }
            else {
            	console.log('user found...');
            }
            
            req.session.facebookId = facebookId;
            
            // all is well, return successful user
            req.session.accessToken = uuid.v1();
            console.log(req.session.facebookId);
            
            return done(null, user);
        });
        
    }));
    


    
    
};
