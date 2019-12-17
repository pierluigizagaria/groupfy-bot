const express = require('express')
const accountManager = require('../spotify/account-manager')
const router = express.Router()

router.get('/auth/spotify/callback', accountManager.connectSpotify, (req, res) => {
    res.successful ? 
        res.redirect('/spotify-auth-success.html') 
        : res.redirect('/spotify-auth-failed.html')
})

router.get('/*', function (req, res) {
    res.redirect('/');
})

module.exports = router
