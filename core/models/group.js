const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
    code : {
        type: String,
        unique: true,
        required: true
    },
    owner: String,
    users: [String],
    query: [String],
})

module.exports = mongoose.model('Group', groupSchema)
