/*
-) Apart form that we will define a centralised error handling middleware which will receive errors from all the routes(middleware)
   and will collectively handle errors in it.
-) For express js to know that a particular middleware is for centralised error handler we will pass a error (err) param, as a
   starting param.
-) Then inside that we will add a fallback statusCode and status fields of err object that we receive form different errors.
*/

const AppError = require("../utils/appError")

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err,
    })
}

const sendErrorProd = (err, res) => {
    // Operational, trused error: send message to client
    if (error.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
    }
    //Programming or other unknown error: don't leak error details
    else {
        // 1)Log error
        console.error('Error', err)
        // 2) Send generic message
        res.status(500).json({
            status: 'Error',
            message: 'Something went very wrong'
        })
    }
}

const handleJwtError = err => new AppError('Invalid token. Please log in again', 401)

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again.', 401)


const handleCastErrorDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
    const message = `Duplicate field value: ${value}. Please use another value!`
    return new AppError(message, 400)
}

const handleDuplicateFieldsDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `Invalid input data. ${errors.join('. ')}`
    return new AppError(message, 400)
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res)
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err }
        /*
        -) Transforming weird operational errors to user understandable error
        */
        if (error.name === 'CastError') { // error that db returns for invalid ID
            error = handleCastErrorDB(error)
        }
        if (error.code === 11000) { //  error that db returns for Duplicate field
            error = handleDuplicateFieldsDB(error)
        }
        if (error.name === 'ValidationError') {//  error that db returns for validation error
            error = handleValidationErrorDB(error)
        }
        if (error.name === 'JsonWebTokenError') { // error that jwt verify returns
            error = handleJwtError(error)
        }
        if (error.name === 'TokenExpiredError') {// error for expired token
            error = handleJWTExpiredError()
        }

        sendErrorProd(err, res)
    }
}