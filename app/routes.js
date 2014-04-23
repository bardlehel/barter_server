// app/routes.js
var User = require('./models/user.js');
var mongoose = require('mongoose');
var configDB = require('../config/database.js');
var barterConn = mongoose.createConnection(configDB.barter_url);
var climbtimeConn = mongoose.createConnection(configDB.climbtime_url);
var BarterUser = require('./models/user.js')(barterConn);
var Category = require('./models/category.js')(climbtimeConn);





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
			return;
		}
		
		console.log('req.user = ' + req.user);
		console.log('req.isAuthenticated = ' + req.isAuthenticated());
		console.log('req.session = '+ req.session);
		
		BarterUser.findOne({ 'climbtime.user_id' : req.query.user_id}, function(err, user){
			if(!user)
				res.json({ message: 'no user found'});
			else
				res.json(user.has);
		});
		
	});
	
	app.get('/api/get_wants', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
			return;
		}
		
		BarterUser.findOne({ 'climbtime.user_id' : req.query.user_id}, function(err, barterUser){
			if(!barterUser)
				res.json({ message: 'no user found'});
			else
				res.json(barterUser.wants);
		});
	});
	
	app.get('/api/autocomplete_topic', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
			return;
		}
		
		Category.findOne({title: new RegExp('^'+ req.query.title +'$', "i")}, function(err, category) {
			res.json(category);
		});
	});
	
	app.get('/api/get_topic_by_title', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
			return;
		}
		
		Category.findOne({title: req.query.title}, function(err, category) {
			
			if(!category) {//create it 
				category = new Category({title: req.query.title});
				category.save();
			}
			res.json(category);
		});
	});
	
	app.get('/api/add_want', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			console.log('supplied:' + req.query.accessToken);
			console.log('stored:' + req.session.accessToken);
			res.json({result: 'failure', reason: 'incorrect access token'});
			return;
		}
		
		
		console.log('req.user = ' + req.user);
		
		//get my user
		BarterUser.findOne({'climbtime.user_id' : req.user.id}, function(err, user){
			
			console.log('user.wants.length='+ user.wants.length);
			for(var i = 0; i != user.wants.length; i++) {
				if(user.wants[i]._id == req.query.category_id) {
					res.json({result: 'failure', reason: 'topic already added to wants list'});
					return;
				}
			}
			console.log('test2');
			//if(user.wants.indexOf(req.query.category_id) > -1)
			//	return;
			
			user.wants.push(req.query.category_id);
			user.save();
			
			res.json({result: 'success'});
			
		});
	});
	
	app.get('/api/add_has', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
		}
		
		//get my user
		BarterUser.findOne({'climbtime.user_id' : req.user.id}, function(err, barterUser){
			
			if(barterUser.has.indexOf(req.query.category_id) > -1)
				return;
			
			barterUser.has.push(req.query.category_id);
			barterUser.save();
		});
	});
	
	app.post('/api/remove_want', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
		}
		
		//get my user
		BarterUser.findOne({'climbtime.user_id' : req.user.climbtime.id}, function(err, barterUser){
			barterUser.wants.remove(req.query.category_id);
			barterUser.save();
		});
	});
	
	app.post('/api/remove_has', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
		}
		
		//get my user
		BarterUser.findOne({'climbtime.user_id' : req.user.climbtime.id}, function(err, barterUser){
			barterUser.has.remove(req.query.category_id);
			barterUser.save();
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
			return;
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
		console.log('req.user = ' + req.user);
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