// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8082;
var mongoose = require('mongoose');
var mongoose_ct = require('mongoose');
var passport = require('passport');
var flash 	 = require('connect-flash');
var bcrypt	 = require('bcrypt-nodejs');
var cors 	 = require('cors');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var MemoryStore = new express.session.MemoryStore;

require('./config/passport.js')(passport); 
var LocalStrategy = require('passport-local').Strategy;

// configuration ===============================================================
//mongoose.createConnection(configDB.url); // connect to our database

Schema = mongoose.Schema; 



app.configure(function() {

	// set up our express application
	app.use(express.logger('dev')); // log every request to the console
	app.set('view engine', 'ejs'); // set up ejs for templating

	// required for passport
	/*
	app.use(express.cookieParser("*%&%$#DFDGFGFD%^%$"));
	app.use(express.session({ secret: '*%&%$#DFDGFGFD%^%$', cookie: { maxAge: 600000 } }));
	app.use(express.bodyParser());
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session
	app.use(app.router);
	*/
	//app.use(express.static('public'));
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	
	app.use(express.session({ secret: 'whatever', store: MemoryStore }));
	  //app.use(express.cookieSession({secret: 'asdf'}));
	  
	  //app.use(session({ store: new RedisStore, secret: 'keyboard cat' }));
	  app.use(passport.initialize());
	  app.use(passport.session());
	  app.use(cors());
	  app.use(app.router);
	  
	  
});



//routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log('Listening on port ' + port);

