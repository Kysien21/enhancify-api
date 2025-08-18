const express = require('express')
const router = express.Router();
const howitWorks = require('../../controllers/landingControllers/landingController')

router.get('/howitWorks', howitWorks.HWT)

module.exports = router;