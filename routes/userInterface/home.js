const express = require('express');
const router = express.Router();
const homeController = require('../../controllers/userInterfaceController/homeController')


router.get('/home', homeController.homepage)
router.get('/', (req, res) => {
    res.redirect('/home')
})
module.exports = router;