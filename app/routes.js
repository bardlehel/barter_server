// app/routes.js
var User = require('./models/user.js');
var mongoose = require('mongoose');
var configDB = require('../config/database.js');
var conn = mongoose.createConnection(configDB.barter_url);
var BarterUser = require('./models/user.js')(conn);




module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		res.render('index.ejs'); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') }); 
		
	});

	// process the login form
	// app.post('/login', do all our passport stuff here);

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	// app.post('/signup', do all our passport stuff here);

	// =====================================
	// PROFILE SECTION =====================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	
	
	
	
	app.get('/api/get_has', function(req, res){
		
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
		}
		
		BarterUser.findOne({ 'climbtime.user_id' : req.query.user_id}, function(err, barterUser){
			if(!barterUser)
				res.json({ message: 'no user found'});
			else
				res.json(barterUser.has);
		});
		
	});
	
	app.get('/api/get_wants', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
		}
		
		BarterUser.findOne({ 'climbtime.user_id' : req.query.user_id}, function(err, barterUser){
			if(!barterUser)
				res.json({ message: 'no user found'});
			else
				res.json(barterUser.wants);
		});
	});
	
	app.get('/api/autocomplete_topic', function(req, res){
		Category.findOne({title: new RegExp('^'+ req.query.title +'$', "i")}, function(err, category) {
			res.json(category);
		});
	});
	
	app.post('/api/add_want', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
		}
		
		//get my user
		BarterUser.findOne({climbtime_user : req.user.climbtime.id}, function(err, barterUser){
			barterUser.want.push(req.query.category_id);
		});
	});
	
	app.post('/api/add_has', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
		}
		
		//get my user
		BarterUser.findOne({climbtime_user : req.user.climbtime.id}, function(err, barterUser){
			barterUser.has.push(req.query.category_id);
		});
	});
	
	app.post('/api/remove_want', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
		}
		
		//get my user
		BarterUser.findOne({climbtime_user : req.user.climbtime.id}, function(err, barterUser){
			barterUser.wants.remove(req.query.category_id);
		});
	});
	
	app.post('/api/remove_has', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
		}
		
		//get my user
		BarterUser.findOne({climbtime_user : req.user.climbtime.id}, function(err, barterUser){
			barterUser.has.remove(req.query.category_id);
		});
	});
	
	app.get('/api/get_users_who_have', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
		}
		
		//get my user
		BarterUser.find({has : req.query.category_id}, function(err, users){
			res.json(users);
		});
	});
	
	app.get('/api/get_users_who_want', isLoggedIn, function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
		}
		
		//get my user
		BarterUser.find({wants : req.query.category_id}, function(err, users){
			res.json(users);
		});
	});
	
	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true}));
		
	
	app.post('/login', passport.authenticate('climbtime-login'), 
	function(req, res) {	
		res.json({accessToken: req.session.accessToken});
	  });
	
	app.post('/api/login', passport.authenticate('climbtime-login'), 
	function(req, res) {	
		res.json({accessToken: req.session.accessToken});
	  });

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}