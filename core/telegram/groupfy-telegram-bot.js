require('dotenv').config()
const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const inlineMenu = require('./inline-menu')
const CustomContext = require('./inline-menu-ctx')
const accountManager = require('../spotify/account-manager')

const bot = new Telegraf(process.env.BOT_TOKEN, { contextType: CustomContext })

//Main Menu
const mainMenu = new inlineMenu(
    ctx => `<b>Ciao ${ctx.from.username}</b>`,
    ctx => Markup.inlineKeyboard([
        [Markup.callbackButton('Connect Spotify', 'connect-spotify-menu', ctx.spotifyLogged)],
        [Markup.callbackButton('Spotify Account', 'spotify-account-menu', !ctx.spotifyLogged)],
        [Markup.callbackButton('Create Group', 'create-group', !ctx.spotifyLogged)],
        [Markup.callbackButton('Join Group', 'join-group')]
    ])
)
//Connect Spotify Menu
const connectSpotifyMenu = new inlineMenu(
    ctx => `<b>Open the link and press done to connect your spotify account.</b>`,
    ctx => Markup.inlineKeyboard([
        [Markup.urlButton('Authorize Spotify', accountManager.getSpotifyAuthURL(ctx.from.id))],
        [Markup.callbackButton('Done', 'spotify-done')]
    ])
)
//Logged In Menu
const loggedInMenu = new inlineMenu(
    ctx => `<b>${ctx.from.username}'s Spotify Account!</b>`,
    ctx => Markup.inlineKeyboard([
        [Markup.callbackButton('Logout', 'spotify-logout')],
        [Markup.callbackButton('Back', 'main-menu')],
    ])
)

bot.action('main-menu', async (ctx) => {
    accountManager.isSpotifyConnected(ctx.from.id, (res) => {
        ctx.spotifyLogged = res != null ? true : false
        ctx.editMenu(mainMenu)
    })
})

bot.action('connect-spotify-menu', async (ctx) => {
    ctx.editMenu(connectSpotifyMenu)
})

bot.action('spotify-account-menu', async (ctx) => {
    ctx.editMenu(loggedInMenu)
})

bot.action('spotify-done', async (ctx) => {
    accountManager.isSpotifyConnected(ctx.from.id, (res) => {
        if (res) ctx.answerCbQuery('Your Spotify account has been connected.')
        else
            ctx.answerCbQuery('Could not connect to your spotify account.')
        ctx.spotifyLogged = res != null ? true : false
        ctx.editMenu(mainMenu)
    })
})

bot.action('spotify-logout', async (ctx) => {
    accountManager.disconnectSpotify(ctx.from.id, (err) => {
        if (err) {
            ctx.answerCbQuery('An error occured, please try again.')
        } else {
            ctx.answerCbQuery('Your Spotify account has been disconnected.')
            accountManager.isSpotifyConnected(ctx.from.id, (res) => {
                ctx.spotifyLogged = res != null ? true : false
                ctx.editMenu(mainMenu)
            })
        }
    })
})

bot.start(async (ctx) => {
    accountManager.tryNewUser(ctx.from.id)
    accountManager.isSpotifyConnected(ctx.from.id, (res) => {
        ctx.spotifyLogged = res != null ? true : false
        ctx.initMenu(mainMenu)
    })
})

module.exports = bot