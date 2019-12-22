require('dotenv').config()
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')

const {CustomContext, inlineMenu} = require('./inline-menu-ctx')
const inlineQuery = require('./inline-queries')
const accounts = require('../spotify/accounts-manager')
const groups = require('../groups-manager')

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN, { contextType: CustomContext })

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
    ctx => `<b>Open the link and press done to connect \n your spotify account.</b>`,
    ctx => Markup.inlineKeyboard([
        [Markup.urlButton('Authorize Spotify', accounts.getAuthURL(ctx.from.id))],
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
//Group Menu 
const groupMenu = new inlineMenu(
    ctx => `<code>${ctx.groupCode}</code>\nShare the code to let your friends\njoin the group`,
    ctx => Markup.inlineKeyboard([
        Markup.callbackButton('Disband Group', 'disband-group')
    ])
)

bot.action('main-menu', async (ctx) => {
    accounts.isConnected(ctx.from.id, (res) => {
        ctx.spotifyLogged = res != null ? true : false
        ctx.editMenu(mainMenu)
        ctx.answerCbQuery('')
    })
})

bot.action('connect-spotify-menu', async (ctx) => {
    ctx.editMenu(connectSpotifyMenu)
    ctx.answerCbQuery('')
})

bot.action('spotify-account-menu', async (ctx) => {
    ctx.editMenu(loggedInMenu)
    ctx.answerCbQuery('')
})

bot.action('create-group', async (ctx) => {
    groups.create(ctx.from.id, (doc) => {
        ctx.groupCode = doc.code
        ctx.editMenu(groupMenu)
        ctx.answerCbQuery('')
    })
})

bot.action('spotify-done', async (ctx) => {
    accounts.isConnected(ctx.from.id, (res) => {
        if (res) ctx.answerCbQuery('Your Spotify account has been connected.')
        else ctx.answerCbQuery('Could not connect to your spotify account.')
        ctx.spotifyLogged = res != null ? true : false
        ctx.editMenu(mainMenu)
    })
})

bot.action('spotify-logout', async (ctx) => {
    accounts.disconnect(ctx.from.id, (err) => {
        if (err) {
            ctx.answerCbQuery('An error occured, please try again.')
        } else {
            ctx.answerCbQuery('Your Spotify account has been disconnected.')
            accounts.isConnected(ctx.from.id, (res) => {
                ctx.spotifyLogged = res != null ? true : false
                ctx.editMenu(mainMenu)
            })
        }
    })
})

bot.action('disband-group', async (ctx) => {
    groups.disband(ctx.from.id, () => {
        ctx.answerCbQuery('Your group has been disbanded.')
        accounts.isConnected(ctx.from.id, (res) => {
            ctx.spotifyLogged = res != null ? true : false
            ctx.editMenu(mainMenu)
        })
    })
})

bot.start(async (ctx) => {
    accounts.newUser(ctx.from.id)
    accounts.isConnected(ctx.from.id, (res) => {
        ctx.spotifyLogged = res != null ? true : false
        ctx.initMenu(mainMenu)
    })
})

bot.inlineQuery(/[\w]/, async (ctx) => inlineQuery.answerTracks(ctx))

module.exports = bot