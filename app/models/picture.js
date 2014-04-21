/**
 * New node file
 */
var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.ObjectId;

var Picture = mongoose.Schema({

	id : ObjectId,
	caption : {type : String, default: ''},
	image_path : { type : String, required : true }
});

module.exports = mongoose.model('Picture', Picture);