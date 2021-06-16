const fs = require('fs')
const crypto = require("crypto")

const start = Date.now()
process.env.UV_THREADPOOL_SIZE = 4; //default size of thread pool is 4

setTimeout(() => console.log("Timmer 1 finished"), 0)

/*==========setImmediate()====================
-) When you want to execute some piece of code asynchronously, but as soon as possible,
   one option is to use the setImmediate() function provided by Node.js: setImmediate(() => { //run something }).
-) Any function passed as the setImmediate() argument is a callback that's executed in the next iteration of the event loop.
 */

setImmediate(() => console.log("Immediate 1 finished"))

fs.readFile('txt-file.txt', () => {
    console.log("I/O finished")

    setTimeout(() => console.log("Timmer 2 finished"), 0)
    setTimeout(() => console.log("Timmer 3 finished"), 3000)
    setImmediate(() => console.log("Immediate 2 finished"))

    process.nextTick(() => console.log("Process.nextTick"))

    /*
    -) here now we are checking how encryption of password will be outsourced to thread pool.
    -) the "crypto" module automatically does that.
    -) the encryption will be finished at the same time for all.
    -) But if we reduce the thread pool size to 1 (by using process.env.UV_THREADPOOL_SIZE = 1),
       then all the task will be moved to one pool only and the total time will increase.
     */
    crypto.pbkdf2('password', 'salt', 100000, 1024, 'sha512', () => {
        console.log((Date.now() - start) / 1000, "Password encrypted")
    })
    crypto.pbkdf2('password', 'salt', 100000, 1024, 'sha512', () => {
        console.log((Date.now() - start) / 1000, "Password encrypted")
    })
    crypto.pbkdf2('password', 'salt', 100000, 1024, 'sha512', () => {
        console.log((Date.now() - start) / 1000, "Password encrypted")
    })
    crypto.pbkdf2('password', 'salt', 100000, 1024, 'sha512', () => {
        console.log((Date.now() - start) / 1000, "Password encrypted")
    })

    /*
    -) If we use Sync() of crypto the it will block the code completely
    */

    // crypto.pbkdf2Sync("password", "salt", 100000, 1024, "sha512");
    // console.log(Date.now() - start, "Password encrypted");

    // crypto.pbkdf2Sync("password", "salt", 100000, 1024, "sha512");
    // console.log(Date.now() - start, "Password encrypted");

    // crypto.pbkdf2Sync("password", "salt", 100000, 1024, "sha512");
    // console.log(Date.now() - start, "Password encrypted");

    // crypto.pbkdf2Sync("password", "salt", 100000, 1024, "sha512");
    // console.log(Date.now() - start, "Password encrypted");

})

console.log("Hello from the top-level code")