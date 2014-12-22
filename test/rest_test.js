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
 *  get_category_by_title:  
 *  add_category:
 *  edit_category:
 *  get_topic_by_title:
 *  add_topic:
 *  edit_topic:
 * 
 */
var request = require('supertest'); //used for http calls for REST
var server = require('../server.js');
var agent = request.agent('http://localhost:8082');
var assert = require("assert"); // node.js core module
var should = require("should");
var mongoose = require('mongoose');
var express = require('express');
var app = express();
var configDB = require('../config/database.js');
var climbtimeConn = '';
var ClimbtimeUser = null;
var Category = null;
var facebookToken = "CAADs8OVZALMEBAOMt4NHwpi6WeqGZB3vosvq8CnullUqrATBQcqKaiHH7QhK5VaT0EYXf1dqPMGf4HMfIZAdntGXVvWue2Yd90220D16DoLoZB86yzf0ZBnn2WllLaheK871W76EelBZCZCqki0RkDHetQ1O3rUuziIaNZCgvugZCXTqxLZCDyBEqhdq0A80VDQOMG6p2520PY4LYXnZA6rcgWm";
var facebookId = "1384707158489078";
var http = require('http');
var accessToken = '';

describe('REST', function () {

    before(function (done) {
        // In our tests we use the test db
        // barterConn = mongoose.createConnection(configDB.barter_url);
        climbtimeConn = mongoose.createConnection(configDB.climbtime_url);
        ClimbtimeUser = require("../app/models/user.js")(climbtimeConn);
        Category = require("../app/models/category.js")(climbtimeConn);
        request = request.agent('http://localhost:8082');

        done();
    });

    describe('get_access_token', function () {
        this.timeout(15000);

        it('should get a 200 back', function (done) {
            request
                .get('/')
                .expect(200, done);
        });

        it('should return a token when passing in facebook token', function (done) {

                request
                .get('/api/get_access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
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
                .get('/api/get_access_token?facebook-token=' + invalidFacebookToken + '&facebook-id=' + facebookId)
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

    describe('add_category', function() {

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
                .post('/api/add_category')
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
                .get('/api/get_access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
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
                        .post('/api/add_category')
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
                .get('/api/get_access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
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
                        .post('/api/add_category')
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
                .get('/api/get_access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
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
                        .post('/api/add_category')
                        .send(postData)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err)
                                return done(err);

                            res.body.should.have.property('title');
                            res.body.title.should.equal(categoryTitle);
                            return done();
                        });


                });

        })
    })

    describe('get_category_by_title', function() {
        this.timeout(15000);

        var categoryTitle = '';
        var accessToken = '';

        it('should return an error if no title is specified', function(done){
            categoryTitle = '';

            request
                .get('/api/get_access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if (err)
                        return done(err);

                    accessToken = res.body.accessToken;
                    accessToken.should.not.equal('');

                    request
                        .get('/api/get_category_by_title?access-token=' + accessToken + '&title=' + categoryTitle)
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
                .get('/api/get_access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if (err)
                        return done(err);

                    accessToken = res.body.accessToken;
                    accessToken.should.not.equal('');

                    request
                        .get('/api/get_category_by_title?access-token=' + accessToken + '&title=' + categoryTitle)
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

        it('should return a valid category with good title', function(done){
            categoryTitle = Math.random().toString(36).substring(7);
            console.log('title will be: ' + categoryTitle);
            request
                .get('/api/get_access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if (err)
                        return done(err);

                    accessToken = res.body.accessToken;
                    accessToken.should.not.equal('');

                    request
                        .get('/api/get_category_by_title?access-token=' + accessToken + '&title=' + categoryTitle)
                        .set('Accept', 'application/json')
                        //.expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);

                            res.body.should.have.property('title');
                            title.should.equal(categoryTitle);
                            return done();
                        });

                    return done();
                });

        })

    })

    describe('edit_category', function() {
        this.timeout(15000);

        var categoryTitle = '';
        var accessToken = '';

        it('updated the title if we change the title', function(done){

        })
    })

    describe('autocomplete_category', function() {

        this.timeout(60000);

        var categoryTitle = '';
        var accessToken = '';

        it('should add a categories with similar beginnings and be within the results list', function(done){

            request
                .get('/api/get_access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('accessToken');
                    accessToken = res.body.accessToken;

                    //add 3 categories starting with the same characters;
                    var firstCharacters = Math.random().toString(36).substring(7);
                    var counter = 0;
                    for(var i = 0; i < 3; i++) {
                        categoryTitle = firstCharacters + Math.random().toString(36).substring(7);
                        var postData = {
                            accessToken : accessToken,
                            title: categoryTitle
                        };

                        request
                            .post('/api/add_category')
                            .send(postData)
                            .end(function (err, res) {
                                res.body.should.have.property('title');

                                counter++;
                                if (counter == 3) {

                                    if (err)
                                        return done(err);

                                    request
                                        .get('/api/autocomplete_category?title=' + firstCharacters)
                                        .set('Accept', 'application/json')
                                        .expect('Content-Type', /json/)
                                        .expect(200)
                                        .end(function (err, res) {
                                            if (err)
                                                return done(err);

                                            res.body.should.have.property('categories');
                                        });
                                }
                            });
                    }
                });




        })
    })

    /*
    describe('add_have', function() {
        it('should add category to database', function(done){

        })
    })

    describe('remove_have', function() {
        it('should', function(done){

        })
    })

    describe('get_haves', function() {
        it('should return an array', function(done){

        })
    })


     describe('add_want', function() {
     it('should add category to database', function(done){

     })
     })

     describe('remove_want', function() {
     it('should', function(done){

     })
     })

     describe('get_wants', function() {
     it('should return an array', function(done){

     })
     })

    */
})
