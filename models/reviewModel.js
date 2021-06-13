const mongoose = require('mongoose')
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'A review is required, it cannot be empty']
    },
    rating: {
        type: Number,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    /*
    -) Here we are adding a parent referencing to the reviews.
    -) It must be an object refering to the parent
    */
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    }
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    })


/*
-) Creating compound index so that user can not give two reviews for a tour he has already reviewed
*/

reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

reviewSchema.pre(/^find/, function (next) {
    /*
    -) This query middleware is used for populating referenced fields ( here, guide field ) using the .populate() for all the
       queries related to find.
    -) For two fields to populate we can either give new names of the fields in the path option seperated by space or
       we can provide the first populate and on that the second one.
    -) The more the populate queries are their, the more time will response take.
     */

    // this.populate({
    //     path: 'tour user',
    //     select: '-__v -passwordChangedAt'
    // })
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // })
    this.populate({
        path: 'user',
        select: 'name photo'
    })

    next()
})

/*===============================Schema Static methods ====================================
-) to call static method we have to use this.constructor.methodName()
 */

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    /*
    -) As we know we have average rating and rating quantity for each tour which is to be calculated by taking out the average
       of the rating of each reviews and the number of reviews respectively.
    -) But till now we in tours we are providing some random values, so now its time to make it dynamic.
    -) for that we have created a schema static method which we can use to calculate the respective fields from the ratings and
       add it to tour data.( using the parent reference of tour id in each rating)
    */

    /*
    Step 1) Calculating the average and number of all the ratings which matches the given tourId using agreagate method. 
    */
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ])
    // console.log(stats)
    /*
    Step 2) Updating the calculated average and no of reviews in the respected tour. 
    */
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }
}

reviewSchema.post('save', function () {
    /*
    -) This is a document middleware
    -) Here after the review is saved in DB then we are calling the static method that we created calcAverageRatings(this.tour)
    -) As we have to work on the data which is already saved in the db so we will use a post middleware.
    -) To call a static method use this.constructor.
    -) This points to current review
    */
    this.constructor.calcAverageRatings(this.tour)
})

/*
    -) For performing the calculation of average on update of review as well we need to find a hack to work around the query middleware
    -) To do that we will first need to get the current document so that we can get the tourId from it and then we will save it
       to a new property to the current query (which is this)
    -) Then we have to wait till the update is performed in the db and after that we will call the calcAverageRatings().
    -) To do that we will create a post query mmiddleware and call the function.s 
*/
reviewSchema.pre(/^findOneAnd/, async function (next) {
    /*
    -) This is a query middleware  
    -) we are using it for findByIdAndUpdate and findByIdAndDelete
    -) here this is the current query
    */
    this.r = await this.findOne()
    // console.log(this.r)
    next()
})

reviewSchema.post(/^findOneAnd/, async function () {
    // await this.findOne() does NOT work here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour)
})


const Review = mongoose.model('Review', reviewSchema)
module.exports = Review