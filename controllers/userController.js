const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const factory = require('./handlerFactory')

const filterObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el]
        }
    })
    return newObj
}

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id
    next()
}

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find()

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: users
    })
})

exports.updateMe = catchAsync(async (req, res, next) => {
    /*
    -) this function is for updating user info other than password
    Step 1) Create error if user POSTs password data
    */
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword.',
                400
            )
        )
    }

    /*
    Step 2) Filtered out unwanted fields names that are not allowed to be updated
         -) User/client might send fields like role or resetToken which will update the documents .... which we should 
            prevent at any cost.
         -) So we will filter unwanted fields.  
    */
    const filteredBody = filterObj(req.body, 'name', 'email')

    /*
    Step 3) Update user document
         -) Here we cant use .save() as it will be requiring other fields as well like password confirm,
            so we will use findByIdAndUpdate().
         -) It require three paramas which is tthe id of document, values to be updated and some options like
                new : if true then it will return only the updated object instead of old one
                runValidators: if true will run all the validators for the updating fields.
    */
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    })

    // Step 4)Sending response to user 
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    })
})

exports.deleteMe = catchAsync(async (req, res, next) => {

    /*
    -) Whenever a user deletes his account, we do not delete the document from the DB, instead we mark him as inactive. 
    */
    await User.findByIdAndUpdate(req.user.id, { active: false })

    res.status(204).json({
        status: 'success',
        data: null
    })
})

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined .. Please use signup instead'
    })
}
exports.getUser = factory.getOne(User)
exports.getAllUsers = factory.getAll(User)

// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)
