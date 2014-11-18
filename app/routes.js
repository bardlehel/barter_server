// app/routes.js
var mongoose = require('mongoose');
var configDB = require('../config/database.js');
var barterConn = mongoose.createConnection(configDB.barter_url);
var climbtimeConn = mongoose.createConnection(configDB.climbtime_url);
var User = require('./models/user.js')(climbtimeConn);
var BarterUser = require('./models/user.js')(barterConn);
var Category = require('./models/category.js')(climbtimeConn);
var restClient = 
var utils = require('utils.js');



module.exports = function(app, passport) {
	
	//REST API ROUTES


	app.post('/api/login', function(request, response) {
				console.log('req.body.facebookId = ' + req.body.facebookId);
				console.log('req.body.accessToken = ' + req.body.accessToken);
				response.json({
					accessToken: req.session.accessToken, 
					facebookId: req.session.facebookId});
				request.session.facebookId = '579417488841227';
				//req.session.save();
			  });
	};


	//api/get_category: finds category id and returns it in json format or
	//	adds the category if does not exist
	//request.params:  
	//	accessToken
	//	title
	app.get('/api/get_category', function(request, result) {
		
		if(!utils.hasRouteAccess(request.query.accessToken, request, result)) return;
		if(!utils.hasParameters(request, ['title'])) return;
		
		//look up category by title
		Category.findOne({'title' : req.query.title}, function(err, category) {
			
			//category found; return the category's id
			if(category) {
				result.json({category_id : category._id});
				return;
			}
			
			//since there is no category found, create the category
			var newCategory = new Category({title: request.query.title});
			//try to save the category and return it's ID
			newCategory.save(function(error){

				if (utils.unset(error)) {
					result.json({category_id : newCategory._id});
					return;
				}
					
				result.json({result : 'failure', reason: 'could not save new category'});
			});
		});
	});
	
	//app.get('/api/create_category/)
	
		
	//api/get_haves: gets the list of 'haves' from user and returns it to user
	//query params:
	//	accessToken: token received from /api/login
	app.get('/api/get_haves', function(request, response){
		if(!utils.hasRouteAccess(request.query.accessToken, request, response)) return;
		
		BarterUser.findOne({'facebook.id' : request.session.facebookId}, function(error, user){
			if(!user) response.json({ message: 'no user found'});
			else response.json(user.has);
		});
	});
	

	//api/get_wants: gets the list of 'wants' from user
	//query params:
	//	accessToken: token received from /api/login	
	app.get('/api/get_wants', function(request, response){	
		if(!utils.hasRouteAccess(request.query.accessToken, request, response)) return;
		
		BarterUser.findOne({ 'facebook.id' : request.session.facebookId}, function(error, user){
			if(!user) response.json({ message: 'no user found'});
			else response.json(user.wants);
		});
	});

	//api/get_user: gets the user's data
	//remarks: uses facebook id from session
	//query params:
	//	accessToken: token received from /api/login
	app.get('/api/get_user', function(request, response){	
		if(!utils.hasRouteAccess(request.query.accessToken, request, response)) return;
		
		BarterUser.findOne({'facebook.id' : req.session.facebookId}, function(err, barterUser){
			if(!barterUser) res.json({ error: true, message: 'no user found'});
			else res.json(barterUser);
		});
	});
	
	//api/get_numbers: gets the number of wants and haves for user
	//query params:
	//	accessToken: token received from api/login
	app.get('/api/get_numbers', function(request, response) {
		if(!utils.hasRouteAccess(request.query.accessToken, request, response)) return;
		
		BarterUser.findOne({ 'facebook.id' : req.session.facebookId}, function(error, barterUser){
			var wantsLength = 0;
			var havesLength = 0;			

			if(!barterUser) {
				res.json({ error: true, message: 'no user found'});
				return;
			}
			
			//get the number of wants and haves	
			if(typeof barterUser.wants != 'undefined')
				wantsLength = barterUser.wants.length;
			if(typeof barterUser.haves != 'undefined')
				havesLength = barterUser.haves.length;
			
			res.json({
				wants: wantsLength,
				haves: havesLength
			});
			
		});
	});

	
	//api/autocomplete_topic: gets topic/category auto-completed titles  from string 
	//query params:
	//	title: string to lookup parts of category titles
	app.get('/api/autocomplete_topic', function(request, response){
		
		Category.findOne({title: new RegExp('^'+ req.query.title +'$', "i")}, function(error, category) {
			response.json(category);
		});
	});
	
	//api/get_topic_by_title:  returns a topic from category collection, or new category if not found
	//query params:
	//	accessToken: token received from api/login
	//	title: title of the topic/category
	app.get('/api/get_topic_by_title', function(request, response) {
		if(!utils.hasRouteAccess(request.query.accessToken, request, response)) return;
		
		Category.findOne({title: request.query.title}, function(error, category) {
			
			if(!category) {
				//create new category if category doesn't exist 
				category = new Category({title: request.query.title});
				category.save();
			}
			
			response.json(category);
		});
	});
	
	//api/add_want: adds a 'want' to the list of 'wants' of the user
	//query params:
	//	accessToken: token received from api/login
	//	category_id: id of the topic/category to be added to 'wants' list
	app.post('/api/add_want', function(request, response) {	
		if(!utils.hasRouteAccess(request.query.accessToken, request, response)) return;
		
		BarterUser.findOne({'facebook.id' : req.session.facebookId}, function(error, user){
			//don't duplicate
			if(user.hasWant(req.query.category_id)) return;
			
			user.wants.push(req.query.category_id);
			user.save();
			
			res.json({result: 'success'});
		});
	});
	
	app.post('/api/add_has', function(req, res){
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
	
	app.delete('/api/remove_want', function(req, res){
		if (req.query.accessToken != req.session.accessToken) {
			res.json({result: 'failure', reason: 'incorrect access token'});
		}
		
		//get my user
		BarterUser.findOne({'climbtime.user_id' : req.user.climbtime.id}, function(err, barterUser){
			barterUser.wants.remove(req.query.category_id);
			barterUser.save();
		});
	});
	
	app.delete('/api/remove_has', function(req, res){
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



	//WEBSITE ROUTES
	
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

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true}));
		
	
	app.post('/login', passport.authenticate('climbtime-login'), 
	function(req, res) {	
		res.json({accessToken: req.session.accessToken});
	  });
	
	



