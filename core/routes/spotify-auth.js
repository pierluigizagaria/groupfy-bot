const express = require('express')
const accountManager = require('../spotify/account-manager')
const router = express.Router()

router.get('/auth/spotify/callback', accountManager.connectSpotify, (req, res) => {
    res.successful ? 
    res.sendFile('../public/spotify-auth-success.html') : 
    res.sendFile('../public/spotify-auth-failed.html')
    res.end()
})

router.get('/*', function (req, res) {
    res.send('You should not be here!');
})

module.exports = router
