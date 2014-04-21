/**
 * Property.js
 */
var mongoose = require('mongoose');
var Feature = require('feature.js');

var Property = mongoose.Schema({
	property_id : ObjectId,
	feature : Feature,
	value : String
});

module.exports = mongoose.model('Property', Property);
