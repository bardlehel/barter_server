// app/routes.js
var mongoose = require('mongoose');
var configDB = require('../config/database.js');
var barterConn = mongoose.createConnection(configDB.barter_url);
var climbtimeConn = mongoose.createConnection(configDB.climbtime_url);
var User = require('./models/user.js')(climbtimeConn);
var BarterUser = require('./models/user.js')(barterConn);
var Category = require('./models/category.js')(climbtimeConn);
var RestClient = require('node-rest-client').Client;
var restClient = new RestClient();
var utils = require('./utils.js');
var uuid = require('node-uuid');

var THIRTY_MINUTES = 30 * 60000;



module.exports = function (app, passport) {
    
    //REST API ROUTES
    
    //api/get_access_token: gets/creates access token for barter app based on facebook id
    //                      and adds the user to the barter user collection
    //  query params:
    //      facebook-token:  token received from facebook after client authentication
    //      facebook-id:    facebook user id to compare against for validation
    //  returns json:
    //      accessToken: the newly generated token for this facebook user    
    app.get('/api/get_access_token', function (request, response) {
        //check if facebook-token is in barter database (user collection) already
        //if it exists, send back the user an accesstoken and set that to the session.
        //if no user exists for that facebook token, validate it with facebook and create a new token

        if (utils.hasIllegalCharacters(request.query, ['facebook-token', 'facebook-id'], response)) return;

        var url = 'https://graph.facebook.com/me?fields=id&access_token=' 
            + request.query["facebook-token"];

        restClient.get(url,  function (data, res) {
            data = JSON.parse(data);
            if(data == undefined) {
                response.json({error : 'no json object to parse'});
            }
            if(data.error !== undefined) {
                response.json({'error:': data.error});
                return;
            }

            //if facebook returns valid user (matches facebook id sent)
            if (data.id == request.query["facebook-id"]) {
                //first check our session if it contains a fresh accessToken
                if (!utils.unset(request.session.accessTokenDate)) {

                    if (utils.unset(request.session.accessToken))
                        return request.json({ error: 'access token not saved in session for this user' })

                    if  (new Date() <= new Date((new Date((user.session.accessTokenDate)).getTime() + THIRTY_MINUTES))) {
                        //return the accessToken to user
                        return response.json({ accessToken : user.session.accessToken });
                    }
                }
                //see if user exists already in mongodb climbtime database
                else {

                    //see if we can find a Climbtime user with that facebook token
                    User.findOne({'facebook.userId': request.query['facebook-id']}, function (error, user) {

                        //user not found
                        if (!user) {

                            // see if we can
                            //create the uuid for the accesstoken and put it in the session and user collection
                            request.session.accessToken = uuid.v1();

                            var newUser = new User({
                                'access_token': request.session.accessToken,
                                'access_token_date': new Date()
                            });

                            newUser.save(function (err, user) {
                                if (err) {
                                    response.json({error: 'cannot save new climbtime user'});
                                    return;
                                }

                                request.session.climbtimeId = user._id;
                                request.session.save();
                                return response.json({'accessToken': request.session.accessToken});

                            });

                        }
                        else {
                            //return the user's access token if available
                            request.session.accessToken =  user.access_token;
                            request.session.accessTokenDate = user.access_token_date;

                            if(new Date((new Date(user.access_token_date).getTime() + THIRTY_MINUTES)) <= new Date()) {
                                return response.json({ authToken : request.session.accessToken });
                            }
                            else {
                                response.session.accessToken = uuid.v1();
                                response.session.accessTokenDate = new Date();
                                return response.json( {accessToken : response.session.accessToken });
                            }
                        }
                    });
                }
            }
        }).on('error', function (err) {
                console.log('something went wrong on the request', err.request.options);
                response.json({ 'error' : err });
            });
    });

    ////CLIMBTIME API

    //api/add_category: creates a new user-defined category into the climbtime database
    //  body params (request.body):
    //      access-token:  token received from api/get_access_token
    //      title:    title of new category
    //  returns json: object containing category data
    app.post('/api/add_category', function(request, response){
        if (!utils.hasRouteAccess(request.body.accessToken, request, response)) return;
        if (!utils.hasParameters(request.body, ['title'], response)) return;
        if (utils.hasIllegalCharacters(request.body, ['title'], response)) return;

        var newCategory = new Category({ title: request.body.title });
        //try to save the category and return it's ID
        newCategory.save(function (error) {

            if (utils.unset(error)) {
                response.json(newCategory.toJSON());
                return;
            }

            response.json({ error: 'could not save new category' });
        });

    });
    
    //api/get_category_by_title: finds category id and returns it in json format or
    //	adds the category if does not exist
    //url params (req.query):
    //	accessToken
    //	title
    app.get('/api/get_category_by_title', function (request, response) {

        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        if (!utils.hasParameters(request.query, ['title'], response)) return;
        if (utils.hasIllegalCharacters(request.query, ['title'], response)) return;
        
        //look up category by title
        Category.findOne({ 'title' : request.query.title }, function (err, category) {
            
            //category found; return the category's id
            if (category) return response.json({ category_id : category._id });

            //since there is no category found, create the category
            var newCategory = new Category({ title: request.query.title });
            //try to save the category and return it's ID
            newCategory.save(function (error) {
                
                if (utils.unset(error)) {
                    response.json(newCategory);
                    return;
                }
                
                response.json({ error: 'could not save new category' });
            });
        });
    });

    //api/edit_category: edits the category if it exists
    //body params (request.body):
    //	accessToken
    //	title
    // (optional:)
    // description:  description of the category
    // mainPhoto: (file name + path of) photo to capture visual of the category
    // photos: { albums: [ {albumTitle: 'xxx', photos: { {photoTitle: 'yyy',  path: '/photos/xyz.jpg'} } } ] }
    app.put('/api/edit_category', function (request, response) {

        if (!utils.hasRouteAccess(request.body.accessToken, request, response)) return;
        if (!utils.hasParameters(request.body, ['title'], response)) return;
        if (utils.hasIllegalCharacters(request.body, ['title', 'description'], response)) return;

        //look up category by id
        Category.findOne({ 'id' : request.body._id }, function (err, category) {

            if (err) return response.json({ error : err });
            if (!category) return response.json({ error : 'no category found' });

            category.title = request.body.title;
            category.description = request.body.description;

            //since there is no category found, create the category
            category.save(function (error) {

                if (utils.unset(error)) {
                    response.json({ category_id : newCategory._id, result: 'successfully updated category' });
                    return;
                }

                response.json({ error: 'could not save new category' });
            });
        });
    });

    //api/autocomplete_category: gets topic/category auto-completed titles  from string
    //query params:
    //	title: string to lookup parts of category titles
    app.get('/api/autocomplete_category', function (request, response) {
        if (!utils.hasParameters(request.query, ['title'], response)) return;
        if (utils.hasIllegalCharacters(request.query, ['title'], response)) return;
        //limit top 50
        var r = new RegExp(request.query.title,'i');
        var query = Category.find({name: r});
        query.exec(function(error, categories){
            response.json(categories);
        });

    });


    //api/get_topic_by_title:  returns a topic from category collection, or new category if not found
    //query params:
    //	access-token: token received from /api/get_acccess_token
    //	title: title of the topic/concept4
    app.get('/api/get_topic_by_title', function (request, response) {
        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        if (!utils.hasParameters(request, ['title'], response)) return;

        Category.findOne({ title: request.query.title }, function (error, category) {

            if (!category) {
                //create new category if category doesn't exist
                category = new Category({ title: request.query.title });
                category.save();
            }

            response.json(category);
        });
    });
    
    //api/get_haves: gets the list of 'haves' from user and returns it to user
    //query params:
    //	access-token: token received from /api/get_access_token
    app.get('/api/get_haves', function (request, response) {
        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        
        BarterUser.findOne({ 'facebook.id' : request.session.facebookId }, function (error, user) {
            if (!user) response.json({ message: 'no user found' });
            else response.json(user.has);
        });
    });


    //api/get_wants: gets the list of 'wants' from user
    //query params:
    //	access-token: token received from /api/get_acccess_token
    app.get('/api/get_wants', function (request, response) {
        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        
        BarterUser.findOne({ 'facebook.id' : request.session.facebookId }, function (error, user) {
            if (!user) response.json({ message: 'no user found' });
            else response.json(user.wants);
        });
    });
    
    //api/get_user: gets the user's data
    //remarks: uses facebook id from session
    //query params:
    //	access-token: token received from /api/get_acccess_token
    app.get('/api/get_user', function (request, response) {
        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        
        BarterUser.findOne({ 'facebook.id' : req.session.facebookId }, function (err, barterUser) {
            if (!barterUser) res.json({ error: true, message: 'no user found' });
            else res.json(barterUser);
        });
    });
    
    //api/get_numbers: gets the number of wants and haves for user
    //query params:
    //	access-token: token received from /api/get_acccess_token
    app.get('/api/get_numbers', function (request, response) {
        if (!utils.hasRouteAccess(request.query.accessToken, request, response)) return;
        
        BarterUser.findOne({ 'facebook.id' : req.session.facebookId }, function (error, barterUser) {
            var wantsLength = 0;
            var havesLength = 0;
            
            if (!barterUser) {
                res.json({ error: true, message: 'no user found' });
                return;
            }
            
            //get the number of wants and haves	
            if (typeof barterUser.wants != 'undefined')
                wantsLength = barterUser.wants.length;
            if (typeof barterUser.haves != 'undefined')
                havesLength = barterUser.haves.length;
            
            res.json({
                wants: wantsLength,
                haves: havesLength
            });
			
        });
    });
    
    

    

    
    //api/add_want: adds a 'want' to the list of 'wants' of the user
    //query params:
    //	access-token: token received from /api/get_acccess_token
    //	category_id: id of the topic/category to be added to 'wants' list
    app.post('/api/add_want', function (request, response) {
        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        if (!utils.hasParameters(request, ['category_id'], response)) return;

        BarterUser.findOne({ 'facebook.id' : req.session.facebookId }, function (error, user) {
            //don't duplicate
            if (user.hasWant(req.query.category_id)) return;
            
            user.wants.push(req.query.category_id);
            user.save();
            
            res.json({ result: 'success' });
        });
    });
    
    app.post('/api/add_has', function (req, res) {
        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        if (!utils.hasParameters(request, ['category_id'], response)) return;

        if (req.query.accessToken != req.session.accessToken) {
            res.json({ result: 'failure', reason: 'incorrect access token' });
        }
        
        //get my user
        BarterUser.findOne({ 'climbtime.user_id' : req.user.id }, function (err, barterUser) {
            
            if (barterUser.has.indexOf(req.query.category_id) > -1)
                return;
            
            barterUser.has.push(req.query.category_id);
            barterUser.save();
        });
    });
    
    app.delete('/api/remove_want', function (request, response) {
        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        if (!utils.hasParameters(request, ['category_id'], response)) return;

        if (request.query.accessToken != request.session.accessToken) {
            response.json({ result: 'failure', reason: 'incorrect access token' });
        }
        
        //get my user
        BarterUser.findOne({ 'climbtime.user_id' : request.user.climbtime.id }, function (err, barterUser) {
            barterUser.wants.remove(request.query.category_id);
            barterUser.save();
        });
    });
    
    app.delete('/api/remove_has', function (request, response) {
        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        if (!utils.hasParameters(request, ['category_id'], response)) return;

        if (request.query.accessToken != request.session.accessToken) {
            response.json({ result: 'failure', reason: 'incorrect access token' });
        }
        
        //get my user
        BarterUser.findOne({ 'climbtime.user_id' : request.user.climbtime.id }, function (err, barterUser) {
            barterUser.has.remove(request.query.category_id);
            barterUser.save();
        });
    });
    
    app.get('/api/get_users_who_have', function (req, res) {
        if (req.query.accessToken != req.session.accessToken) {
            res.json({ result: 'failure', reason: 'incorrect access token' });
        }
        
        //get my user
        BarterUser.find({ has : req.query.category_id }, function (err, users) {
            res.json(users);
        });
    });
    
    app.get('/api/get_users_who_want',  function (req, res) {
        if (req.query.accessToken != req.session.accessToken) {
            res.json({ result: 'failure', reason: 'incorrect access token' });
            return;
        }
        
        //get my user
        BarterUser.find({ wants : req.query.category_id }, function (err, users) {
            res.json(users);
        });
    });
    
    
    
    //WEBSITE ROUTES
    
    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function (req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });
    
    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
		
    });
    
    // process the login form
    // app.post('/login', do all our passport stuff here);
    
    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function (req, res) {
        
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
    app.get('/profile',  function (req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });
    
    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });
    
    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true
        }));
    
    
    app.post('/login', passport.authenticate('climbtime-login'), 
	function (req, res) {
        res.json({ accessToken: req.session.accessToken });
    });

};





