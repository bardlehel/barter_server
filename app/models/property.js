/**
 * Property.js
 */
var mongoose = require('mongoose');
var Feature = require('./feature.js');

var ObjectId = mongoose.Schema.ObjectId;

var Property = mongoose.Schema({
	property_id : ObjectId,
	feature : {type: ObjectId, ref: 'Feature'},
	value : String
});



module.exports = mongoose.model('Property', Property);
