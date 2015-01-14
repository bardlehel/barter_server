// app/routes.js
var https = require('https');
var mongoose = require('mongoose');
var configDB = require('../config/database.js');
var barterConn = mongoose.createConnection(configDB.barter_url);
var climbtimeConn = mongoose.createConnection(configDB.climbtime_url);
var ClimbtimeUser = require('./models/climbtimeuser.js')(climbtimeConn);
var BarterUser = require('./models/user.js')(barterConn);
var Category = require('./models/category.js')(climbtimeConn);
var Concept =  require('./models/concept.js')(climbtimeConn);
var utils = require('./utils.js');
var uuid = require('node-uuid');
var barterList = require('./barter_list_crud.js');

var THIRTY_MINUTES = 30 * 60000;



module.exports = function (app, passport) {
    
    //REST API ROUTES
    
    //api/access_token: gets/creates access token for barter app based on facebook id
    //                      and adds the user to the barter user collection
    //  query params:
    //      facebook-token:  token received from facebook after client authentication
    //      facebook-id:    facebook user id to compare against for validation
    //  returns json:
    //      accessToken: the newly generated token for this facebook user    
    app.get('/api/access_token', function (request, response) {
        //check if facebook-token is in barter database (user collection) already
        //if it exists, send back the user an accesstoken and set that to the session.
        //if no user exists for that facebook token, validate it with facebook and create a new token

        if (utils.hasIllegalCharacters(request.query, ['facebook-token', 'facebook-id'], response)) return;

        var url = 'https://graph.facebook.com/me?fields=id&access_token=' 
            + request.query["facebook-token"];

        https.get(url, function(res) {

            res.on('data', function(data) {
                data = JSON.parse(data);
                if(data == undefined) {
                    response.json({error : 'no json object to parse'});
                }
                if(data.error !== undefined) {
                    response.json({'error:': data.error});
                    return;
                }

                //if access token date is less than 30 minutes old
                if  (!utils.unset(request.session.accessTokenDate)
                    && new Date() <= new Date((new Date((request.session.accessTokenDate)).getTime() + THIRTY_MINUTES))) {
                    //return the accessToken to user
                    return response.json({ accessToken : request.session.accessToken });
                }
                //see if user exists already in mongodb climbtime database
                else {

                    //see if we can find a Climbtime user with that facebook token
                    ClimbtimeUser.findOne({'facebook.userId': request.query['facebook-id']}, function (error, user) {

                        //user not found
                        if (!user) {

                            // see if we can
                            //create the uuid for the accesstoken and put it in the session and user collection
                            request.session.accessToken = uuid.v1();

                            var newClimbtimeUser = new ClimbtimeUser({
                                'access_token': request.session.accessToken,
                                'access_token_date': new Date(),
                                'facebook.userId' :  request.query['facebook-id']
                            });

                            newClimbtimeUser.save(function (err, user) {
                                if (err) {
                                    response.json({error: 'cannot save new climbtime user'});
                                    return;
                                }

                                request.session.climbtimeId = user._id;
                                request.session.save();

                                //create BarterUser
                                var newBarterUser = new BarterUser({
                                    climbtime_id : user._id,
                                    has : [],
                                    wants : [],
                                    interests : [],
                                    creation_date : new Date()
                                });

                                newBarterUser.save(function(err, user){
                                    if (err) {
                                        response.json({error: 'cannot save new barter user'});
                                        return;
                                    }
                                });

                                return response.json({'accessToken': request.session.accessToken});

                            });

                        }
                        else {
                            //return the user's access token if available
                            request.session.accessToken =  user.access_token;
                            request.session.accessTokenDate = user.access_token_date;
                            request.session.climbtimeId = user._id;

                            if(new Date((new Date(user.access_token_date).getTime() + THIRTY_MINUTES)) <= new Date()) {
                                return response.json({ accessToken : request.session.accessToken });
                            }
                            else {
                                request.session.accessToken = uuid.v1();
                                request.session.accessTokenDate = new Date();
                                return response.json( {accessToken : request.session.accessToken });
                            }
                        }
                    });
                }
            });

        }).on('error', function(e) {
            console.error(e);
        });

    });

    ////CLIMBTIME API

    //POST api/category: creates a new user-defined category into the climbtime database
    //  body params (request.body):
    //      access-token:  token received from api/get_access_token
    //      title:    title of new category
    //      description: description of category
    //      parents: id of the parent category
    //  returns json: object containing category data
    app.post('/api/category', function(request, response){
        var paramArray = ['title', 'parents'];

        if (!utils.hasRouteAccess(request.body.accessToken, request, response)) return;
        if (!utils.hasParameters(request.body, paramArray, response)) return;
        if (utils.hasIllegalCharacters(request.body, paramArray, response)) return;

        if(request.body.parents.constructor != Array) return response.json({ error : 'parents not array'});

        var newCategory = new Category({
            title: request.body.title,
            description: request.body.description,
            parent: request.body.parents
        });
        //try to save the category and return it's ID
        newCategory.save(function (error) {

            if (utils.unset(error)) {
                response.json(newCategory.toJSON());
                return;
            }

            response.json({ error: 'could not save new category' });
        });

    });
    
    //GET api/category: finds category and returns it in json format
    //url params (req.query):
    //	accessToken
    //	title
    app.get('/api/category', function (request, response) {

        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        if (!utils.hasParameters(request.query, ['title'], response)) return;
        if (utils.hasIllegalCharacters(request.query, ['title'], response)) return;

        //look up categories by title
        Category.find({ 'title' : request.query.title }, function (err, categories) {
            
            //category/ies found.  return array...
            if (categories) return response.json({ categories : categories});

            response.json({ error: 'could not find category:' + request.query.title });
        });
    });

    //PUT api/category: edits the category if it exists
    //body params (request.body):
    //	accessToken
    //	category_id
    // (optional:)
    // title: new title of the category
    // parents: array of parent category ids
    // description:  description of the category
    // mainPhoto: (file name + path of) photo to capture visual of the category
    // photos: { albums: [ {albumTitle: 'xxx', photos: { {photoTitle: 'yyy',  path: '/photos/xyz.jpg'} } } ] }
    app.put('/api/category', function (request, response) {

        if (!utils.hasRouteAccess(request.body.accessToken, request, response)) return;
        if (!utils.hasParameters(request.body, ['category_id'], response)) return;
        if (utils.hasIllegalCharacters(request.body, ['category_id', 'title', 'parents','description'], response)) return;

        if(!utils.unset(request.body.parents) && request.body.parents.constructor != Array)
            return response.json({ error : 'parents not array'});

        //look up category by id
        Category.findOne({ '_id' : request.body.category_id }, function (err, category) {

            if (err) return response.json({ error : err });
            if (!category) return response.json({ error : 'no category found' });

            if(!utils.unset(request.body.title))
                category.title = request.body.title;
            if(!utils.unset(request.body.description))
                category.description = request.body.description;
            if(!utils.unset(request.body.parents) && request.body.parents.length > 0)
                category.parent = request.body.parents;

            //since there is no category found, create the category
            category.save(function (error) {

                if (utils.unset(error)) {
                    response.json(category);
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

        if(request.query.title.length < 3) return response.json({error: 'title less than 3 characters'});

        var r =  new RegExp('^'+request.query.title, "i");
        var query = Category.find({title:r}).limit(10);
        query.exec(function(error, categories){
            response.json({categories: categories});
        });

    });
    
    //GET api/subcategories:  gets the children categories of a supplied category
    //query params:
    //  category-id: parent id to search with
    app.get('api/subcategories', function (request, response) { 
        if (!utils.hasParameters(request.query, ['category-id'], response)) return;
        if (utils.hasIllegalCharacters(request.query, ['category-id'], response)) return;

        Category.find({ parent : request.query['category-id']}, function (error, categories) {
            if (error) return response.json({ error : error });
            if (!categories) return response.json({ error : 'no categories found with that parent' });

            return response.json(categories);
        });
    });

    //GET api/topic:  returns a topic from category collection, or new category if not found
    //query params:
    //	access-token: token received from /api/get_acccess_token
    //	title: title of the topic/concept4
    app.get('/api/topic', function (request, response) {
        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        if (!utils.hasParameters(request, ['title'], response)) return;

        Concept.findOne({ title: request.query.title }, function (error, concept) {

            if (!concept) {
                //create new category if category doesn't exist
                concept = new Concept({ title: request.query.title });
                concept.save();
            }

            response.json(concept);
        });
    });

    //POST api/topic: creates a new user-defined category into the climbtime database
    //  body params (request.body):
    //      access-token:  token received from api/get_access_token
    //      title:    title of new category
    //      category_id: id of the  category the topic belongs to
    //  returns json: object containing category data
    app.post('/api/topic', function(request, response){
        var paramArray = ['title', 'category_id'];

        if (!utils.hasRouteAccess(request.body.accessToken, request, response)) return;
        if (!utils.hasParameters(request.body, paramArray, response)) return;
        if (utils.hasIllegalCharacters(request.body, paramArray, response)) return;

        var newConcept = new Concept({
            title: request.body.title,
            categories: [request.body.category_id]
        });
        //try to save the category and return it's ID
        newConcept.save(function (error) {

            if (utils.unset(error)) {
                response.json(newConcept.toJSON());
                return;
            }

            response.json({ error: 'could not save new topic' });
        });

    });

    //Barter App API


    //GET api/have: gets the list of 'haves' from user and returns it to user
    //query params:
    //	access-token: token received from /api/get_access_token
    //returns:
    //  array of full categories in have list
    app.get('/api/have', barterList.getHaves);

    //POST api/have: adds categories to the haves list
    //query params:
    //	access-token: token received from /api/get_access_token
    //  categories: array of category ids to add to have list
    //returns:
    //  array of full categories in have list
    app.post('/api/have', barterList.postHaves);

    //DELETE api/have: removes categories from the haves list
    //query params:
    //	access-token: token received from /api/get_access_token
    //  categories: array of category ids to remove from have list
    app.delete('/api/have', barterList.deleteHaves);


    //GET api/wants: gets the list of 'wants' from user
    //query params:
    //	access-token: token received from /api/get_acccess_token
    app.get('/api/want', barterList.getWants);

    //POST api/want: adds categories to the haves list
    //query params:
    //	access-token: token received from /api/get_access_token
    //  categories: array of category ids to add to have list
    //returns:
    //  array of full categories in have list
    app.post('/api/want', barterList.postWants);

    //DELETE api/want: removes categories from the haves list
    //query params:
    //	access-token: token received from /api/get_access_token
    //  categories: array of category ids to remove from have list
    app.delete('/api/want', barterList.deleteWants);
    
    //GET api/me: gets the user's data
    //remarks: uses facebook id from session
    //query params:
    //	access-token: token received from /api/acccess_token
    app.get('/api/me', function (request, response) {
        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        
        BarterUser.findOne({ 'climbtime_id' : request.session.climbtimeId }, function (err, barterUser) {
            if (!barterUser) response.json({ error: true, message: 'no user found' });
            else response.json(barterUser);
        });
    });
    
    //api/get_numbers: gets the number of wants and haves for user
    //query params:
    //	access-token: token received from /api/get_acccess_token
    app.get('/api/get_numbers', function (request, response) {
        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        
        BarterUser.findOne({ 'climbtime_id' : request.session.climbtimeId }, function (error, barterUser) {
            var wantsLength = 0;
            var havesLength = 0;
            
            if (!barterUser) {
                response.json({ error: true, message: 'no user found' });
                return;
            }
            
            //get the number of wants and haves	
            if (typeof barterUser.wants != 'undefined')
                wantsLength = barterUser.wants.length;
            if (typeof barterUser.haves != 'undefined')
                havesLength = barterUser.haves.length;
            
            response.json({
                wants: wantsLength,
                haves: havesLength
            });
			
        });
    });

    //GET api/users: gets users based on parameters
    // params:
    //  has:  array of topics that users have
    //  wants: array of topics that users want
    app.get('/api/users', function (req, res) {
        if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;
        
        //get my user
        BarterUser.find({ has : req.query.category_id }, function (err, users) {
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





