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
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');


require('./config/passport.js')(passport); 
var LocalStrategy = require('passport-local').Strategy;

// configuration ===============================================================
//mongoose.createConnection(configDB.url); // connect to our database

//Schema = mongoose.Schema; 

//app.use(express.logger('dev')); // log every request to the console
app.set('view engine', 'ejs'); // set up ejs for templating
app.use(cookieParser());
app.use(bodyParser());
app.use(session({ secret: 'asfdfasdf234e23432' }));
app.use(passport.initialize());
//app.use(passport.session());
app.use(cors());


//routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log('Listening on port ' + port);

