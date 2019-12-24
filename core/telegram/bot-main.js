require('dotenv').config()
const Telegraf = require('telegraf')
const Session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')

const InlineMenuContext = require('./inline-menu-ctx')
const InlineMenu = require('./inline-menu')
const inlineQuery = require('./inline-queries')
const accounts = require('../spotify/accounts-manager')
const groups = require('../groups-manager')

const joinScene = new Scene('join-scene')
const groupScene = new Scene('group-scene')
const stage = new Stage([joinScene, groupScene])

joinScene.on('text', (ctx) => {
    groups.join({ telegram_id: ctx.from.id, code: ctx.message.text }, (doc) => {
        if (doc) {
            ctx.initMenu(groupMenu)
            ctx.scene.leave('join-scene')
            ctx.scene.enter('group-scene')
        }
        else {
            ctx.reply('There is no group with this code :(')
            ctx.scene.leave()
        }
    })
})

groupScene.on('text', (ctx) => {
    ctx.reply('Command Received!')
})

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN, { contextType: InlineMenuContext })
bot.use(Session())
bot.use(stage.middleware())

bot.start(async (ctx) => {
    accounts.newUser(ctx.from.id)
    ctx.initMenu(mainMenu)
})

//Main Menu
const mainMenu = new InlineMenu({
    initContext: (ctx, next) => {
        accounts.isConnected(ctx.from.id, (res) => {
            ctx.spotifyLogged = res != null ? true : false
            next()
        })
    },
    html: (ctx) => `<b>Ciao ${ctx.from.username}</b>`,
    inlineKeyboardMarkup: (ctx) => Markup.inlineKeyboard([
        [Markup.callbackButton('Connect Spotify', 'connect-spotify-menu', ctx.spotifyLogged)],
        [Markup.callbackButton('Spotify Account', 'spotify-account-menu', !ctx.spotifyLogged)],
        [Markup.callbackButton('Create Group', 'create-group', !ctx.spotifyLogged)],
        [Markup.callbackButton('Join Group', 'join-group')]
    ])
})

//Connect Spotify Menu
const connectSpotifyMenu = new InlineMenu({
    html: `<b>Open the link and press done to connect \n your spotify account.</b>`,
    inlineKeyboardMarkup: (ctx) => Markup.inlineKeyboard([
        [Markup.urlButton('Authorize Spotify', accounts.getAuthURL(ctx.from.id))],
        [Markup.callbackButton('Done', 'spotify-done')]
    ])
})

//Logged In Menu
const loggedInMenu = new InlineMenu({
    html: (ctx) => `<b>${ctx.from.username}'s Spotify Account!</b>`,
    inlineKeyboardMarkup: () => Markup.inlineKeyboard([
        [Markup.callbackButton('Logout', 'spotify-logout')],
        [Markup.callbackButton('Back', 'main-menu')],
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
    `<code>${ctx.session.code}</code>\nShare the code to let your friends\njoin the group` :
    `You joined the group: <code>${ctx.session.code}</code>`,
    inlineKeyboardMarkup: (ctx) => Markup.inlineKeyboard([
        Markup.callbackButton('Disband Group', 'disband-group', !ctx.session.owner),
        Markup.callbackButton('Leave Group', 'leave-group', ctx.session.owner)
    ])
})

bot.action('main-menu', async (ctx) => {
    ctx.editMenu(mainMenu)
    ctx.answerCbQuery('')
})

bot.action('connect-spotify-menu', async (ctx) => {
    ctx.editMenu(connectSpotifyMenu)
    ctx.answerCbQuery()
})

bot.action('spotify-account-menu', async (ctx) => {
    ctx.editMenu(loggedInMenu)
    ctx.answerCbQuery()
})

bot.action('spotify-done', async (ctx) => {
    accounts.isConnected(ctx.from.id, (res) => {
        if (res) ctx.answerCbQuery('Your Spotify account has been connected.')
        else ctx.answerCbQuery('Could not connect to your spotify account.')
    })
    ctx.editMenu(mainMenu)
})

bot.action('spotify-logout', async (ctx) => {
    accounts.disconnect(ctx.from.id, (err) => {
        if (err) {
            ctx.answerCbQuery('An error occured, please try again.')
        } else {
            ctx.answerCbQuery('Your Spotify account has been disconnected.')
            ctx.editMenu(mainMenu)
        }
    })
})

bot.action('create-group', async (ctx) => {
    groups.getGroup(ctx.from.id, (doc, isOwner) => {
        if (doc == null) {
            groups.create(ctx.from.id, (doc) => {
                ctx.editMenu(groupMenu)
                ctx.scene.enter('group-scene')
                ctx.answerCbQuery()
            })
        } else {
            ctx.editMenu(groupMenu)
            ctx.scene.enter('group-scene')
            ctx.answerCbQuery('You already joined a group!')
            
        }
    })
})

bot.action('join-group', async (ctx) => {
    groups.getGroup(ctx.from.id, (doc, isOwner) => {
        if (doc == null) {
            ctx.reply('What is the group code?', Extra.markup(Markup.forceReply()))
            ctx.scene.enter('join-scene')
            ctx.answerCbQuery()
        } else {
            ctx.editMenu(groupMenu)
            ctx.scene.enter('group-scene')
            ctx.answerCbQuery('You already joined a group!')
        }
    })
})

bot.action('disband-group', async (ctx) => {
    groups.disband(ctx.from.id, (doc) => {
        doc ? ctx.answerCbQuery('Your group has been disbanded.') : ctx.answerCbQuery('Your group was already disbanded.')
        ctx.scene.leave('group-scene')
        ctx.editMenu(mainMenu)
    })
})

bot.action('leave-group', async (ctx) => {
    groups.leave({ telegram_id: ctx.from.id }, (doc) => {
        doc ? ctx.answerCbQuery('You left the group') : ctx.answerCbQuery('You already left the group!')
        ctx.scene.leave('group-scene')
        ctx.editMenu(mainMenu)
    })
})

bot.inlineQuery(/[\w]/, async (ctx) => inlineQuery.answerTracks(ctx))

module.exports = bot