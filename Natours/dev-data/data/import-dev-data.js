const fs = require('fs')
const Tour = require('./../../models/tourModel')
const Review = require('./../../models/reviewModel')
const User = require('./../../models/userModel')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
dotenv.config({ path: './config.env' })
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
})
    .then(connection => {
        console.log('DB connection successful...!!!')
    })

//Read Json file

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'))
//Import data into DB

const importData = async () => {
    try {
        await Tour.create(tours)
        await User.create(users, { validateBeforeSave: false }) //turning off validation just for importing data
        await Review.create(reviews)
        console.log('Data successfully loaded')
        process.exit()
    } catch (err) {
        console.log(err)
    }
}

const deleteData = async () => {
    try {
        await Tour.deleteMany()
        await User.deleteMany()
        await Review.deleteMany()
        console.log('Data successfully deleted')
        process.exit()
    } catch (err) {
        console.log(err)
    }
}

switch (process.argv[2]) {
    case '--import':
        importData()
        break
    case '--delete':
        deleteData()
        break
    default:
        console.log('invalid choice')
}

console.log(process.argv)