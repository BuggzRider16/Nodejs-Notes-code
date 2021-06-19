const Review = require('./../models/reviewModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const factory = require('./handlerFactory')


exports.setTourUserIds = (req, res, next) => {
    /*
    -) This mddleware we are creating so that we can remove extra step from create review function and instead of that we can use
     the generic factory function for creation.
    -) Here now we are allowing nested routes
    -) In the following if conditions we are checking if there is no tour/user in the body provided by user then we are adding using
         the url params.
    -) As I have added user directly from the authcontroller.protect, it is not required for user
    */

    if (!req.body.tour) req.body.tour = req.params.tourId
    if (!req.body.user) req.body.user = req.user.id
    next()
}

exports.getAllReviews = factory.getAll(Review)
exports.getReview = factory.getOne(Review)
exports.createReview = factory.createOne(Review)
exports.updateReview = factory.updateOne(Review)
exports.deleteReview = factory.deleteOne(Review)



// exports.getAllReviews = catchAsync(async (req, res, next) => {
//     /*
//     -) Here we are checking for nested route that if there is tourId in the url we will only return the reviews of a 
//        particular tour 
//     */
//     let filter = {}
//     if (req.params.tourId) {
//         filter = { tour: req.params.tourId }
//     }
//     const reviews = await Review.find(filter)

//     res.status(200).json({
//         status: 'success',
//         results: reviews.length,
//         data: reviews
//     })
// })

// exports.createReviews = catchAsync(async (req, res, next) => {
//     /*
//      -) Here now we are allowing nested routes
//      -) In the following if conditions we are checking if there is no tour/user in the body provided by user then we are adding using
//         the url params.
//      -) As I have added user directly from the authcontroller.protect, it is not required for user
//     */
//     if (!req.body.tour) {
//         req.body.tour = req.params.tourId
//     }
//     // if(!req.body.user){
//     //     req.body.user = req.user.id
//     // }
//     const newReview = await Review.create({
//         ...req.body,
//         user: req.user.id
//     })

//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: newReview
//         }
//     })

// })

exports.deleteReview = factory.deleteOne(Review)