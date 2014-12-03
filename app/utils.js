

module.exports.unset = function (variable) {
    return variable === null || typeof variable === 'undefined' || variable === undefined || trim(variable) === '';
}

module.exports.hasRouteAccess = function (accessToken, request, response) {
    if (module.exports.unset(accessToken)) {
        response.json({ error: 'no access token supplied' });
        return false;
    }
    if (module.exports.unset(request.session.accessToken)) {
        response.json({ error: 'no session data for access token' })
        return false;
    }

    if (request.session.accessToken != accessToken) {
        response.json({ error: 'incorrect access token' });
        return false;
    }
    
    return true;
}

module.exports.hasParameters = function (request, params) {
    for (var i = 0; i < params.length; i++) {
        if (module.exports.unset(request.query[params[i]])){
            return false;
        }
    }
    
    return true;
}

module.exports.isLoggedIn = function (req, res, next) {
    
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();
    
    // if they aren't redirect them to the home page
    res.redirect('/');
}

