//posts made to channels

var mongoose = require('mongoose');

var postSchema = mongoose.Schema( {
    user_id : { type: ObjectId, ref: 'barteruser' },
    date_posted: Date,
    body: String,
    post_type: String,
    video: String,
    image: String,
    categories: [{ type: ObjectId, ref: 'barteruser' }] //categories act as #channels
});

module.exports = mongoose.model('Post', postSchema);