// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var dbConfig   = require('../../config/database.js');
var conn     = mongoose.createConnection(dbConfig.climbtime_url);
var category = require('./category.js')(conn);


var ObjectId = mongoose.Schema.ObjectId;

// define the schema for our user model
var userSchema = mongoose.Schema({
	
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    climbtime		 : {
    	id			 : ObjectId,
    	email		 : String
    },
    
    has : [{type: ObjectId, ref: 'category'}],
	wants: [{type: ObjectId, ref: 'category'}],
    interests: [{type: ObjectId, ref: 'category'}],
	creation_date: Date,
	profile_picture_url: String
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// check if user has want
userSchema.methods.hasWant = function(categoryId) {
	return this.model('User').wants.indexOf(categoryId) >= 0;
};


// create the model for users and expose it to our app
module.exports = function(dbconn) {
	return dbconn.model('User', userSchema, 'users');
};
