const express = require('express')
const router = express.Router();
const prices = require('../../controllers/landingControllers/landingController')

router.get('/pricing', prices.price)

module.exports = router;