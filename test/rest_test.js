/*rest_test.js
 * 
 * author: Lehel Kovach
 * date: 11/21/2014
 * 
 * This test suite runs integration tests on the Barter REST API.  
 * The API is a superset of the Climbtime Topics API.
 * RESTful Endpoints that are to be tested include:
 * 
 * For Barter exclusively:
 *  login: returns an access token in order to use member-based services
 *  get_haves:  returns the haves (as Climbtime Category IDs) associated with the member
 *  add_have:  adds a climbtime category (ID) to the haves list for the user
 *  remove_have:  removes the category from the haves list for the user
 *  get_wants:  returns the list of wants (Climbtime category IDs) associated with the member
 *  add_want: adds a climbtime category (ID) to the wants list for the user
 *  remove_want:  removes a category (ID) from the list of wants  associated with user
 *  get_interests:  returns the list of interests (Climbtime Category IDs) associated with member
 *  add_interest:
 *  remove_interest:
 * 
 * Climbtime General API:   
 *  get category:
 *  post category:
 *  put category:
 *  get topic:
 *  post topic:
 *  put topic:
 * 
 */
var request = require('supertest'); //used for http calls for REST
var server = require('../server.js');
var agent = request.agent('http://localhost:8083');
var assert = require("assert"); // node.js core module
var should = require("should");
var mongoose = require('mongoose');
var express = require('express');
var q = require('q');
var app = express();
var configDB = require('../config/database.js');

var climbtimeConn = '';
var ClimbtimeUser = null;
var Category = null;
var facebookToken = "CAADs8OVZALMEBAPsbOANjfwOZAZAvetDl6qSRI8HctLfbuRd4rG6tr9ekNmOhXyH8nKo73ZCDHfjs1Uhm6gLO0aPrvGhFB8OEuT2iQLPjifWxk1uuYc7EVtMe0dk1t6nkLzy9KDCISN7hzZBxLAV9oa0QFUYQZAi8X8FpEpHinhyXNm5yeQbaFPZA7anmDhPYWocUcpkh6ZBekrPcjzJNXaO";
var facebookId = "100008874782837";
var http = require('http');
var accessToken = '';
var PERSON_CATEGORY_ID = '539740c3f1fa991089c67f16';

describe('REST', function () {

    before(function (done) {
        // In our tests we use the test db
        // barterConn = mongoose.createConnection(configDB.barter_url);
        climbtimeConn = mongoose.createConnection(configDB.climbtime_url);
        ClimbtimeUser = require("../app/models/user.js")(climbtimeConn);
        Category = require("../app/models/category.js")(climbtimeConn);
        request = request.agent('http://localhost:8083');

        done();
    });


    /////////////////////////////////////////////////////////////////////
    //  TEST for getting access token
    /////////////////////////////////////////////////////////////////////
    describe('GET: access_token', function () {
        this.timeout(15000);

        it('should get a 200 back', function (done) {
            request
                .get('/')
                .expect(200, done);
        });

        it('should return a token when passing in facebook token', function (done) {

                request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('accessToken');
                    //get access token from db and check value
                    ClimbtimeUser.findOne({ 'access_token' : res.body['accessToken'] }, function (error, user) {
                        if (!user) return done(error);

                        res.body['accessToken'].should.equal(user.access_token);
                        facebookId.should.equal(user.facebook.userId);
                        done();
                    });
             
                });
             
        })

        it('should return an error if facebook token is invalid', function (done) {
            var invalidFacebookToken = '111';
            request
                .get('/api/access_token?facebook-token=' + invalidFacebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.property('error:');
                    done();
               });
        })

    })


    /*
    /////////////////////////////////////////////////////////////////////
    //  TEST for getting categories
    /////////////////////////////////////////////////////////////////////
    describe('GET: category', function() {
        this.timeout(30000);

        var categoryTitle = '';
        var accessToken = '';

        it('should return an error if no title is specified', function(done){
            categoryTitle = '';

            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if (err)
                        return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;
                    accessToken.should.not.equal('');

                    request
                        .get('/api/category?access-token=' + accessToken + '&title=' + categoryTitle)
                        .set('Accept', 'application/json')
                        //.expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);

                            res.body.should.have.property('error');
                            return done();
                        });
                });


        })

        it('should return an error if title contains illegal characters', function(done){
            categoryTitle = '222%272abc';

            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if (err)
                        return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;
                    accessToken.should.not.equal('');

                    request
                        .get('/api/category?access-token=' + accessToken + '&title=' + categoryTitle)
                        .set('Accept', 'application/json')
                        //.expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);

                            res.body.should.have.property('error');
                            return done();
                        });
                });

        })

        it('should return an error if title not found', function(done){
            //create random string
            categoryTitle = Math.random().toString(36).substring(7);
            // do a find for title with that string
            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if (err)
                        return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;
                    accessToken.should.not.equal('');

                    request
                        .get('/api/category?access-token=' + accessToken + '&title=' + categoryTitle)
                        .set('Accept', 'application/json')
                        //.expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);

                            res.body.should.have.property('categories');
                            res.body.categories.length.should.equal(0);
                            return done();
                        });
                });
        })

        it('should return a valid category with an existing title', function(done){

            categoryTitle = 'Person';

            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if (err)
                        return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;
                    accessToken.should.not.equal('');

                    request
                        .get('/api/category?access-token=' + accessToken + '&title=' + categoryTitle)
                        .set('Accept', 'application/json')
                        //.expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);

                            res.body.should.have.property('categories');
                            res.body.categories.length.should.be.above(0);
                            res.body.categories[0].should.have.property('title');
                            res.body.categories[0].title.should.equal('Person');
                            return done();
                        });

                    return done();
                });

        })

    })

    /////////////////////////////////////////////////////////////////////
    //  TESTs for creating a category
    /////////////////////////////////////////////////////////////////////
    describe('POST: category', function() {

        this.timeout(20000);
        var categoryTitle = 'Test Title';


        it('should return error if no access token is supplied', function(done){

            accessToken = '';
            categoryTitle = Math.random().toString(36).substring(7);

            var postData = {
                accessToken : accessToken,
                title: categoryTitle
            };

            request
                .post('/api/category')
                .send(postData)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err)
                        return done(err);

                    res.body.should.have.property('error');
                    return done();
                });

        })

        it('should return an error if no title is specified', function(done){

            categoryTitle = '';

            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;

                    var postData = {
                        accessToken : accessToken,
                        title: categoryTitle
                    };

                    request
                        .post('/api/category')
                        .send(postData)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err)
                                return done(err);

                            res.body.should.have.property('error');
                            return done();
                        });

                });
        })

        it('should return an error if title contains illegal characters', function(done){

            var categoryTitle = "test%27";

            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;

                    var postData = {
                        accessToken : accessToken,
                        title: categoryTitle
                    };

                    request
                        .post('/api/category')
                        .send(postData)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err)
                                return done(err);

                            res.body.should.have.property('error');
                            return done();

                        });


                });
        })

        it('should return error if valid parent id is not supplied', function(done) {

            categoryTitle = Math.random().toString(36).substring(7);

            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;

                    var postData = {
                        accessToken : accessToken,
                        title: categoryTitle
                    };

                    request
                        .post('/api/category')
                        .send(postData)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err)
                                return done(err);

                            res.body.should.have.property('error');
                            return done();
                        });


                });

        })


        it('should add category to database', function(done) {

            categoryTitle = Math.random().toString(36).substring(7);

            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;

                    //get the "Person" category
                    request
                        .get('/api/category?access-token=' + accessToken + '&title=Person')
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err)
                                return done(err);

                            res.body.should.have.property('categories');
                            res.body.categories.length.should.be.above(0);
                            res.body.categories[0].should.have.property('title');
                            res.body.categories[0].title.should.equal('Person');

                            //POST the new category using "PERSON" as the parent
                            res.body.categories[0].should.have.property('id');
                            var parentId = res.body.categories[0].id;

                            var postData = {
                                accessToken : accessToken,
                                title: categoryTitle,
                                parents: [parentId]
                            };

                            request
                                .post('/api/category')
                                .send(postData)
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(200)
                                .end(function (err, res) {
                                    if (err)
                                        return done(err);

                                    res.body.should.have.property('parent');
                                    res.body.parent.length.should.be.above(0);
                                    res.body.parent[0].should.equal(PERSON_CATEGORY_ID);

                                    return done();
                                });
                        });




                });

        })
    })


    /////////////////////////////////////////////////////////////////////
    //  TEST for editing a category
    /////////////////////////////////////////////////////////////////////
    describe('PUT: category', function() {
        this.timeout(15000);

        var categoryTitle = '';
        var categoryDescription = '';
        var accessToken = '';

        it('should not take illegal characters in title, description or parents', function (done) {

            categoryTitle = "test%27";
            description = 'test';


            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;

                    //get the "PERSON" category
                    request
                        .get('/api/category?access-token=' + accessToken + '&title=Person')
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err)
                                return done(err);

                            res.body.should.have.property('categories');
                            res.body.categories.length.should.be.above(0);
                            res.body.categories[0].should.have.property('title');
                            res.body.categories[0].title.should.equal('Person');

                            var parentId = res.body.categories[0].id;

                            var postData = {
                                accessToken: accessToken,
                                title: categoryTitle,
                                description: categoryDescription,
                                parents: [parentId]
                            };

                            request
                                .put('/api/category')
                                .send(postData)
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(200)
                                .end(function (err, res) {
                                    if (err)
                                        return done(err);

                                    res.body.should.have.property('error');
                                });

                            categoryTitle = Math.random().toString(36).substring(7);
                            categoryDescription = "test%27";

                            postData = {
                                accessToken: accessToken,
                                title: categoryTitle,
                                description: categoryDescription,
                                parents: [parentId]
                            };

                            request
                                .put('/api/category')
                                .send(postData)
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(200)
                                .end(function (err, res) {
                                    if (err)
                                        return done(err);

                                    res.body.should.have.property('error');
                                });

                            categoryTitle = Math.random().toString(36).substring(7);
                            categoryDescription = Math.random().toString(36).substring(7);
                            parentId = '12334%24';

                            postData = {
                                accessToken: accessToken,
                                title: categoryTitle,
                                description: categoryDescription,
                                parents: [parentId]
                            };

                            request
                                .put('/api/category')
                                .send(postData)
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(200)
                                .end(function (err, res) {
                                    if (err)
                                        return done(err);

                                    res.body.should.have.property('error');
                                    return done();
                                });


                        });
                })

        })

        it('updated the title if we change the title', function (done) {

            var categoryTitle = Math.random().toString(36).substring(7);
            var categoryDescription = Math.random().toString(36).substring(7);

            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;

                    //get the "PERSON" category
                    request
                        .get('/api/category?access-token=' + accessToken + '&title=Person')
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err)
                                return done(err);

                            res.body.should.have.property('categories');
                            res.body.categories.length.should.be.above(0);
                            res.body.categories[0].should.have.property('title');
                            res.body.categories[0].title.should.equal('Person');

                            var parentId = res.body.categories[0].id;

                            var postData = {
                                accessToken: accessToken,
                                title: categoryTitle,
                                description: categoryDescription,
                                parents: [parentId]
                            };

                            //add a category
                            request
                                .post('/api/category')
                                .send(postData)
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(200)
                                .end(function (err, res) {
                                    if (err)
                                        return done(err);

                                    res.body.should.have.property('title');
                                    res.body.title.should.equal(categoryTitle);
                                    res.body.should.have.property('description');
                                    res.body.description.should.equal(categoryDescription);

                                    //update the category with new title and new descritpion
                                    var newTitle = '12345';
                                    var newDescription = '67890';

                                    var postData = {
                                        accessToken: accessToken,
                                        category_id: res.body.id,
                                        title: newTitle,
                                        description: newDescription//,
                                        //parents: [parentId]
                                    };

                                    request
                                        .put('/api/category')
                                        .send(postData)
                                        .set('Accept', 'application/json')
                                        .expect('Content-Type', /json/)
                                        .expect(200)
                                        .end(function (err, res) {
                                            if (err)
                                                return done(err);

                                            res.body.should.have.property('title');
                                            res.body.title.should.equal(newTitle);
                                            res.body.should.have.property('description');
                                            res.body.description.should.equal(newDescription);

                                            return done();

                                        });
                                });
                        })


                })

        })

    })
    /////////////////////////////////////////////////////////////////////
    //  TEST for getting autocompletes for category title
    /////////////////////////////////////////////////////////////////////
    describe('GET: autocomplete_category', function() {

        this.timeout(60000);

        var categoryTitle = '';
        var accessToken = '';

        function addCategory(title, parentId) {

            var deferred = q.defer();
            var categoryTitle = title + Math.random().toString(36).substring(7);
            var postData = {
                accessToken : accessToken,
                title: categoryTitle,
                parents: [parentId]
            };

            request
                .post('/api/category')
                .send(postData)
                .end(function (err, res) {
                    deferred.resolve(res.body);
                });

            return deferred.promise;
        }

        it('should add a categories with similar beginnings and be within the results list', function(done){

            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;

                    request
                        .get('/api/category?access-token=' + accessToken + '&title=Person')
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err)
                                return done(err);

                            res.body.should.have.property('categories');
                            res.body.categories.length.should.be.above(0);
                            res.body.categories[0].should.have.property('title');
                            res.body.categories[0].title.should.equal('Person');

                            var parentId = res.body.categories[0].id;

                            //add 3 categories starting with the same characters;
                            var firstCharacters = Math.random().toString(36).substring(7);
                            var counter = 0;

                            addCategory(firstCharacters + '1', parentId)
                                .then(addCategory(firstCharacters + '2', parentId))
                                .then(addCategory(firstCharacters + '3', parentId))
                                .then(function(resolve, reject) {
                                    request
                                        .get('/api/autocomplete_category?title=' + firstCharacters)
                                        .set('Accept', 'application/json')
                                        .expect('Content-Type', /json/)
                                        .expect(200)
                                        .end(function (err, res) {
                                            if (err)
                                                return done(err);

                                            res.body.should.have.property('categories');
                                            res.body.categories.length.should.equal(3);
                                            return done();
                                        });
                                });
                        });

                });
        })
    })


    */

    describe('GET: have', function() {
        this.timeout(30000);

        it('should return an array', function(done){
            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;

                    request
                        .get('/api/have?access-token=' + accessToken)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);

                            res.body.should.be.instanceof(Array);
                            done();
                        });
                });
        })
    })

    describe('POST: have', function() {
        this.timeout(15000);

        it('should return error when invalid id string is supplied', function(done){
            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;
                    var postData = {
                        'access-token' : accessToken,
                        categories : ['123']
                    };

                    request
                        .post('/api/have')
                        .send(postData)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);

                            res.body.should.have.property('error');
                            done();
                        });
                });
        })

        it('should add category to database', function(done) {
            //add category
            categoryTitle = Math.random().toString(36).substring(7);

            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;

                    //get the "Person" category
                    request
                        .get('/api/category?access-token=' + accessToken + '&title=Person')
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err)
                                return done(err);

                            res.body.should.have.property('categories');
                            res.body.categories.length.should.be.above(0);
                            res.body.categories[0].should.have.property('title');
                            res.body.categories[0].title.should.equal('Person');

                            //POST the new category using "PERSON" as the parent
                            res.body.categories[0].should.have.property('id');
                            var parentId = res.body.categories[0].id;

                            var postData = {
                                accessToken: accessToken,
                                title: categoryTitle,
                                parents: [parentId]
                            };

                            request
                                .post('/api/category')
                                .send(postData)
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(200)
                                .end(function (err, res) {
                                    if (err)
                                        return done(err);

                                    res.body.should.have.property('id');
                                    var newCategoryId = res.body.id;

                                    //add have
                                    var postData = {
                                        'access-token' : accessToken,
                                        categories : [newCategoryId]
                                    };

                                    request
                                        .post('/api/have')
                                        .send(postData)
                                        .set('Accept', 'application/json')
                                        .expect('Content-Type', /json/)
                                        .expect(200)
                                        .end(function (err, res) {
                                            if (err) return done(err);

                                            //get have and validate the size of have array is +1 and includes new category id
                                            res.body.should.be.instanceof(Array);
                                            res.body.should.containEql(newCategoryId);

                                            done();
                                        });



                                    return done();
                                });
                        });

                })
        })

    })

    describe('DELETE: have', function() {
        this.timeout(15000);


        it('should remove category from haves', function(done){
            //add category
            categoryTitle = Math.random().toString(36).substring(7);

            request
                .get('/api/access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;

                    //get the "Person" category
                    request
                        .get('/api/category?access-token=' + accessToken + '&title=Person')
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err)
                                return done(err);

                            res.body.should.have.property('categories');
                            res.body.categories.length.should.be.above(0);
                            res.body.categories[0].should.have.property('title');
                            res.body.categories[0].title.should.equal('Person');

                            //POST the new category using "PERSON" as the parent
                            res.body.categories[0].should.have.property('id');
                            var parentId = res.body.categories[0].id;

                            var postData = {
                                accessToken: accessToken,
                                title: categoryTitle,
                                parents: [parentId]
                            };

                            request
                                .post('/api/category')
                                .send(postData)
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(200)
                                .end(function (err, res) {
                                    if (err)
                                        return done(err);

                                    res.body.should.have.property('id');
                                    var newCategoryId = res.body.id;

                                    //add have
                                    var postData = {
                                        'access-token' : accessToken,
                                        categories : [newCategoryId]
                                    };

                                    //add have
                                    request
                                        .post('/api/have')
                                        .send(postData)
                                        .set('Accept', 'application/json')
                                        .expect('Content-Type', /json/)
                                        .expect(200)
                                        .end(function (err, res) {
                                            if (err) return done(err);

                                            //get have and validate the size of have array is +1 and includes new category id
                                            res.body.should.be.instanceof(Array);
                                            res.body.should.containEql(newCategoryId);

                                            var hasLength = res.body.length;

                                            //remove the category from has
                                            var postData = {
                                                'access-token' : accessToken,
                                                categories : [newCategoryId]
                                            };

                                            request
                                                .delete('/api/have')
                                                .send(postData)
                                                .set('Accept', 'application/json')
                                                .expect('Content-Type', /json/)
                                                .expect(200)
                                                .end(function (err, res) {
                                                    if (err) return done(err);

                                                    //get have and validate size is -1 and doesn't contain the category id
                                                    res.body.length.should.equal(hasLength - 1);
                                                    res.body.should.not.containEql(newCategoryId);

                                                    done();
                                                });

                                            done();
                                        });



                                    return done();
                                });
                        });

                })

        })
    })

     describe('GET: want', function() {
     it('should return an array', function(done){

     })
     })

     describe('POST: want', function() {
     it('should add category to database', function(done){

     })
     })

     describe('DELETE: want', function() {
     it('should', function(done){

     })
     })


})
