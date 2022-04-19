const mongoose = require('mongoose');
const { Schema } = mongoose;

const roomsModel = new Schema({
    roomName: {
        type: String,
        required: false,
    },
    isPrivate: {
        type: Boolean,
        required: true,
    },
    users: {
        type: Array,
        required: true
    },
    isSelf: {
        type: Boolean,
        required: false
    },
    messages: [String],
    threads: [String]
})
/**
 * It is the schema for rooms.
 */
const Rooms = mongoose.model('Rooms', roomsModel);
module.exports = Rooms;