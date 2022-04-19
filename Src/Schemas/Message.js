const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: false,
    },
    message: {
        type: String,
        required: false,
    },
    timeStamp: {
        type: Number,
        default: Date.now,
    },
    isThread: {
        type: Boolean,
        required: false
    },
    parent: {
        type: String,
        required: false
    }
})
/**
 * It is the schema for messages.
 */
const messageModel = mongoose.model('Message', messageSchema);
module.exports = messageModel;