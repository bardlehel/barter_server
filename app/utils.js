exports.

exports.unset = function(variable) {
        return variable === null || typeof variable === 'undefined' || variable === undefined || trim(variable) === '';
}

function hasRouteAccess(accessToken, request, response) {
        if(unset(accessToken)) throw 'accessToken not set';

        if (request.session.accessToken != accessToken) {
                respose.json({result: 'failure', reason: 'incorrect access token'});
                return true;
        }

        return false;
}

exports.hasParameters = function(request, params) {
        for(var i = 0; i < params.length; i++)
                if(unset(request.query[params[i]))
                        return false;

        return true;
}

exports.isLoggedIn = function (req, res, next) {

        // if user is authenticated in the session, carry on 
        if (req.isAuthenticated())
                return next();

        // if they aren't redirect them to the home page
        res.redirect('/');
}

