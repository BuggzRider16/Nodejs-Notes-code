const fs = require('fs')
const path = require('path')
const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

/*================ importing routes ====================*/
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const viewRouter = require('./routes/viewRoutes')

/* we will now call express to add a bunch of methods to app variable*/
const app = express()

/*======================== Starting up with Server side rendering (SSR)=================================
-) The app.set() function is used to assigns the setting name to value.
-) We may store any value that you want, but certain names can be used to configure the behavior of the server.
-) Here we are setting the view engine (used for SSR) to pug (a template engine, it comes with express
   out of box still we need to install npm i pug but no neeed to import)
-) Now we have to define in which folder path our views are present.
-) We can define the folder path directly like .__dirname/views but sometimes it give some issues like missing of / etc.
-) So the secure way is to use a build in path library which securly joins two part of path url with /. 
*/
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

/* ====
-) express middleware for serving static files to browser.
-) this provides a way to access files in a particular folder ==== */
//app.use(express.static(`${__dirname}/public`))
app.use(express.static(path.join(__dirname, 'public')))

/*=================================================Middlewares ================================================
-) For more -> https://expressjs.com/en/guide/using-middleware.html
-) ! Important ! => If a app.use() is with no mount path then it is a normal midlleware and The function is executed
   every time the app receives a request..
*/
/*===========================================.use()=============================================================
-) The app.use() function is used to mount the specified middleware function(s) at the path which is being specified.
-) It is mostly used to set up middleware for your application.
-) Syntax:
         app.use(path, callback)
-) Parameters:
   1) path: It is the path for which the middleware function is being called.
            It can be a string representing a path or path pattern or regular expression pattern to match the paths.
   2) callback: It is a middleware function or a series/array of middleware functions.
*/

/*===========================================.METHOD()=======================================================
-)  The app.METHOD() function is used to route an HTTP request, where METHOD is the HTTP method of the request,
    such as GET, PUT, POST, and so on, in lowercase.
-)  Thus, the actual methods are app.get(), app.post(), app.put(), and so on.
-)  Syntax:
      app.METHOD(path, callback [, callback ...])
-)  Parameters:
   1) Path: The path for which the middleware function is invoked and can be any of:
            A string representing a path.
            A path pattern.
            A regular expression pattern to match paths.
            An array of combinations of any of the above.
   2) Callback: Callback functions can be:
            A middleware function.
            A series of middleware functions (separated by commas).
            An array of middleware functions.
            A combination of all of the above.
*/
/*============================================= multi callback funtion middleware ============================
-) Eg of multi callback funtion middleware
        app.use('/user/:id', function (req, res, next) {
               console.log('Request URL:', req.originalUrl)
               next()
               }, function (req, res, next) {
               console.log('Request Type:', req.method)
               next()
         })
-) To skip the rest of the middleware functions from a router middleware stack,
    call next('route') to pass control to the next route.
-) NOTE: next('route') will work only in middleware functions that were loaded by using the app.METHOD() or router.METHOD() functions.
-) This example shows a middleware sub-stack that handles GET requests to the /user/:id path.
            app.get('/user/:id', function (req, res, next) {
            // if the user ID is 0, skip to the next route
            if (req.params.id === '0') next('route')
            // otherwise pass the control to the next middleware function in this stack
            else next()
            }, function (req, res, next) {
            // send a regular response
            res.send('regular')
            })
*/
// 1) GLOBAL MIDDLEWARES

/* ==========Set security HTTP headers middleware===============
-) We are using helmet(npm i helmet) to add some of the important security headers in our response.
*/
app.use(helmet())

/* ===========third party middleware for logging ==================*/
process.env.NODE_ENV === 'development' &&
   app.use(morgan('dev'))


/*================ Limit requests from same API  =================
-) To prevent the number of request a client can make in a very short time (maybe he is attacker).
-) So for this we will use the Express-rate-limit (npm i express-rate-limit) and will provide with some options
-) Then this middleware will be applied to our base route .
-) This will provide some headers of max limit , attempts left and reset.
-) if the client crosses the limit then an Error msg with Status Code: 429 (Too many request will be send).
-) This protects from denial of service and brute force attacks.
*/
const limiter = rateLimit({
   max: 100,
   windowMs: 60 * 60 * 1000,
   message: 'Too many requests from this IP, please try again in an hour!'
})
app.use('/api', limiter)


/* ==adding a middleware so that it can convert the incomming post data to json==
-) Here we can add a request body size and if the size increases it will give error. 
*/
app.use(express.json({ limit: '10kb' }))

/* ============== Data sanitisation against NoSQL query injection =================
-) Some time hackers provide queries instead of data in the fields which cause DB to return data which the client is not authorised.
-) Like if the hacker knows the password , instead of giving valid email he gives {$gt:""} then this will automaticaly log him in.
-) So to protect the DB from such attacks we will sanitise the incomming data using "express-mongo-sanitize"
   (npm i express-mongo-sanitize) package middleware.
-) This package will automatically filter out all of the dollars signs from params, url, body etc. So no queries will run.
*/
app.use(mongoSanitize())

/*=================== Data sanitization against XSS======================
-) Here we will use " xss-clean " (npm i xss-clean).
-) It will remove the malicious code from html codes.
-) It converts html <> symbols to someting else.
*/
app.use(xss())

/*=================Prevent parameter pollution=========================
-) Here we will use " hpp " (npm i hpp)
-) It will remove multiple/duplicate params from request params
-) But sometimes we require duplicate params so we can add them in whitelist
*/
app.use(
   hpp({
      whitelist: [
         'duration',
         'ratingsQuantity',
         'ratingsAverage',
         'maxGroupSize',
         'difficulty',
         'price'
      ]
   })
)

/*
-) Here we are creating a new custom middleware
-) It receives three params request, response and next.
-) Need to call next() in end of each middleware.
*/

// app.use((req, res, next) => {
//     console.log('Hello from the MiddleWare!!')
//     next()
// })

app.use((req, res, next) => {
   req.requestTime = new Date().toISOString()
   next()
})

/*============================================================================================================= */

/*===================================== Routes ================================================================*/
/*
-) Here we are adding a middleware function mounted on the /api/v1/tours path.
   The function is executed for any type of HTTP request on the /api/v1/tours path.
-) Here we will create a type of a new mini application which will route for tours and users.
-) First, we will create a new tourRouter using express.Router() and then we will use it as a middleware to listen to routes comming from '/api/v1/tours'.
   This is called mounting the router.
-) By doing this the .route() for the route '/api/v1/tours' will be '/' only because it will be already routed through the middleware.
*/
app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
/*=============================================================================================================*/

/* =================================== Error Handling middleware =============================================*/

app.all('*', (req, res, next) => {
   /*
   -) This middleware is from api not find.
   -) The idea is that if the code reaches to this middleware then it means that it is not handled by any other router
      so by that we can assume that route was wrong. 
   -) So here we will use app.all() which is used for all of the urls.
   -) If in the next() we pass any param then express automatically knows that it is an error, and this applies to all the next()s
      of all the middleware.
   -) Once we pass any param to next() of any middleware, then it will skip all the other middleware and will go directly to 
      the error handler middleware.
   */

   // res.status(404).json({
   //     status: 'fail',
   //     message: `Can't find ${req.originalUrl} on this server`
   // })

   // const err = new Error()
   // err.status = 'fail'
   // err.statusCode = 404


   next(new AppError(`Can't find ${req.originalUrl} on this server`))
})
/*
-) Apart form that we will define a centralised error handling middleware which will receive errors from all the routes(middleware)
   and will collectively handle errors in it.
-) For express js to know that a particular middleware is for centralised error handler we will pass a error (err) param, as a
   starting param.
-) Then inside that we will add a fallback statusCode and status fields of err object that we receive form different errors.
*/
app.use(globalErrorHandler)
/*============================================================================================================= */

module.exports = app











/*================================================Notes Eg================================================*/

// app.get('/', (request, response) => {
//     // to send normal response
//     //response
//     //.status(200)
//     //.send('Hello from the server side')

/* to send Json response, and this will automatically define the header of content type to application/json*/
//     response
//         .status(200)
//         .json({ message: 'Hello from the server side', app: 'Natours' })
// })

// app.post('/', (request, response) => {
//     response
//     .status(200)
//     .send('You can send post to this endpoint')
// })



/* == specifying for each url/route==*/
/*
 //This get request is for getting all tours
app.get('/api/v1/tours', getAllTours)

 //This get request is for getting a single tour
app.get('/api/v1/tours/:id', getTour)

// This is a post request
app.post('/api/v1/tours', createTour)

//This is a patch request
app.patch('/api/v1/tours/:id', updateTour)

//This is a delete request
app.delete('/api/v1/tours/:id', deleteTour)
*/

/*==specifying once for a single type of route==*/
/*======================================================================================================= */