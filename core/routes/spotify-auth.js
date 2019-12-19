const express = require('express')
const accounts = require('../spotify/accounts-manager')
const router = express.Router()

router.get('/auth/spotify/callback', accounts.connect, (req, res) => {
    res.successful ? 
        res.redirect('/spotify-auth-success.html') 
        : res.redirect('/spotify-auth-failed.html')
})

router.get('/*', function (req, res) {
    res.redirect('/');
})

module.exports = router
