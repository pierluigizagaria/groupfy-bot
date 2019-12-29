const express = require('express')
const accounts = require('../accounts')
const router = express.Router()

router.get('/callback', accounts.connect, (req, res) => {
    res.successful ? 
        res.redirect('/spotify-auth-success.html') 
        : res.redirect('/spotify-auth-failed.html')
})

module.exports = router
