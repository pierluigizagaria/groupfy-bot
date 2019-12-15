require('dotenv').config()
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bot = require('./core/telegram/groupfy-telegram-bot')
const accountManager = require('./core/spotify/account-manager')

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
})

const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => { console.log('Connected to MongoDB.') });

app.get('/auth/spotify/callback', accountManager.connectSpotify, (req, res) => {
    res.successful ? res.send('Spotify successfully connected.') : res.send('Could not connect your spotify account.')
    res.end()
})
app.get('/*', function (req, res) {
    res.send('You should not be here!');
})

bot.launch()
app.listen(25565, () => { console.log('Express listening on port 8080.') })
