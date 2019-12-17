const express = require('express')
const accountManager = require('../spotify/account-manager')
const router = express.Router()


router.get('/auth/spotify/callback', accountManager.connectSpotify, (req, res) => {
    res.successful ? res.send('Spotify successfully connected.') : res.send('Could not connect your spotify account.')
    res.end()
})

router.get('/*', function (req, res) {
    res.send('You should not be here!');
})

module.exports = router
