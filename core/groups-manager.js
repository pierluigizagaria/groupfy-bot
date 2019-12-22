const Group = require('./models/group')

function create(telegram_id, callback) {
    Group.findOne({ owner: telegram_id }, (err, doc) => {
        if (err) console.error(err)
        if (doc == null) {
            new Group({
                owner: telegram_id,
                code: Math.random().toString(31).toUpperCase().substring(2, 7)
            }).save((err, doc) => {
                if (err) console.error(err)
                callback(doc)
            })
        }
        else callback(doc)
    })
}

function join(telegram_id, code, callback) {
    Group.findOneAndUpdate({ code }, {
        $push: { users: telegram_id }
    }, (err, doc) => {
        if (err) console.error(err)
        callback(doc)
    })
}

function disband(telegram_id, callback) {
    Group.findOneAndDelete({ owner: telegram_id }, (err, doc) => {
        if (err) console.err(err)
        callback(doc)
    })
}

module.exports = {
    create,
    join,
    disband
}
