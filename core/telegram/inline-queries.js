const spotifyEndpoint = require('../spotify/api-manager')
const Markup = require('telegraf/markup')

function answerTracks(ctx) {
    spotifyEndpoint.getTracks(ctx.inlineQuery.query, (tracks) => {
        const results = tracks.map(({ id, title, artists, thumbnail, url }) => ({
            type: 'article',
            id: id,
            title: title,
            description: artists,
            thumb_url: thumbnail,
            input_message_content: {
                message_text: `<pre>${title + ', ' + artists}</pre>`,
                parse_mode: 'HTML'
            },
            reply_markup: Markup.inlineKeyboard([
                Markup.urlButton('Open on Spotify', url)
            ])
        }))
        return ctx.answerInlineQuery(results)
    })
}

module.exports = {
    answerTracks
}
