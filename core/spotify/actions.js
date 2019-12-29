const api = require('./api-setup')
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

function getPlayingTrack(telegram_id) {
    accounts.getUser(telegram_id, (doc) => {
        api.setRefreshToken(doc.spotify_refresh_token)
        api.setAccessToken(doc.spotify_token)
        api.getMyCurrentPlayingTrack((res) => {
            console.log(res)
        })
    })
}


module.exports = {
    getTracks,
    getPlayingTrack
}