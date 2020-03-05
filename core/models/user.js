const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    telegram_id: {
        type: String,
        unique: true,
        required: true
    },
    refresh_token: String,
    otp: String,
    spotify_connected: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('User', userSchema)

