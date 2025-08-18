const express = require('express')
const router = express.Router();
const contactUS = require('../../controllers/landingControllers/landingController')

router.get('/contactUs', contactUS.contacts)

module.exports = router;