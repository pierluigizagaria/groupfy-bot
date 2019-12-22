const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
    owner: String,
    code : {
        type: String,
        unique: true,
        required: true
    },
    users: {
        type: [String],
        unique: true
    },
    query: [String],
})

module.exports = mongoose.model('Group', groupSchema)
