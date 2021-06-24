class AppError extends Error {  //here we are extending the original error class for getting error functionality
    constructor(message, statusCode) { // constructor method is always called when we create any object out of this class
        super(message)                // super call the contructor of the parent class and as error only receives one param we are sending message

        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true       //indicating that the errors are happening due to operations issues like user is calling wrong endpoints


        /*=========Capturing stack trace=============
        -) Stack trace is used for getting the location of error and its origin.
        -) console.log(error.stack) provides us with the error
        -) But this way add the complete stack of all the files where the error initiated.
        -) So, by using  Error.captureStackTrace(this, this.constructor) the stacktrace will only provide the exact location of the 
            error instead of adding the whole path .
         */
        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = AppError