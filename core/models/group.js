const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
    group_code : {
        type: String,
        default: Math.random().toString(31).substring(2, 7).toUpperCase
    },
    creator_id: String,
    users: [String],
    query: [String],
})

module.exports = mongoose.model('Group', groupSchema)
