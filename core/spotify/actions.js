const api = require('./init-api')
const accounts = require('../accounts')

function getTracks(query, callback) {
    api.clientCredentialsGrant({}, (error, token_res) => {
        if (error) console.error(error)
        api.setAccessToken(token_res.body['access_token'])
        api.searchTracks(query, '', (err, data) => {
            if (err) console.error(err)
            const tracks = data.body.tracks.items
                .map(({ id, name, album: { artists, images: [{ }, { url }, { }] }, external_urls: { spotify } }) => ({
                    id: id,
                    title: name,
                    artists: artists.map(({ name }) => name).join(', '),
                    thumbnail: url,
                    url: spotify
                }))
            return callback(tracks)
        })
    })
}

function addToQueue(telegram_id, uri) {
    accounts.getUser(telegram_id, (user) => {
        api.setRefreshToken(user.spotify_refresh_token)
        api.refreshAccessToken((err, data) => {
            if (err) console.error(err)
            api.setAccessToken(data.body['access_token'])
            api.queue({uri: uri}, (err, res) => {
                if (err) console.error('Probably user is now premium.')
            })
        })
    })
}

module.exports = {
    getTracks,
    addToQueue
}