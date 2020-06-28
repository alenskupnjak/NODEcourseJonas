const express = require('express'); // kostur za route
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoute');

const router = express.Router(); // kostur za route

// sve linkove sa ID tour i review preusmjerava u review
router.use('/:tourId/reviews', reviewRouter);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo(['admin', 'lead-guide']),
    tourController.createTour
  );

router.route('/tour-stats').get(tourController.getTourStatus);
router.route('/monthly-plan/:year').get(tourController.getMontlyPlan);
router.route('/getallid').get(tourController.getAllTourID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTours);

router.delete(
  '/obrisizadnja/:brojTuraObrisati',
  authController.protect,
  tourController.obrisiViseTura
);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi
//{{URL}}/api/v1/tours/tours-within?distance=233&center=-40,45&unit=mi

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo(['admin', 'lead-guide']),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo(['admin', 'lead-guide']),
    tourController.deleteTour
  );

module.exports = router; // kostur za route
