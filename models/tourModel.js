const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
const User = require('./userModel')
/*
-) Now we will create schema.
-) Schema is the basic structure of collection.
-) If we have to define only the type then we can define ot directly.
-) If we need to define more options then we have to create an object.
-) in the 'type' field we define the datatype .
-) In the 'required' field we need to pass true/false, but if we want an error message then we have to create an array in which first 
   index contains value for requires true/false, and at second index we need to pass the error message.
-) First object is the schema definition and the second object is foe schema options.
-) !Important -> Here we have used different types of writing schema options
    1) is directly by fieldName : datatype Eg slug:String.
    2) when we want to give extra options fieldName: {
        type: dataType,
        required:[]
        ......
    } 
        Eg name,
    3) For validate we can r=write in two ways Eg, one for name and another for priceDiscount

============================= Data Validation ================================
-) Data validation is the step in which we check that the data is going to DB is correct or not.
-) required is one of the data validator.
-) Another are maxLength and minLength are validators on string.
            Syntax => maxlength: [size, 'Error Msg']
-) On numbers we also have min and max.
-) To limit the options to user, here for example we want user to have only three difficulty i.e easy, medium, hard. So for that 
   we use enums

===========================Custom data validators ===========================
-) Sometimes the predefined validators are not enough, so we will create our own validators.
-) The idea is to pass true or false to let the schema know that the input to db is good or not.
-) For that we add a new key value pair in the selected field that is validate: callback function.
-) This callback function should be the legacy function not an arrow function because here we require this keyword.
-) this keyword only points to current doc on NEW document creation, will not work on update query.
-) So any where we are using this keyword will not work on update query. 
-) We also have some third party validators like validator.js(npm i validator)(for strings only).
-) They provide callback functions we can add directly to validate key value pair.

*/

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal then 40 characters'],
        minlength: [10, 'A tour name must have more or equal then 10 characters']
        // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        /*
        -) Now we will add a setter function which run everytime a data is saved.
        -) Here we are rounding the rating 
        */
        set: val => Math.round(val * 10) / 10 // 4.666666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                /*this only points to current doc on NEW document creation
                 Error message also have access to value of the function 
                 this gets the previous values....jut like rowdata */

                return val < this.price //checking discount price should be always less than price
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false   // by this we are creating a schema that will not return this field to user "Limiting from Schema"
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        /* GeoJSON
        -) This is for adding geo location data.
        -) Unlike others inside this object we dont provide schema option, the options we are providing below are the embedded object
           so that mongo can recognise it as geo location data.
        -) And inside those embedded objects we provide schema options.
        -) type and coordinates are required fields
        -) in coordinates we provide first longitude and then latitude // [longitute, latitude]// , opposite of the conventional way
        */
        type: {// embedded objects/sub fields
            type: String, //schema options
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],// type as array of numbers
        address: String,
        description: String
    },
    locations: [
        /*
        -) To embedded other subdocuments to this documents we need to use an array, and then we can add mutliple objects.
        */
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        /*
        -) To add child reference to other subdocuments to this documents we need to use an array, and then we can add schema options of
         the documments needed to be referenced.
        -) By using these references if we want to embedded documents as well then we can implement a middleware to do our job.
        */
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User' // creating reference for User collection
        }
    ]
}, // for enabling the virtual properties in the schema options
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    })

/*====================================Indexes========================================
-) A database index is a data structure that improves the speed of data retrieval operations on a
   database table at the cost of additional writes and storage space to maintain the index data structure.
   An index is a copy of selected columns of data, from a table, that is designed to enable very efficient search.
-) Indexing is used to optimize the performance of a database by minimizing the number of disk accesses
  required when a query is processed. The index is a type of data structure. It is used to locate and access the
  data in a database table quickly.
-) Here we are creating a index of price field and providing indexing order 1 for ascending and -1 for decending. 
-) When we create compound index we dont have to create a index for their participants individually.
-) We should create an index of only those fields which are frequently accessed.
*/

//tourSchema.index({ price: 1 }) //regular index
tourSchema.index({ price: 1, ratingsAverage: -1 }) //compound index
tourSchema.index({ slug: 1 })

/*================ virtual properties==================
-) These are the fields in our schema which are not persistence.
-) We use these for the fields which can be derived from one another, for eg we have a field containing km so instead of adding a
   new field for miles we can add a virtual property which we can derive from km field.
-).virtual() we send the virtual property field name and on that we call a get().
-) This get() runs everytime we get any info from DB.
-) We use normal function instead of arrow functions here and also in apiFeatures.js because arrow functons do not have their own 
   this .
-) We cannot use the virtual properties in a query , like find().
*/

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7
})

tourSchema.virtual('reviews', {
    /*
    -) Now we are creating a virtual field for populating parent( here tour) to its childs ( here reviews ) which are referenced by
       parent referencing meaning child has the reference of parent but parent don't have any idea about child.
    -) By creating this type of virtual property parent will also be able to know about the child without actually storing
       any reference of child.
    -) So here we are creating a virtual property named as review, which will refer to the 'Review' collection.
    -) foreignField decribes what is the name of field in the child document which contains parent document id.
            here 'tour' is the name of field in "Reviews" collection which contains the ID of tour.
    -) localField decribes what is the name of field in parent property which is referenced by the child property
    -) This will only create a field with null values, we have to maually populate it in the controller for each routes or
        a single route according to the requirement.
    */
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
})

/*===========================================mongoose middleware =================================================================== 
-) Mongoose also provides middleware which can be used to modify/log etc data at each DB event.
-) For eg while saving a document we can run a middleware between  save coomand issued and actually saving the document or after saving.
-) That is why mongoose midlleware pre and post hooks.
-) there are four types of middleware in mongoose
   1) documnent
   2) query
   3) aggregate
   4) model
-) We define middleware on schema
*/

/* =============================Document middleware=====================================
-) We are using document middleware with pre, so it will run before .save() and create()
-) Same as express, we need to call next() to jump to another middleware
-) here, this will provide the currently created object before save.
*/
tourSchema.pre('save', function (next) {
    /*
    -) Here in the code we are using slugify to add a new string, but to do that we need to add that in schema as well.
    */
    //console.log(this)
    this.slug = slugify(this.name, { lower: true })
    next()
})

// tourSchema.post('save', function (doc, next) {
/*
-) Post middleware run after all the pre middleware functions are completed.
-) It dosent receive any this keyword, instead it receives a doc in params
*/
//     console.log(doc)
//     next()
// })

// tourSchema.pre('save', async function (next) {
//     /*
//     -) Here we are retriving all the users which are coming in the guides array(an array of user IDs) from the request and then 
//        embedding them in the schema data.
//     -) As the guide is an array we can use map to iterate over it and for each user ID we will call the User collection to fetch data.
//     -) After the iteration is completed map will return an array of promises which we are resolving by Promise.all()
//     */
//     const guidesPromises = this.guides.map(async id => await User.findById(id))
//     this.guides = await Promise.all(guidesPromises)
//     next()
// })


/* ===========================================Query Middleware========================================
-) Query middle ware is middleware to run before and after query.Here this will point to a querymEg find.
-) Here we are using the middleware to not show documents( tours ) having secretTour: true.
-) On applying a filter on find will only work on find(), but not on findOne, etc.
-) So we will use a regular expression so that for all find related queries it will work or we can just copy paste the function multiple
   times and add all types of find function.
*/
tourSchema.pre(/^find/, function (next) {
    this.find(({ secretTour: { $ne: true } }))

    this.start = Date.now() // just for fun we are calculating the time a query took to run
    next()
})

tourSchema.pre(/^find/, function (next) {
    /*
    -) This query middleware is used for populating referenced fields ( here, guide field ) using the .populate() for all the
       queries related to find.
     */
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    })

    next()
})

tourSchema.post(/^find/, function (doc, next) {
    //console.log(doc)
    console.log(`Query took ${(((Date.now() - this.start) % 60000) / 1000)} seconds`)
    next()
})



    /
    /*================================= Aggregation middleware ==========================================
    -) In Aggregation middleware we will be doing the same thing we did in query middleware.
    -) In Aggregation middleware this points to aggregation object.
    -) Here we are just adding a match in the starting of the pipeline array(stages) to ignore the documents having secretTour:true
    */

    tourSchema.pre('aggregation', function (next) {
        //console.log(this.pipeline()) //this will print all the stages

        this.pipeline().unshift({ $match: { $secretTour: { $ne: true } } })
        next()
    })

/*
-) Now we will create a model using the created schema.
-) The name of the model should start with caps.
*/

const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour

// const testTour = new Tour({
//     name: 'The Park Camper',
//     rating: 4.7,
//     price: 997
// })

// same thing can be done as
//Tour.create({
//     name: 'The Park Camper',
//     rating: 4.7,
//     price: 997
// })

// testTour.save()
//     .then(doc => {
//         console.log(doc)
//     })
//     .catch(err => {
//         console.log(err)
//     })
