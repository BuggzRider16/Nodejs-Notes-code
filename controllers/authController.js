/* ==================== Important ===================
    -)User.findByIdAndUpdate will NOT work as intended! as the validators will not work because we will not have this keyword.
    -) All of our middleware are for save so the will also not work.
    -) So we should use save for all password related stuff.
*/

const crypto = require('crypto')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const jwt = require('jsonwebtoken')
const AppError = require('./../utils/appError')
const bcrypt = require('bcryptjs')
const { promisify } = require('util')
const sendEmail = require('./../utils/email')

const signToken = id => {
    /*
   -) Now we will create a jwt token using the _id as payload.
   -) For creating a JWT token we require a payload, a secret key and a 
      an optional expiration time.
   -) Once the token is created it can be send back to user  
   */
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user, statusCode, res) => {
    
    /*
    -) Now we will create a jwt token using the _id as payload.
    -) For creating a JWT token we require a payload, a secret key and a 
       an optional expiration time.
    -) Once the token is created it can be send back to user  
    */
    const token = signToken(user._id)

    /*
    -) Cookie is a piece of text or data which is stored in the client/user machine.
    -) It is a secure space where we can store JWT Token 
    -) We will specify some options to cookie like expiry time, httpOnly(if true browser cannot modify the cookie, it will 
        just store and return it in the requests) and secure (only work on https(encrypted connection) only).
    -) We will attach the cookie to response and it will take three params (cookie name, data, options)
    */

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

    res.cookie('jwt', token, cookieOptions)

    // Remove password from output
    user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    }) //can also use User.save 

    /*
    -) Now we will create a jwt token using the _id as payload.
    -) For creating a JWT token we require a payload, a secret key and a 
       an optional expiration time.
    -) Once the token is created it can be send back to user  
    */
    createSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body

    /*
    Step 1) Check if email and password exist
       -) should always return next if a error occurs so that it will not send multiple response
    */
    if (!email || !password) {
        return next(new AppError('Please provide email and password, 400'))
    }
    /*
    Step 2) Check if user exists and password is correct
      -) As we are preventing the password field to be displayed in the query result (check in userModel) we need to explicitly select and get that
         from the query by using .select('+password').
      -) As the password we get from db is encrypted, so we will use bcrypt to compare the response password to that encrypted password.
      -) But for checking that we will do the password checking in mongoose middleware in usermodel.
      -) For that we will access userSchema method to do our job.
    */
    const user = await User.findOne({ email }).select('+password')

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401))
    }

    //Step 3) If everything is fine, send token to client

    createSendToken(user, 200, res)
})

exports.protect = catchAsync(async (req, res, next) => {
    let token
    /*
    Step 1) Getting the token and checking if it is there
         -) From client side always send the JWT token in this format in the headers
                Authorization:' Bearer JWTToken'
         
    */
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
        //console.log(token)
    } else {
        return next(new AppError('You are not logged in..! Please log in to get access', 401))
    }

    /*
    Step 2) Verification token
        -) So here we are using jwt.verify(token, secret) to verify the incoming token.
        -) But here we will convert the result of the jwt.verify to a promise
        -) promisify() method defines in utilities module of Node. js standard library.
           It is basically used to convert a method that returns responses using a 
           callback function to return responses in a promise object.
        -) line const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET) is a short form of
                    const decoded = await promisify(jwt.verify)
                    decoded(token, process.env.JWT_SECRET)
        -) If this returns the error of invalid token or expired token then our global error handler will catch it automatically
    */
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    /*
    Step 3) Check if user still exist
    */
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(
            new AppError(
                'The user belonging to this token does no longer exist.',
                401
            )
        )
    }

    /*
    Step 4) Check if user changed password after the token was issued
         -) Here we are passing a the JWT issued timestamp received from the JWt token.
    */

    if (currentUser.changedPasswordAfter(decoded.iat)) {
        console.log(currentUser.changedPasswordAfter(decoded.iat))
        return next(
            new AppError('User recently changed password! Please log in again.', 401)
        )
    }
    /*
    Step 5) Grant access to protected route
         -) we are adding the currentUser to req as we may use it in another middleware
    */
    req.user = currentUser
    next()
})

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
      try {
        // 1) verify token
        const decoded = await promisify(jwt.verify)(
          req.cookies.jwt,
          process.env.JWT_SECRET
        )
  
        // 2) Check if user still exists
        const currentUser = await User.findById(decoded.id)
        if (!currentUser) {
          return next()
        }
  
        // 3) Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
          return next()
        }
  
        // THERE IS A LOGGED IN USER
        res.locals.user = currentUser
        return next()
      } catch (err) {
        return next()
      }
    }
    next()
  }

exports.restrictTo = (...roles) => {
    /*
    -) This middleware is used for authorizing the user for using a single route
    -) This function will receive the allowed roles as params and as we know a middleware function do not receive any params,
        we will first create a outer function which receives a the role params and then will return the middleware.
    -) Before executing this middleware the protect middleware is executed (common sense, as first the client must have logged in)
    -) So because of that, this middleware will receive the current user details as in protect middleware we added req.user = currentUser
    -) then we will just check if the current user contains the following role or not.
    */
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']. role='user'
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            )
        }
        next()
    }
}

/*===================== Implementing Forget Password =====================================
-) To create a forget password machanism, need to implement in two steps.
   Step 1) accquire the user's email , create a reset token and send it to user's provided email
   Step 2) getting back the new password and with the provided reset token and updating the password.  
*/

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // Step 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError('There is no user with email address.', 404))
    }

    /*
    Step 2) Generate the random reset token
    */
    const resetToken = user.createPasswordResetToken()
    /*
    -)saving the new modified data (by createPasswordResetToken()) to DB and we will disable the validation before saving.
    -)So it can save without requiring any another required field. 
    */
    await user.save({ validateBeforeSave: false })

    /*
    Step 3) Send it to user's email
         -) First we have to create a reset link. 
         -) Once the email is send we have to send a response to the user, to let him know that email is sent,
            and to stop a the request/response cycle.
    */

    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/users/resetPassword/${resetToken}`
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.
    If you didn't forget your password, please ignore this email!`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        })

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        })
    } catch (err) {
        // If in case email send failed then we have to reset the users passwordResetToken and passwordResetExpires fields and then save to DB
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })

        return next(
            new AppError('There was an error sending the email. Try again later!'),
            500
        )
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    /*
    Step 1) Get user based on the token
         -) Now here we will encrypt the incoming reset token and then will find that in DB for availbility.
         -) We will also check that the password reset Expire time is greater then now to know if it is not expired.
     */
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    })

    /*
     Step 2) If token has not expired, and there is user, set the new password
          -) if we find any user with the previous query than will update the password and then will save this new info
          -) Here we want validate the incoming user we will not disable the validation
    */
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400))
    }
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    createSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    /*
    -) We are implementing this to enable use to update password 
    Step 1) Get user from collection 
         -) As password field is prevented form coming in output (by schema) so we need to explicitly select it in query
         -) Before executing this middleware the protect middleware is executed (common sense, as first the client must have logged in)
         -) So because of that, this middleware will receive the current user details as in protect middleware we added req.user = currentUser
            then we will just check if the current user can update password or not.
    */
    const user = await User.findById(req.user.id).select('+password')

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401))
    }

    // 3) If so, update password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()

    /* ==================== Important ===================
    -) User.findByIdAndUpdate will NOT work as intended! as the validators will not work because we will not have this keyword.
    -) All of our middleware are for save so the will also not work.
    -) So we should use save for all password related stuff.
   */

    // 4) Log user in, send JWT
    createSendToken(user, 200, res)
})
