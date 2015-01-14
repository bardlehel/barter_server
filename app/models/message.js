//covers private messaging
var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({
    user_id : { type: ObjectId, ref: 'barteruser' },
    date_posted: Date,
    body: String,
    recipients: [{ type: ObjectId, ref: 'barteruser' }]
});

module.exports = mongoose.model('Message', messageSchema);