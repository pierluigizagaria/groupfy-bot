const Group = require('./models/group')

function create( telegram_id , callback) {
    Group.findOne({owner: telegram_id }, (err, doc) => {
        if (err) console.error(err)
        if (doc == null) {
            new Group({
                owner: telegram_id,
                code: Math.random().toString(31).toUpperCase().substring(2, 7)
            }).save((err, doc) => {
                if (err) console.log(err)
                callback(doc)
            })
        }
        else callback(doc)
    })
}

module.exports = {
    create
}
