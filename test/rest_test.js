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
var agent = request.agent(server);
var assert = require("assert"); // node.js core module

var should = require("should");
var mongoose = require('mongoose');
var express = require('express');
var app = express();
var configDB = require('../config/database.js');
var climbtimeConn = '';
var ClimbtimeUser = null;
var Category = null;
var facebookToken = "CAADs8OVZALMEBAKiTyzNjDvnIZCpCkA61EoQAzo4oeQA96lbTFiZBZCfOKtyLZADZCvTQBJatjiUZCaT4EjY1MWUMMKvzYa5ZALxSseXww0jRqlfPe8xXdhfZBM259FsTm9yp4srHWLD2X3R2oxGkSbyFbDBTRy3D1I7yzX6y86aZCiLp2eQghEYaJ5GDlLqrPWsDDHKXlQCPoH71ZAFZCdaNotL";
var facebookId = "1384707158489078";
var http = require('http');

describe('REST', function () {

    before(function (done) {
        // In our tests we use the test db
        // barterConn = mongoose.createConnection(configDB.barter_url);
        climbtimeConn = mongoose.createConnection(configDB.climbtime_url);
        ClimbtimeUser = require("../app/models/user.js")(climbtimeConn);
        Category = require("../app/models/category.js")(climbtimeConn);
        request = request('http://localhost:8082');

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
        this.timeout(15000);

        var categoryTitle = 'Test Title';

        it('should return error if no access token is supplied', function(done){
            request
                .get('/api/add_category?title=' + categoryTitle)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err)
                        return done(err);

                    res.body.should.have.property('error');
                    done();
                });

        })

        it('should return an error if no title is specified', function(done){

            var categoryTitle = "";
                request
                .get('/api/add_category?title=' + categoryTitle)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err)
                        return done(err);

                    res.body.should.have.property('error');
                    done();
                });
        })

        it('should return an error if title contains illegal characters', function(done){

            var categoryTitle = "test%'";
            request
                .get('/api/add_category?title=' + categoryTitle)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err)
                        return done(err);

                    res.body.should.have.property('error');
                    done();
                });
        })


        it('should add category to database', function(done) {
            var accessToken = '';

            agent
                .get('/api/get_access_token?facebook-token=' + facebookToken + '&facebook-id=' + facebookId)
                .end(function(error, response){
                    if(error) done(error);

                    response.body.should.have.property('accessToken');
                    console.log(response.body.accessToken);

                    categoryTitle = Math.random().toString(36).substring(7);

                    agent
                        .get('/api/add_category?access-token=' + response.body.accessToken + 'title=' + categoryTitle)
                        .set('Accept', 'application/json')
                        //.expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);

                            res.body.should.have.property('title');

                            Category.findOne({ title : categoryTitle }, function (error, user) {
                                if (!user) return done(error);

                                user.title.should.equal(categoryTitle);
                                done();
                            });

                        });

                });


        })
    })

    describe('get_category_by_title', function() {
        this.timeout(15000);

        it('should return an error if no title is specified', function(done){

        })

        it('should return an error if title contains illegal characters', function(done){

        })

        it('should return a valid category with good title', function(done){

        })
    })
    /*
    describe('autocomplete_category', function() {
        it('should add category to database', function(done){

        })
    })

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
