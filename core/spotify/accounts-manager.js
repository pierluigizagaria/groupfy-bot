const spotifyApi = require('./spotify-api')
const Users = require('../models/user')
const scopes = ['user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing']

function newUser(telegram_id) {
    Users.findOne({ telegram_id: telegram_id }, (err, res) => {
        if (err) console.error(err);
        if (res == null) {
            new Users({
                telegram_id: telegram_id
            }).save((err, doc) => {
                if (err) console.log(err)
            })
        }
    })
}

function getAuthURL(telegram_id) {
    var state = Math.random().toString(31).substring(2, 10) + Math.random().toString(31).substring(2, 10);
    Users.findOne({ telegram_id: telegram_id }, async (err, doc) => {
        if (err) console.error(err);
        if (doc != null) {
            doc.updateOne({
                spotify_state: state
            }, (err) => {
                if (err) console.error(err);
            })
        }
    })
    return spotifyApi.createAuthorizeURL(scopes, state, true)
}

function isConnected(telegram_id, callback) {
    Users.findOne({ telegram_id: telegram_id, spotify_connected: true }, (err, doc) => {
        if (err) console.error(err);
        callback(doc)
    })
}

function connect(req, res, next) {
    if (!req.query.state || !req.query.code) {
        res.successful = false
        next()
    }
    else Users.findOne({ spotify_state: req.query.state }, (err, user) => {
        if (err) console.error(err)
        if (user != null) {
            spotifyApi.authorizationCodeGrant(req.query.code).then((spotify_data, err) => {
                if (err) console.error(err)
                user.updateOne({
                    spotify_state: '',
                    spotify_token: spotify_data.body['access_token'],
                    spotify_refresh_token: spotify_data.body['refresh_token'],
                    spotify_connected: true
                }, (err) => {
                    if (err) console.error(err)
                    else res.successful = true
                    next()
                })
            })
        }
        else next()
    })
}

function disconnect(telegram_id, callback) {
    Users.findOneAndUpdate({ telegram_id: telegram_id, spotify_connected: true }, {
        spotify_connected: false,
        spotify_token: '',
        spotify_refresh_token: '',
    }, (err) => {
        if (err) console.error(err)
        callback(err)
    })
}

module.exports = {
    newUser,
    getAuthURL,
    connect,
    isConnected,
    disconnect
}