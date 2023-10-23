const express = require('express');
const tourController = require('../controllers/tourController');

/* ----------------------------------  API ROUTE HANDLERS ---------------------------------- */

// this is a new middleware
// router only runs in this url
// so we can avoid using it when creating routes
const router = express.Router();

// Aliases, popular route
router
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

// Aggregation statistics: matching and grouping
router.route('/tour-stats').get(tourController.getTourStats);

// Aggregation statistics: unwinding and projecting
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

// param middleware function
// it only runs when the param is present in the route
// router.param('id', tourController.checkID);

//this way we don't have to repeat the same request twice
// we specified the actions for each route
router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getOneTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
