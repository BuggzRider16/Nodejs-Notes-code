const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const APIFeatures = require('./../utils/apiFeatures')

/*
-) Here we are creating generic functions which can be used in all the controllers.
*/

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id)

    if (!doc) {
      return next(new AppError('No document found with that ID', 404))
    }

    res.status(204).json({
      status: 'success',
      data: null
    })
  })

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    /*
   -) For all mongoose methods refer documentation
    */
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })

    if (!doc) {
      return next(new AppError('No document found with that ID', 404))
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    })
  })

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body)

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    })
  })

exports.getOne = (Model, popOptions) =>
  /*
  -) If user send populate values ( like for tours) then we will populate
  -) Tour.findById() is a helper for Tours.findOne({_id:req.params.id})
  -) .populate(fieldName) takes the field names that contains referencing for other collection and populates them with the
      respected data from other collections in the output.
  -) populate() creates a new query automatically to get data from a different collection based on ref of the ids.
  -) Here in our case the guide field of a tour is an array containing the ids of user document, so when we apply populate it will
      replace all the ids of user document with the orginal documents in the guide array. 
  -) We can also add give the field name and other options in a object. Here path will then contain the fieldName and in select
    we are passing the name of the field we do not require in output.
            Syntax for select ->  select: '-fieldname'
  -) But instead of doing .populate here we can add a query middleware and use .populate() their for every find query.
  */
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id)
    if (popOptions) query = query.populate(popOptions)
    const doc = await query

    if (!doc) {
      return next(new AppError('No document found with that ID', 404))
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    })
  })

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)
    let filter = {}
    if (req.params.tourId) filter = { tour: req.params.tourId }
    //Building a query
    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitField()
        .paginate()
    /*
    -) To get information on what and how our query is working and to also check the performance use .explain()
    -) Eg. const doc = await features.query.explain()
    */
    const doc = await features.query

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    })
  })
