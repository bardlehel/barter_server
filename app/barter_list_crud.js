/**
 * Barter Lists Crud  (includes haves, wants and interests list
 * Created by dorian lehel white on 1/11/15.
 */
var mongoose = require('mongoose');
var configDB = require('../config/database.js');
var barterConn = mongoose.createConnection(configDB.barter_url);
var climbtimeConn = mongoose.createConnection(configDB.climbtime_url);
var ClimbtimeUser = require('./models/climbtimeuser.js')(climbtimeConn);
var BarterUser = require('./models/user.js')(barterConn);
var Category = require('./models/category.js')(climbtimeConn);
var Concept =  require('./models/concept.js')(climbtimeConn);
var utils = require('./utils.js');

function getList (list, request, response) {

    if (!utils.hasRouteAccess(request.query['access-token'], request, response)) return;

    BarterUser.findOne({ 'climbtime_id' : request.session.climbtimeId }, function (error, user) {
        if (!user) return response.json({ message: 'no user found' });

        response.json(user[list]);
    });
};

module.exports.getHaves = function (request, response) {
    return getList('has', request, response);
};

module.exports.getWants = function (request, response) {
    return getList('wants', request, response);
};

function postList(list, request, response) {

    if (!utils.hasRouteAccess(request.body['access-token'], request, response)) return;
    if (!utils.hasParameters(request.body, ['categories'], response)) return;
    if (utils.hasIllegalCharacters(request.body, ['categories'], response)) return;

    BarterUser.findOne({ 'climbtime_id' : request.session.climbtimeId }, function (error, user) {
        if (!user) return response.json({ message: 'no user found' });

        //only up to 10 listing for now...
        if (user[list].length >= 10) return response.json({ error : 'list capacity reached'});

        var newCategoriesList = [];

        //get categories that are in the list
        Category.find()
            .where('_id')
            .in(request.body.categories)
            .exec(function (err, categories) {
                if(err) return response.json({error : err});
                if(!categories) return response.json({ error : 'no categories matched ids given'});

                //get each category's id
                //check if its in the user's has list,
                //if not, add it
                for (var i = 0; i < categories.length; i++) {
                    var found = false;
                    for (var j = 0; j < user[list].length; j++) {
                        if (user[list][j] == categories[i]._id) {
                            found = true;
                            break;
                        }
                    }

                    if(!found) user[list].push(request.body.categories[i]);
                }

                user.save();
                return response.json(user[list]);
            });
    });
}

module.exports.postHaves = function (request, response) {
    return postList('has', request, response);
};

module.exports.postWants = function (request, response) {
    return postList('wants', request, response);
};

//remove from list

function deleteList (list, request, response) {
    if (!utils.hasRouteAccess(request.body['access-token'], request, response)) return;
    if (!utils.hasParameters(request.body, ['categories'], response)) return;
    if (utils.hasIllegalCharacters(request.body, ['categories'], response)) return;

    BarterUser.findOne({ 'climbtime_id' : request.session.climbtimeId }, function (error, user) {
        if (!user) response.json({ message: 'no user found' });

        if (user[list].length == 0) return response.json({ error : 'list is empty; nothing to delete'});

        for(var i = 0; i < request.body.categories; i++) {
            //check to make sure category isn't in list
            var categoryIsInList = false;
            for(var j = 0; j < user[list].length; j++) {
                if (request.body.categories[i] == user[list][j].id) {
                    categoryIsInList = true;
                    break;
                }
            }

            if (categoryIsInList) user[list].splice(j, 1);
        }

        user.save();

        return response.json(user[list]);
    });
};

module.exports.deleteHaves = function (request, response) {
    return deleteList('has', request, response);
};

module.exports.deleteWants = function (request, response) {
    return deleteList('wants', request, response);
};
