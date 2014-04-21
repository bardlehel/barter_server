/**
 * New node file
 */
var mongoose = require('mongoose');
var dbConfig = require('../../config/database.js');

var user = mongoose.Schema({
	username : String,
	first_name : String,
	last_name : String,
	email : String,
	password : String,
	is_staff : Boolean,
	is_active : Boolean,
	is_superuser : Boolean,
	last_login : Date,
	date_joined : Date//,
	//user_permissions : [{type : ObjectId, ref: 'Permission'}]
});

/*
var Permission = mongoose.Schema({
	name : String,
	content_type
});
*/


module.exports = function(dbconn) {
	return dbconn.model('user', user, 'user');
};

