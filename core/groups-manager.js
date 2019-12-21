const Group = require('./models/group')

function create( telegram_id ) {
    const newGroup = new Group({
        creator_id: telegram_id,
    })
    newGroup.save((err, doc) => {
        if (err) console.log(err)
        console.log(doc)
    })
}

module.exports = {
    create
}
