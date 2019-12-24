const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')

class InlineMenuContext extends Telegraf.Context {
    constructor(update, telegram, options) {
        super(update, telegram, options)
    }

    initMenu(inlineMenu) {
        inlineMenu.getMessage(this, (html, markup) => {
            this.reply(html, Extra.HTML().markup(markup))
        })
    }

    editMenu(inlineMenu) {
        inlineMenu.getMessage(this, (html, markup) => {
            this.editMessageText(html, Extra.HTML().markup(markup))
        })
    }
}

module.exports = InlineMenuContext
