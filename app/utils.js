

module.exports.unset = function (variable) {
    return variable === null
        || typeof variable === 'undefined'
        || variable === undefined
        || (typeof(variable) === 'string' && variable.trim() === '');
};

module.exports.hasRouteAccess = function (accessToken, request, response) {
    if (module.exports.unset(accessToken)) {
        response.json({ error: 'no access token supplied' });
        return false;
    }
    if (module.exports.unset(request.session.accessToken)) {
        response.json({ error: 'no session data for access token' });
        return false;
    }

    if (request.session.accessToken != accessToken) {
        console.log('\n  ');
        console.log('session access token:' + request.session.accessToken);
        console.log('\n  ');
        console.log('param access token:' + accessToken);
        response.json({ error: 'incorrect access token' });
        return false;
    }
    
    return true;
};

module.exports.hasParameters = function (requestParams, params, response) {
    for (var i = 0; i < params.length; i++) {
        if (module.exports.unset(requestParams[params[i]])){
            response.json({error: 'lacking ' + params[i] + ' as a parameter.'})
            return false;
        }
    }
    
    return true;
};

module.exports.hasIllegalCharacters = function(requestParams, params, response) {

    var regex = /["'~`!@#$%^&*()=+.]+/g;
    var searchString = '';

    for (var i = 0; i < params.length; i++) {

        if (requestParams[params[i]] === undefined)
            continue;
        else if (requestParams[params[i]].constructor === Array) {

            var array = requestParams[params[i]];

            for(var j = 0; j < array.length; j++ ) {
                if (array[j].match(regex)) {
                    response.json({error: 'parameter ' + params[i] + ' has illegal characters.'});
                    return true;
                }
            }
        }
        else if (requestParams[params[i]].match(regex)) {
            response.json({error: 'parameter ' + params[i] + ' has illegal characters.'});
            return true;
        }
    }

    return false;
};

module.exports.isLoggedIn = function (req, res, next) {
    
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();
    
    // if they aren't redirect them to the home page
    res.redirect('/');
};

