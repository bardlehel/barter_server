/**
 * New node file
 */
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    //_id : the user id
    facebook         : {
        userId       : String,
        token        : String,
    },
    climbtime		 : {
        email		 : String,
        password     : String
    },
    
    access_token: String,
    access_token_date: Date,
    
	username : String,
	first_name : String,
	last_name : String,
	email : String,
	password : String,
	is_staff : Boolean,
	is_active : Boolean,
	is_superuser : Boolean,
	last_login : Date,
    date_joined : Date,
    points_earned : Number
	//user_permissions : [{type : ObjectId, ref: 'Permission'}]
});

/*
var Permission = mongoose.Schema({
	name : String,
	content_type
});
*/


module.exports = function(dbconn) {
	return dbconn.model('ClimbtimeUser', userSchema);
};

