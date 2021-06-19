const multer = require('multer')
const sharp = require('sharp')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const factory = require('./handlerFactory')

/*=============================== File upload by multer ============================================ */

/*
-) Multer (npm i multer) is a package used to upload files like images.
-) Files such as images are never saved in DB , the are saved in the file system and in DB we pass the URL of that image.

-) In multerStorage() we will use the multer disk storage (other option is to store in memory as buffer) and inside that will provide
   destination and file name.
-) Destination and filename both are functions receiving request, file response and a callback function (same as next of express)
-) For destination the callback funtion first param is the error and second is destination 
-) For filename the callback funtion first param is the error and second is filename.
-) As we have to resize the image using sharp we will store the image file to memory and after resize will store it to disk Storage.
*/

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users')
//     },
//     filename: (req, file, cb) => {
//         //user-userID-currentTimestamp.fileExtention
//         const ext = file.mimetype.split('/')[1]
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//     }
// })

const multerStorage = multer.memoryStorage()

/*
-) In multerFilter() we are filtering if the incomming file is a image or not
*/
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Not an image! Please upload only images'), false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

/*
-)Adding a middleware to upload images where 'photo' is the name of the field which will contain the image
*/
exports.uploadUserPhoto = upload.single('photo')

/*============================================== multer ends ==================================================*/

/*========================================= Using sharp for image processing ================================== */
/*
-) Here we are using sharp package to resize large images .
-) From multer library we are storing the image in the memory buffer instead of storing it to disk.
-) Then we are setting the file name to req.file.filename so that it is accessible for future middlewares like the updateMe one.
*/

exports.resizeUserPhotos = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next()
    }
    req.file.filename = `user-${req.user.id}-${Date.now()}`
    await sharp(req.file.buffer) // getting file from memory
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`) //storing it to disk
    next()
})

/*================================================== sharp completes ======================================= */

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

    if (req.file) { // adding image as well in the update
        filteredBody.photo = req.file.filename
    }

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
