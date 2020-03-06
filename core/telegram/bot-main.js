require('dotenv').config()
const Telegraf = require('telegraf')
const Session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')

const menu = require('bot-menu')

const InlineMenuContext = require('./inline-menu-ctx')
const inlineQuery = require('./inline-queries')
const accounts = require('../accounts')
const groups = require('../groups')
const spotify = require('../spotify/actions')

const joinScene = new Scene('join-scene')
const groupScene = new Scene('group-scene')
const stage = new Stage([joinScene, groupScene])

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN, { contextType: InlineMenuContext })
bot.use(Session())
bot.use(stage.middleware())

bot.start((ctx) => {
    accounts.getUser(ctx.from.id, (doc) => {
        console.log(`User ${doc.telegram_id} started the bot.`)
    })
    ctx.initMenu(menu.mainMenu)
})

bot.action('main-menu', (ctx) => {
    ctx.editMenu(menu.mainMenu)
    ctx.answerCbQuery()
})

bot.action('connect-spotify-menu', (ctx) => {
    ctx.editMenu(menu.connectSpotifyMenu)
    ctx.answerCbQuery()
})

bot.action('spotify-account-menu', (ctx) => {
    accounts.getSpotifyAccount(ctx.from.id, (spotify_data) => {
        spotify_data ? ctx.editMenu(menu.loggedInMenu) : ctx.editMenu(menu.mainMenu)
        ctx.answerCbQuery()
    })
})

bot.action('spotify-done', (ctx) => {
    accounts.getSpotifyAccount(ctx.from.id, (spotify_data) => {
        ctx.answerCbQuery(spotify_data ? 'Il tuo account Spotify è stato connesso.' : 'Impossibile connettere il tuo account Spotify.')
    })
    ctx.editMenu(menu.mainMenu)
})

bot.action('spotify-logout', (ctx) => {
    accounts.disconnect(ctx.from.id, (err) => {
        if (err) {
            ctx.answerCbQuery('Errore, per favore riprova.')
        } else {
            ctx.answerCbQuery('Il tuo account Spotify è stato disconnesso.')
            ctx.editMenu(menu.mainMenu)
        }
    })
})

bot.action('create-group', (ctx) => {
    groups.getGroup(ctx.from.id, (doc, isOwner) => {
        if (doc == null) {
            groups.create(ctx.from.id, (doc) => {
                ctx.initMenu(menu.groupMenu)
                ctx.scene.enter('group-scene')
                ctx.answerCbQuery()
            })
        } else if (isOwner) {
            ctx.initMenu(menu.groupMenu)
            ctx.scene.enter('group-scene')
            ctx.answerCbQuery('Hai già creato un gruppo!')
        } else {
            ctx.answerCbQuery('Non puoi creare un gruppo se ne sei già in uno!')
        }
    })
})

bot.action('join-group', (ctx) => {
    groups.getGroup(ctx.from.id, (doc, isOwner) => {
        if (doc == null) {
            ctx.reply('Qual è il codice del gruppo?')
            ctx.scene.enter('join-scene')
            ctx.answerCbQuery()
        } else if (!isOwner) {
            ctx.initMenu(menu.groupMenu)
            ctx.scene.enter('group-scene')
            ctx.answerCbQuery('Sei già in un gruppo!')
        } else {
            ctx.answerCbQuery('Non puoi entrare in un gruppo se ne sei già in uno!')
        }
    })
})

bot.action('disband-group', (ctx) => {
    groups.disband(ctx.from.id, (doc) => {
        doc ? ctx.editMessageText('Il gruppo è stato sciolto.') : ctx.editMessageText('Hai già sciolto questo gruppo.')
        ctx.scene.leave('group-scene')
        ctx.answerCbQuery()
    })
})

bot.action('leave-group', (ctx) => {
    groups.leave({ telegram_id: ctx.from.id }, (doc) => {
        doc ? ctx.editMessageText('Sei uscito dal gruppo.') : ctx.editMessageText('Sei già uscito questo gruppo.')
        ctx.scene.leave('group-scene')
        ctx.answerCbQuery()
    })
})

joinScene.on('text', (ctx) => {
    groups.join({ telegram_id: ctx.from.id, code: ctx.message.text }, (doc) => {
        if (doc) {
            ctx.initMenu(menu.groupMenu)
            ctx.scene.leave('join-scene')
            ctx.scene.enter('group-scene')
        } else {
            ctx.reply('Non ci sono gruppi con questo codice :(')
            ctx.scene.leave()
        }
    })
})

groupScene.start((ctx) => {
    ctx.initMenu(menu.groupMenu)
})

groupScene.on('message', (ctx) => {
    if (typeof ctx.update.message.reply_markup !== 'undefined' && typeof ctx.update.message.reply_markup.inline_keyboard[0][0].url !== 'undefined') {
        let url = ctx.update.message.reply_markup.inline_keyboard[0][0].url
        groups.getGroup(ctx.from.id, (group) => {
            if (group) {
                let uri = `spotify:track:${url.match(/(?<=https:\/\/open.spotify.com\/track\/).+/)}`
                spotify.addToQueue(group.owner, uri, (err) => {
                    ctx.reply(err ? 'Non puoi mettere brani in coda se non ci sono dispositivi in riproduzione.' : 'La canzone è stata aggiunta in coda.')
                })
            } else {
                ctx.scene.leave('group-scene')
                ctx.reply('Il gruppo è stato sciolto.')
            }
        })
    }
})

bot.inlineQuery(/[\w]/, (ctx) => inlineQuery.answerTracks(ctx))

module.exports = bot