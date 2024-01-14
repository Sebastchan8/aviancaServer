const express = require('express');
const router = express.Router();
const interactionsController = require('../controllers/interactionsController');

// /api/interactions/

router.post('/login', interactionsController.login);
router.post('/signup', interactionsController.signup);


router.get('/flights/:flight_id', interactionsController.getFlight);
router.get('/flights/rounded/:flight_id', interactionsController.getRoundedFlights);
router.post('/flights', interactionsController.getAvailableFlights);
router.get('/flights', interactionsController.getFlights);

router.post('/flights-crud', interactionsController.addFlight);
router.put('/flights-crud', interactionsController.updateFlight);
router.delete('/flights-crud/:flight_id', interactionsController.deleteFlight);

router.get('/cities', interactionsController.getCities);
router.post('/cities', interactionsController.addCity);
router.put('/cities', interactionsController.updateCity);
router.delete('/cities/:city_id', interactionsController.deleteCity);
router.get('/aerolines', interactionsController.getAerolines);

router.get('/user/:user_id', interactionsController.getUserData);
router.put('/user/:user_id', interactionsController.updateUserData);
router.get('/notifications/:user_id', interactionsController.getUserNotifications);

router.put('/ticket/:user_id', interactionsController.buyTicket);
router.get('/ticket/:user_id', interactionsController.getUserTickets);
router.delete('/ticket/:ticket_id', interactionsController.cancelTicket);

module.exports = router;
