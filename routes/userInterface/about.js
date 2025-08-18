const express = require('express');
const router = express.Router();
const homeController = require('../../controllers/userInterfaceController/homeController')

router.get('/about', homeController.aboutpage)
module.exports = router;