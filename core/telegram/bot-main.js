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
const accounts = require('../accounts')
const groups = require('../groups')
const spotify = require('../spotify/actions')

const joinScene = new Scene('join-scene')
const groupScene = new Scene('group-scene')
const stage = new Stage([joinScene, groupScene])

joinScene.on('text', async (ctx) => {
    groups.join({ telegram_id: ctx.from.id, code: ctx.message.text }, (doc) => {
        if (doc) {
            ctx.initMenu(groupMenu)
            ctx.scene.leave('join-scene')
            ctx.scene.enter('group-scene')
        }
        else {
            ctx.reply('There is no group with this code :(')
            ctx.initMenu(mainMenu)
            ctx.scene.leave()
        }
    })
})

groupScene.on('message', async (ctx) => {
    if (ctx.update.message.reply_markup.inline_keyboard[0][0].url != undefined) {
        let url = ctx.update.message.reply_markup.inline_keyboard[0][0].url
        groups.getGroup(ctx.from.id, (group) => {
            if (group) {
                let uri = `spotify:track:${url.match(/(?<=https:\/\/open.spotify.com\/track\/).+/)}`
                spotify.addToQueue(group.owner, uri, (err) => {
                    ctx.reply(err ? 'Could not queue songs if there are no playing devices.' : 'The song has been added to the queue.')
                })
            } else {
                ctx.scene.leave('group-scene')
                ctx.reply('The group was disbanded')
            }
        })
    }
})

groupScene.start(async (ctx) => {
    ctx.initMenu(groupMenu)
})

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN, { contextType: InlineMenuContext })
bot.use(Session())
bot.use(stage.middleware())

bot.start(async (ctx) => {
    accounts.getUser(ctx.from.id, (doc) => {
        console.log(`User ${doc.telegram_id} started the bot.`)
    })
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
        `<code>${ctx.session.code}</code>\nWrite @groupfybot and then the \n song name to add it to the queue.`,
    inlineKeyboardMarkup: (ctx) => Markup.inlineKeyboard([
        Markup.callbackButton('Disband Group', 'disband-group', !ctx.session.owner),
        Markup.callbackButton('Leave Group', 'leave-group', ctx.session.owner)
    ])
})

bot.action('main-menu', async (ctx) => {
    ctx.editMenu(mainMenu)
    ctx.answerCbQuery()
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
        ctx.answerCbQuery(res ? 'Your Spotify account has been connected.' : 'Could not connect to your spotify account.')
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
        } else if (isOwner) {
            ctx.editMenu(groupMenu)
            ctx.scene.enter('group-scene')
            ctx.answerCbQuery('You already created a group!')
        } else {
            ctx.answerCbQuery('You can\'t create a group if you\'re already in one!')
        }
    })
})

bot.action('join-group', async (ctx) => {
    groups.getGroup(ctx.from.id, (doc, isOwner) => {
        if (doc == null) {
            ctx.editMessageText('What is the group code?', Extra.markup())
            ctx.scene.enter('join-scene')
            ctx.answerCbQuery()
        } else if (!isOwner) {
            ctx.editMenu(groupMenu)
            ctx.scene.enter('group-scene')
            ctx.answerCbQuery('You already joined a group!')
        } else {
            ctx.answerCbQuery('You can\'t join a group if you\'re already in one!')
        }
    })
})

bot.action('disband-group', async (ctx) => {
    groups.disband(ctx.from.id, (doc) => {
        doc ? ctx.editMenu(mainMenu) : ctx.editMessageText('Your group was already disbanded.')
        ctx.scene.leave('group-scene')
        ctx.answerCbQuery()
    })
})

bot.action('leave-group', async (ctx) => {
    groups.leave({ telegram_id: ctx.from.id }, (doc) => {
        doc ? ctx.editMenu(mainMenu) : ctx.editMessageText('You already left this group.')
        ctx.scene.leave('group-scene')
        ctx.answerCbQuery()
    })
})

bot.inlineQuery(/[\w]/, async (ctx) => inlineQuery.answerTracks(ctx))

module.exports = bot