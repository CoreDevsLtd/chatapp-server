const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    userName: {
        type: String,
        required: true
    }
})
/**
 * It is the schema for users.
 */
const userModel = mongoose.model('Users', userSchema);
module.exports = userModel;