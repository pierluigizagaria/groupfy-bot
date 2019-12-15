const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
    creator_id: {
        type: String,
        unique: true,
        required: true
    },
    users: [String],
    query: [String],
})

module.exports = mongoose.model('Group', groupSchema)
