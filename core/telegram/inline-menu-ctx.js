const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')

class CustomContext extends Telegraf.Context {
    constructor(update, telegram, options) {
        super(update, telegram, options)
    }

    initMenu(inlineMenu) {
        super.reply(inlineMenu.html(this), Extra.HTML().markup(inlineMenu.inlineKeyboardMarkup(this)))
    }

    editMenu(inlineMenu) {
        super.editMessageText(inlineMenu.html(this), Extra.HTML().markup(inlineMenu.inlineKeyboardMarkup(this)))
    }
}

class inlineMenu {
    constructor(html, inlineKeyboardMarkup) {
        this.html = html
        this.inlineKeyboardMarkup = inlineKeyboardMarkup
    }
}

module.exports = {
    CustomContext,
    inlineMenu
}