// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8082;
var passport = require('passport');
var bcrypt	 = require('bcrypt-nodejs');
var cors 	 = require('cors');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');


// configuration ===============================================================

//app.use(express.logger('dev')); // log every request to the console
app.set('view engine', 'ejs'); // set up ejs for templating
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
            secret: 'asfdfasdf234e23432',
            //name: cookie_name,
            //store: sessionStore, // connect-mongo session store
            //proxy: true,
            resave: true,
            saveUninitialized: true
    }));
app.use(passport.initialize());
//app.use(passport.session());
app.use(cors());


//routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log('Listening on port ' + port);


//export the app (for testing)
module.exports.app = app;
