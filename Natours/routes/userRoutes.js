const express = require('express')
const userController = require('./../controllers/userController')
const authController = require('./../controllers/authController')
const router = express.Router()

/*
-) We can write route for signup same as other routes (like for / or /:id)
   but here we will provide a direct router.post(...) as we have only one route for
   signup and that is post.
-) All the routes having authController.protect middleware are protected/ can be accessed only after login.
-) And all those routes handler will automatically receive current user details as we are assigning userdata
   in request body. 
*/

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.get('/logout', authController.logout)

router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)

/*
-) As from this point we need all the routes to be protected.
-) So instead of adding authController.protect for every route we can add that middleware using router.use().
-) As all the middleware run in sequence , so it will protect all the routes down befow
*/

router.use(authController.protect)

router.patch('/updateMyPassword', authController.updatePassword)
router.get('/me',
    userController.getMe,
    userController.getUser) // behind the scenes it uses get user only
router.patch('/updateMe',
    userController.uploadUserPhoto,
    userController.resizeUserPhotos,
    userController.updateMe)
router.delete('/deleteMe', userController.deleteMe)

router.use(authController.restrictTo('admin')) // restricting access of the below routes only to admin

router.route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser)

router.route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser)

module.exports = router