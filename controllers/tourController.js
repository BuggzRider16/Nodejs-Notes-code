const fs = require('fs')
const Tour = require('./../models/tourModel')
const APIFeatures = require('./../utils/apiFeatures')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const factory = require('./handlerFactory')

/* ===============!!! Important !!!=============================== 
-) Here all of the functions are a middleware receiving three params (req,res,next).
-) So, in functions like getAllTours, createTour etc will also receive these three params.(might have skipped next param because it was
   not required there) */

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = "5"
    req.query.sort = "-ratingAverage,price"
    req.query.fields = 'name.price,ratingAverage,summary,difficulty'
    next()
}

exports.getAllTours = factory.getAll(Tour)
exports.getTour = factory.getOne(Tour, { path: 'reviews' }) //sending populate field
exports.createTour = factory.createOne(Tour)
exports.updateTour = factory.updateOne(Tour)
exports.deleteTour = factory.deleteOne(Tour)

// exports.getAllTours = catchAsync(async (req, res) => {
//     //Building a query
//     const features = new APIFeatures(Tour.find(), req.query)
//         .filter()
//         .sort()
//         .limitField()
//         .paginate()
//     const allTours = await features.query

//     res.status(200).json({
//         status: 'success',
//         results: allTours.length,
//         data: allTours
//     })
// })

// exports.getTour = catchAsync(async (req, res, next) => {
//     /*
//      -) Tour.findById() is a helper for Tours.findOne({_id:req.params.id})
//      -) .populate(fieldName) takes the field names that contains referencing for other collection and populates them with the
//         respected data from other collections in the output.
//      -) populate() creates a new query automatically to get data from a different collection based on ref of the ids.
//      -) Here in our case the guide field of a tour is an array containing the ids of user document, so when we apply populate it will
//         replace all the ids of user document with the orginal documents in the guide array. 
//      -) We can also add give the field name and other options in a object. Here path will then contain the fieldName and in select
//         we are passing the name of the field we do not require in output.
//             Syntax for select ->  select: '-fieldname'
//      -) But instead of doing .populate here we can add a query middleware and use .populate() their for every find query.
//      */
//     // const tour = await Tour.findById(req.params.id).populate({
//     //     path: 'guides',
//     //     select: '-__v -passwordChangedAt'
//     // })

//     const tour = await Tour.findById(req.params.id).populate('reviews') //reviews is the virtual field we are populating only for get a tour


//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404))
//         /*we are returning this so that after this error the function should stop instead of sending 
//         two requests*/
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     })
// })

// exports.createTour = catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body)

//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: newTour
//         }
//     })
// })


exports.deleteTour = factory.deleteOne(Tour)


exports.getTourStats = catchAsync(async (req, res) => {
    /*=============== Using aggregate function pipeline ============
    -) Aggregate function are used for calculating statistical values like avg, sum, min, max etc.
    -) .aggregate() accepts an array and that array is executed in stages.
    -) $match is the first stage query which is used to filter data giving the field name.
    -) $group is just like groupBy of SQL. It accepts an object in this format
                newFieldName: {$aggregateFunction: $document field on which the aggregate function is to be implemented}
    -) $sort is used to sort the output of data according to the new fields we created
    -) We can repeat the stages ultiple time
    -) For Eg first $match is sone on data before grouping and second match is done on data after grouping.
    */
    const stats = await Tour.aggregate([
        {
            $match: { ratingAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' }, //here we can add difficulty directly, but we tried to add different style of display
                numTours: { $sum: 1 }, // to calulate total number of tours we will add 1 for each tour
                numRatings: { $sum: '$ratingQuantity' },
                avgRating: { $avg: '$ratingAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
        // {
        //   $match: { _id: { $ne: 'EASY' } }
        // }
    ])

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1 // 2021

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'  // unwind is used for destructuring the array in the object
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' } // here we are creating an array of tours of a particular
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: { //project is used for excluding fields from the output
                _id: 0
            }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 12
        }
    ])

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    })
})

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params
    const [lat, lng] = latlng.split(',')
  
    // converting the radius to radiance so that it can work with geospatial data
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1 
  
    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitutr and longitude in the format lat,lng.',
          400
        )
      )
    }
    /*
    -) Now we are using geoWithin is a geospatial operator which finds document which is having the a certain geometry.
    -) It is same like math operators like gte, lte....
    -) Here we are using the geometry of a sphere to find the document.
    */
  
    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    })
  
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours
      }
    })
  })
  
  exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params
    const [lat, lng] = latlng.split(',')
  
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001
  
    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitutr and longitude in the format lat,lng.',
          400
        )
      )
    }
  
    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng * 1, lat * 1]
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier
        }
      },
      {
        $project: {
          distance: 1,
          name: 1
        }
      }
    ])
  
    res.status(200).json({
      status: 'success',
      data: {
        data: distances
      }
    })
  })
  