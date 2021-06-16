const dotenv = require('dotenv')
const mongoose = require('mongoose')

process.on('uncaughtException', err => {  //caused by not handling exception in synchronous code like using an undefined variable
    console.log('Uncaught Exception! 💥 Shutting down...')
    console.log(err.name, err.message)
    process.exit(1)
})

dotenv.config({ path: './config.env' })
const app = require('./app')

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

/*
-) To connect to mongoDB, we use the mongoose driver.
-) In mongoose.connect() we will pass the DB connection string and some parameters to deal with some deprication warnings.
-) mongoose.connect() is a promise and it will return the connection param in then
 */
mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})
    .then(connection => {
        //console.log(connection.connections)
        console.log('DB connection successful...!!!')
    })



const port = process.env.PORT || 3000
const server = app.listen(port, () => {
    console.log(`App running on port ${port}`)
})

/*
-) For errors like DB connection fail etc the application will not entered the express and failed outside our centralised error handling
-) so we are subscribing to 'unhandledRejection' event which is caused when a promise rejection is not handled, here in our case is DB failure.
-) so from here we will simply exit our program with process.exit(1) where 1 is for uncaught exception and 0 is for successful.
-) First we will close the server and then we will shutdown the program as a callback
*/
process.on('unhandledRejection', err => {  //caused by not handling rejection of promise
    console.log('UNHANDLED REJECTION! 💥 Shutting down...')
    console.log(err.name, err.message)
    server.close(() => {
        process.exit(1)
    })
})
