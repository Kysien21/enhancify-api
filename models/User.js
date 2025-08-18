const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    First_name: {
        type: String,
        required: true,
        trim: true
    },

    Last_name: {
        type: String,
        required: true,
        trim: true
    },

    Mobile_No: {
        type: String,
        required: true,
        trim: true
    },
    Email_Address: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    Password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
})

//console.log("Saving new user...");


module.exports = mongoose.model('User', userSchema)