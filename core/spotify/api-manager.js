const api = require('./spotify-api')

function getTracks(query, callback) {
    api.clientCredentialsGrant({}, (error, token_res) => {
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

exports.getTracks = getTracks