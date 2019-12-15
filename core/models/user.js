const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    telegram_id: {
        type: String,
        unique: true,
        required: true
    },
    spotify_token: String,
    spotify_refresh_token: String,
    spotify_state: String,
    spotify_connected: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('User', userSchema)

