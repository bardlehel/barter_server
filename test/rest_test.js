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

var server = require('../server.js');
var assert = require("assert"); // node.js core module
var request = require('supertest'); //used for http calls for REST
var should = require("should");
var mongoose = require('mongoose');
var express = require('express');
var app = express();
var configDB = require('../config/database.js');
var barterConn = '';
var climbtimeConn = '';
var ClimbtimeUser = null;
var facebookToken = "CAADs8OVZALMEBAAEp9CqFoNufCEFpVCCVe0V4Skk4zKiNtsg3egdIcSA5gwSP8FVuiMlfSl6V1ERvFR4b4vU4ARSEb7JQw3i5dwf4a1upJPiZCFB6yUcWdhJBeiHldYLznvRMbZBEWMicaDpQNZBHZCRn0KlGQpq7o69O3EgPuWKMvZB428VN6VD31jC42XT2HSJh8Waw5elCdXIrKTaux";
var facebookId = "579417488841227";
var http = require('http');

describe('REST', function () {

    before(function (done) {
        // In our tests we use the test db
        // barterConn = mongoose.createConnection(configDB.barter_url);
        climbtimeConn = mongoose.createConnection(configDB.climbtime_url);
        ClimbtimeUser = require("../app/models/user.js")(climbtimeConn);

        request = request('http://localhost:8082');

        done();
    });

    describe('get_access_token', function () {
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

                    res.body.should.have.property('access-token');
                    //get access token from db and check value
                    ClimbtimeUser.findOne({ 'access_token' : res.body['access-token'] }, function (error, user) {
                        if (!user) return done(error);

                        res.body['access-token'].should.equal(user.access_token);
                        facebookId.should.equal(user.facebook.userId);
                        console.log(res.body['access-token']);
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
})
