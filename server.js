// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8083;
var passport = require('passport');
var cors 	 = require('cors');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var dbConfig = require('./config/database.js');
var redisUrl   = require("url").parse(dbConfig.redis_url),
    redisAuth = redisUrl.auth.split(':'); ;


// configuration ===============================================================

//app.use(express.logger('dev')); // log every request to the console
app.set('view engine', 'ejs'); // set up ejs for templating
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
            secret: 'asfdfasdf234e23432',
            //name: cookie_name,
            store: new RedisStore({
                host: redisUrl.host,
                //port: redisUrl.port,
                db: 0,
                pass: '35a5a60f5b75d1fa46b1d798ffa4e46b'
            })//, // connect-mongo session store
            //proxy: true,
            //resave: true,
            //saveUninitialized: true
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
