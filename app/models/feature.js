/**
 * New node file
 */

var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.ObjectId;

var Feature = mongoose.Schema({
	id : ObjectId,
	title : {type: String, required: true},
	is_property : Boolean,
	property_type : String
});

module.exports = mongoose.model('Feature', Feature);