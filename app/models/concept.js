/**
 * New node file
 */

var mongoose = require('mongoose');
var User = require('user.js');
var Category = require('category.js');
var Picture = require('picture.js');


var Concept = mongoose.Schema({
	id : ObjectId,
	title : String,
	version : int,
	original_version_id : ObjectId,
	description : String,
	author : User,
	pub_date : Date,
	pictures : [Picture],
	default_picture : Picture,
	categories : [Category],
	properties : [Property],
	date_modified : Date
});

module.exports = mongoose.model('Concept', Concept);
