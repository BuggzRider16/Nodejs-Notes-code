const express = require('express')
const tourController = require('./../controllers/tourController')
const router = express.Router()
const authController = require('./../controllers/authController')
const reviewRouter = require('./../routes/reviewRoutes')
//const reviewController = require('./../controllers/reviewController')


/*=============Adding predefined routes=============
-) Some time user uses some specific operations regularly for eg, getting 5 best cheap tours.
-) For this the URL will become  127.0.0.1:3000/api/v1/tours?sort=-ratingAverage,price&limit=5
-) So for this we will predefine some routes using middlewares
*/

// router.route('/:tourId/reviews')
//     .post(
//         authController.protect,
//         authController.restrictTo('user'),
//         reviewController.createReviews
//     )
router.use('/:tourId/reviews', reviewRouter) //for this URL it should the reviewRouter

router.route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours)

router.route('/tour-stats')
    .get(tourController.getTourStats)

router.route('/monthly-plan/:year')
    .get(authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan)

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin)
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances)

router.route('/')
    .get(tourController.getAllTours)
    .post(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour)

router.route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour)
    .delete(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour)

module.exports = router

