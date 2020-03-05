class inlineMenu {
    constructor({ initContext, html, inlineKeyboardMarkup }) {
        this.middleware = initContext
        this.html = html
        this.inlineKeyboardMarkup = inlineKeyboardMarkup
    }
    getMessage(ctx, callback) {
        if (isFunc(this.middleware)) {
            this.middleware(ctx, () => {
                callback(this.html(ctx), this.inlineKeyboardMarkup(ctx))
            })
        } else {
            callback(
                isFunc(this.html) ? this.html(ctx) : this.html, 
                isFunc(this.inlineKeyboardMarkup) ? this.inlineKeyboardMarkup(ctx) : this.inlineKeyboardMarkup
            )
        }
    }
}

function isFunc(object) {
    return typeof object === 'function'
}

module.exports = inlineMenu