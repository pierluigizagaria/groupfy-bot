const spotify = require('./spotify/init-api')
const Users = require('./models/user')
const scopes = ['user-read-private','user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing']

function getUser(telegram_id, callback) {
    Users.findOne({ telegram_id: telegram_id }, (err, doc) => {
        if (err) console.error(err);
        else if (doc == null) {
            new Users({
                telegram_id: telegram_id
            }).save((err, doc) => {
                if (err) console.log(err)
                callback(doc)
            })
        } else callback(doc)
    })
}

function getAuthURL(telegram_id) {
    var new_otp = Math.random().toString(31).substring(2, 10) + Math.random().toString(31).substring(2, 10);
    Users.findOne({ telegram_id: telegram_id }, async (err, doc) => {
        if (err) console.error(err);
        if (doc != null) {
            doc.updateOne({
                otp: new_otp
            }, (err) => {
                if (err) console.error(err);
            })
        }
    })
    return spotify.createAuthorizeURL(scopes, new_otp, true)
}

function getSpotifyAccount(telegram_id, callback) {
    Users.findOne({ telegram_id: telegram_id, spotify_connected: true }, (err, doc) => {
        if (err) console.error(err);
        else if (doc) {
            spotify.setRefreshToken(doc.refresh_token)
            spotify.refreshAccessToken((err, data) => {
                if (err) {
                    console.error(err)
                    console.log(`User ${doc.telegram_id} probably revoked Spotify premissions.`)
                    disconnect(doc.telegram_id, (err) => {
                        if (err) console.error(err)
                    })
                    callback(null)
                } else {
                    spotify.setAccessToken(data.body['access_token'])
                    spotify.setRefreshToken(data.body['refresh_token'])
                    spotify.getMe((err, spotify_data) => {
                        if (err) console.error(err)
                        else callback(spotify_data)
                    })
                }
            })
        } else callback(null)
    })
}

function connect(req, res, next) {
    if (!req.query.state || !req.query.code) {
        res.successful = false
        next()
    } else Users.findOne({ otp: req.query.state }, (err, user) => {
        if (err) console.error(err)
        else if (user != null) {
            spotify.authorizationCodeGrant(req.query.code).then((spotify_data, err) => {
                if (err) console.error(err)
                user.updateOne({
                    otp: '',
                    refresh_token: spotify_data.body.refresh_token,
                    spotify_connected: true
                }, (err) => {
                    if (err) console.error(err)
                    else res.successful = true
                    next()
                })
            })
        } else next()
    })
}

function disconnect(telegram_id, callback) {
    Users.findOneAndUpdate({ telegram_id: telegram_id, spotify_connected: true }, {
        spotify_connected: false,
        refresh_token: '',
    }, (err) => {
        if (err) console.error(err)
        else callback(err)
    })
}

module.exports = {
    getUser,
    getAuthURL,
    connect,
    getSpotifyAccount,
    disconnect
}