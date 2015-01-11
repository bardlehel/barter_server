/**
 * New node file
 */

var mongoose = require('mongoose');


var Picture = require('./picture.js');
var Property = require('./property.js');
var configDB = require('../../config/database.js');
var conn     = mongoose.createConnection(configDB.climbtime_url);
var Category = require('./category.js')(conn);
var User = require('./user.js')(conn);

var ObjectId = mongoose.Schema.ObjectId;

var concept = mongoose.Schema({
	id : ObjectId,
	title : String,
	version : Number,
	original_version_id : ObjectId,
	description : String,
	author : {type: ObjectId, ref: 'User'},
	pub_date : Date,
	pictures : [Picture],
	default_picture : {type: ObjectId, ref: 'Picture'},
	categories : [Category],
	properties : [Property],
	date_modified : Date
});

exports.schema = concept;


module.exports = function (dbconn) {
	return dbconn.model('concept', concept, 'concept');
};

exports.schema.options.toJSON = {
	transform: function(doc, ret, options) {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
		return ret;
	}
};
