const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const InlineMenu = require('./inline-menu')

//Main Menu
const mainMenu = new InlineMenu({
    initContext: (ctx, next) => {
        accounts.getSpotifyAccount(ctx.from.id, (spotify_data) => {
            ctx.session.logged = spotify_data ? true : false
            if (spotify_data) {
                ctx.session.premium = spotify_data.body.product == 'premium'
            } else ctx.session.premium = false
            next()
        })
    },
    html: (ctx) => `<b>Ciao ${ctx.from.username}</b>`,
    inlineKeyboardMarkup: (ctx) => Markup.inlineKeyboard([
        [Markup.callbackButton('Connetti Spotify', 'connect-spotify-menu', ctx.session.logged)],
        [Markup.callbackButton('Account Spotify', 'spotify-account-menu', !ctx.session.logged)],
        [Markup.callbackButton('Crea Gruppo', 'create-group', !(ctx.session.logged && ctx.session.premium))],
        [Markup.callbackButton('Entra Gruppo', 'join-group')]
    ])
})

//Connect Spotify Menu
const connectSpotifyMenu = new InlineMenu({
    html: `Autorizza Spotify e dopo premi il pulsante <b>Fatto</b>.`,
    inlineKeyboardMarkup: (ctx) => Markup.inlineKeyboard([
        [Markup.urlButton('Autorizza Spotify', accounts.getAuthURL(ctx.from.id))],
        [Markup.callbackButton('Fatto', 'spotify-done')]
    ])
})

//Logged In Menu
const loggedInMenu = new InlineMenu({
    initContext: (ctx, next) => {
        accounts.getSpotifyAccount(ctx.from.id, (spotify_data) => {
            if (spotify_data) {
                ctx.session.display_name = spotify_data.body.display_name
                ctx.session.product = spotify_data.body.product == 'premium' ? 'Premium' : 'Gratis'
            }
            next()
        })
    },
    html: (ctx) => `Utente: <pre>${ctx.session.display_name}</pre>\nStato: <pre>${ctx.session.product}</pre>`,
    inlineKeyboardMarkup: () => Markup.inlineKeyboard([
        [Markup.callbackButton('Logout', 'spotify-logout')],
        [Markup.callbackButton('Indietro', 'main-menu')],
    ])
})

//Group Menu 
const groupMenu = new InlineMenu({
    initContext: (ctx, next) => {
        groups.getGroup(ctx.from.id, (doc, isOwner) => {
            ctx.session.code = doc.code
            ctx.session.owner = isOwner
            next()
        })
    },
    html: (ctx) => ctx.session.owner ?
        `<code>${ctx.session.code}</code>\nCondividi il codice e fa entrare i tuoi amici.\nScrivi @groupfybot <code>&lt;titolo canzone&gt;</code> e seleziona il brano desiderato per aggiungerlo in coda` :
        `<code>${ctx.session.code}</code>\nScrivi @groupfybot <code>&lt;titolo canzone&gt;</code> e seleziona il brano desiderato per aggiungerlo in coda`,
    inlineKeyboardMarkup: (ctx) => Markup.inlineKeyboard([
        Markup.callbackButton('Sciogli il gruppo', 'disband-group', !ctx.session.owner),
        Markup.callbackButton('Esci dal gruppo', 'leave-group', ctx.session.owner)
    ])
})

module.exports = mainMenu
module.exports = connectSpotifyMenu
module.exports = loggedInMenu
module.exports = groupMenu