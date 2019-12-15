const spotifyApi = require('./spotify-api')
const scopes = ['user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing']
const Users = require('../models/user')

function tryNewUser(telegram_id) {
    Users.findOne({ telegram_id: telegram_id }, (err, res) => {
        if (err) console.error(err);
        if (res == null) {
            const newUser = new Users({
                telegram_id: telegram_id
            })
            try {
                newUser.save()
                console.log(`${telegram_id} has been created.`)
            } catch (err) { console.error(err) }
        }
        else {
            console.log(`${telegram_id} already exists.`)
        }
    })
}

function getSpotifyAuthURL(telegram_id) {
    var state = Math.random().toString(31).substring(2, 10) + Math.random().toString(31).substring(2, 10);
    Users.findOne({ telegram_id: telegram_id }, async (err, res) => {
        if (err) console.error(err);
        if (res != null) {
            console.log('Generated auth url for ' + telegram_id)
            Users.findOneAndUpdate({ telegram_id: telegram_id }, {
                spotify_state: state
            }, (err) => {
                if (err) console.error(err);
            })
        }
    })
    return spotifyApi.createAuthorizeURL(scopes, state)
}

function isSpotifyConnected(telegram_id, callback) {
    Users.findOne({ telegram_id: telegram_id, spotify_connected: true }, (err, res) => {
        if (err) console.error(err);
        callback(res)
    })
}

function connectSpotify(req, res, next) {
    Users.findOne({ spotify_state: req.query.state }, (err, user_res) => {
        if (err) console.error(err)
        if (user_res != null) {
            console.log('Connecting Spotify account to ' + user_res.telegram_id)
            spotifyApi.authorizationCodeGrant(req.query.code).then((spotify_data, err) => {
                if (err) console.error(err)
                Users.findOneAndUpdate({ telegram_id: user_res.telegram_id }, {
                    spotify_state: '',
                    spotify_token: spotify_data.body['access_token'],
                    spotify_refresh_token: spotify_data.body['refresh_token'],
                    spotify_connected: true
                }, (err) => {
                    if (err) console.error(err)
                    else {
                        res.successful = true
                        next()  
                    } 
                })
            })
        }
        else
            next()
    })
}

function disconnectSpotify(telegram_id, callback) {
    Users.findOneAndUpdate({telegram_id: telegram_id, spotify_connected: true}, {
        spotify_connected: false,
        spotify_token: '',
        spotify_refresh_token: '',
    }, (err) => {
        if (err) console.error(err)
        callback(err)
    })
}

exports.tryNewUser = tryNewUser
exports.getSpotifyAuthURL = getSpotifyAuthURL
exports.connectSpotify = connectSpotify
exports.isSpotifyConnected = isSpotifyConnected
exports.disconnectSpotify = disconnectSpotify