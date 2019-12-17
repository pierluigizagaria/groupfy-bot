require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bot = require('./core/telegram/bot-main')
const spotifyAuth = require('./core/routes/spotify-auth')

const app = express()
app.use(express.static(__dirname + '/core/routes/public'));
app.use('/', spotifyAuth)

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
})

const db = mongoose.connection;
db.on('error', (error) => {
    console.log('Could not connect to MongoDB')
    throw new Error(error)
})
db.once('open', () => { console.log('Connected to MongoDB.') });

bot.launch().then( console.log('Telegram bot started.') )

app.listen(process.env.PORT, () => { console.log(`Express listening on port ${process.env.PORT}.`) })
