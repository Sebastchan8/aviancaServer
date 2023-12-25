const express = require('express');
const router = express.Router();
const interactionsController = require('../controllers/interactionsController');

// /api/interactions/

router.post('/login', interactionsController.login);
router.get('/logout', interactionsController.logout);
router.post('/signup', interactionsController.signup);


router.get('/flights', interactionsController.getFlights);
router.get('/cities', interactionsController.getCities);
router.get('/aerolines', interactionsController.getAerolines);

router.get('/user/:user_id', interactionsController.getUserData);
router.put('/user/:user_id', interactionsController.updateUserData);

module.exports = router;
