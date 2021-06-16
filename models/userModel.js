const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name'],
    },
    email: {
        type: String,
        required: [true, 'A user must have a email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid Email'],
    },
    photo: {
        type: 'String',
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password password'],
        minLength: [8, 'A password must have more or equal to 8 characters'],
        select: false //by this now password field will never be returned in any response
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            //this only works on create() and save()
            validator: function (el) {
                return el === this.password
            },
            message: 'Passwords are not the same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false //by this now active field will never be returned in any response
    }
})

/*========== Using mongoose middleware for encryption of passwords =========
-) Here we will be using document middleware of pre save to do the required changes.
-) We will encrypt password only when the sure adds/updates the password and not any other changes/
-) So to do that first we will check if 'password' field is modified or not by using
                    currentDocument.isModified(fieldName)
-) Below we are checking if anything accept 'password' is changed then we will go to next middleware.
-) For encryption we we use bcryptjs (npm i bcryptjs).
-) bcrypt.hash(this.password, 12) is a async function, so we will need to convert the whole function
   to async.
-) We will reset the passwordConfirm field to undefined because that field was only required for
   validation, so it is not required anywhere and hence not storing in DB.
 */

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next()
    }
    this.password = await bcrypt.hash(this.password, 12)
    //12 is the cost of encrytion basis of cpu work

    this.passwordConfirm = undefined
    next()
})

userSchema.pre('save', function (next) {
    /*
    -) This middleware is for reset password.
    -) Just before the saving the new password we are going to update the passwordChangedAt field.
    -) to do that first we will check if the password field is changed or not by using this.isModified(fieldName).
    -) this.isModified(fieldName) will be true if the document is created so we will again check that if the document is new or
       not by using this.isNew.  
    */
    if (!this.isModified('password') || this.isNew) {
        return next()
    }

    /*
    -) Sometimes there is a problem that saving to DB is slower then issuing JWT Token.
    -) So this will cause issue in changedPasswordAfter() as the JWT token issued timestamp will be smaller than the
        passwordChangedAt field and user will not be able to login.
    -) So be provide a hack i.e. we will subtract 1sec(1000ms) from the present time before assigning it to passwordChangedAt. 
    */
    this.passwordChangedAt = Date.now() - 1000
    next()
})

userSchema.pre(/^find/, function (next) {
    /*
    -) This middleware is used for restricting all the "find..." queries to not show the user having active false
    -) Here, this keyword points to the current query
    */
    this.find({ active: { $ne: false } })
    next()
})

/*============== Schema methods/ Instance methods ==============================
-) Schema methods are the helper methods which are used to work on schema fields.
-) we can declare schema by syntax
        schemaName.methods.methodName = function()
-) We can access this function anywhere we use this schema/model....in queries as well
*/

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    /*
    -) This function is used for checking if the password coming from client and password exsisting in DB are same or not 
    -) As in DB password is encrypted so we will use the bcrypt.compare() to do our work
    -) It will compare the current client password ( which is not encrypted) and the encryted password from DB and will
       return boolean value
    -) Here this.password will not provide the password from db as we are preventing the password to be shown in any 
       query, so we will receive password save in DB from params only
     */
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    /*
    -) This function we are using to check if the user has changed the password after login or not
    -) So we will check if the field of passwordChangedAt is there, if it is not there then the user didn't changed the password.
    -) If the JWTTimestamp < changedTimestamp then password is changed
    */
    if (this.passwordChangedAt) {
        // getting timestamp
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        )
        //console.log(JWTTimestamp , changedTimestamp, JWTTimestamp < changedTimestamp)
        return JWTTimestamp < changedTimestamp
    }
    // False means NOT changed
    return false
}

userSchema.methods.createPasswordResetToken = function () {

    /*
    -) Here we will create a random reset token.
    -) To create a reset token we will use crypto libraby from Node.js
    */

    // using the crypto object and then creating random bytes of length 32,then converting that to hexadecimal using .toString('hex)
    const resetToken = crypto.randomBytes(32).toString('hex')

    /*
    -) Here now we are encrypting the reset token and saving to DB prevent the leak of reset token usage if someone else hacks the DB.
    -) creating a hash using .createHash('sha256') with 'sha256' algorithm.
    -) Then we are updating the resetToken created in previous step with hash.
    -) Then we are converting the result to hexadecimal
    */
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

    console.log({ resetToken }, this.passwordResetToken)

    // Here we are creating a password reset token time which we are giving to 10 mins
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000

    // We will return the orginal reset token so that it can be send through email.

    return resetToken
}

const Users = mongoose.model('User', userSchema)

module.exports = Users