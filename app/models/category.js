/**
 * Climbtime Category Model
 */
var mongoose = require('mongoose');
var User = require ('./user.js');
var Feature = require('./feature.js');
var Picture = require('./picture.js');

var ObjectId = mongoose.Schema.ObjectId;

var category = mongoose.Schema({
	id : ObjectId,
	author : {type: ObjectId, ref : 'User'},
	title : String,
	description : String,
	version : Number,
	ancestors : [category],
	ancestor_associations : [Number],
	parent : [category],
	features : [Feature],
	pictures : [Picture],
	default_picture : {type: ObjectId, ref: 'Picture'},
	date_modified : Date
	
});


module.exports = function (dbconn) {
	return dbconn.model('category', category, 'category');
};
