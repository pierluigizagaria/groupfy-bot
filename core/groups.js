const Group = require('./models/group')

function create(telegram_id, callback) {
    Group.findOne({ owner: telegram_id }, (err, doc) => {
        if (err) console.error(err)
        if (doc == null) {
            new Group({
                code: Math.random().toString(31).toUpperCase().substring(2, 7),
                owner: telegram_id,
                users: [telegram_id],
            }).save((err, doc) => {
                if (err) console.error(err)
                callback(doc, alreadyExists = false)
            })
        }
        else callback(doc, alreadyExists = true)
    })
}

function join({ telegram_id, code }, callback) {
    Group.findOneAndUpdate({ code: code }, {
        $push: { users: telegram_id }
    }, (err, doc) => {
        if (err) console.error(err)
        callback(doc)
    })
}

function leave({ telegram_id }, callback) {
    Group.findOneAndUpdate({ users: telegram_id }, {
        $pull: { users: telegram_id }
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

function getGroup(telegram_id, callback) {
    Group.findOne({ users: telegram_id }, (err, doc) => {
        if (err) console.err(err)
        callback(doc, isOwner = doc ? telegram_id == doc.owner : false)
    })
}

function queue({ telegram_id, spotify_uri }, callback) {
    Group.findOneAndUpdate({ users: telegram_id }, {
        $push: { queue: spotify_uri }
    }, (err, doc) => {
        if (err) console.error(err)
        callback(doc)
    })
}

function skip({ telegram_id }, callback) {
    Group.findOneAndUpdate({ users: telegram_id }, {
        $pop: { queue: -1 }
    }, (err, doc) => {
        if (err) console.log(err)
        callback(doc)
    })
}

module.exports = {
    create,
    join,
    leave,
    disband,
    getGroup,
    queue,
    skip
}
