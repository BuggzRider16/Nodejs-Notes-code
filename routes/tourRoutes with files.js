const express = require('express')
const tourController = require('./../controllers/tourController')
const router = express.Router()


/*
-) router.param() middleware is a special kind of middleware which is used to track changes in a particular URL param.
-) It is just a kind of listener only.
-) In the callback function we provide the same params that of a middleware and an extra param containing the value of
   URL param we are listening.
-) In this middleware we can add data maniplution codes.
-) Another exmaple of router.param() is in tourController.js where we are checking for invalid id for every request,
   instead of checking in every route function.
 */
router.param('id', tourController.checkID)

/*
-) When we have to add a middleware in the already created one (like for the post route handler) we add it the parenthesis
   seperated by comma. 
-) This is said to add multiple middleware in the middleware stack.
-) So here first checkBody will run and then createTour
 */
router.route('/')
    .get(tourController.getAllTours)
    .post(tourController.checkBody, tourController.createTour)

router.route('/:id')
    .get(tourController.getTour)
    .patch(tourController.updateTour)
    .delete(tourController.deleteTour)

module.exports = router

