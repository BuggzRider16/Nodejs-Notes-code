const fs = require('fs') // required for working with files

/* =====================Synchronous======================*/
/*
-) fs.readFileSync() is used for fetching data from file.
-) This is a synchronous Function.
-) First param is the address and second one is encoding of file.
-) If we do not send encoding the it will return a buffer. */

// const textIn = fs.readFileSync('./txt/input.txt', 'utf-8')
// console.log(textIn)
// const textOut = `This is what we know about the avocado ${textIn}.\nCreated on date: ${Date.now()}`

/*
-) fs.writeFileSync() is used for writing to file.
-) First param is the address of the file and second param is the content to
be written on file*/

// fs.writeFileSync('./txt/output.txt', textOut)
// console.log('File Written !!!')

/* =====================Asynchronous======================*/
/*
-) fs.readFile(), fs.writeFile() are same as previous but Async.
-) Is uses a callback function  
-) __dirname is a node global variable used for indicating current directory.
*/
const textinAsync = fs.readFile('./txt/start.txt', 'utf-8', (err, data1) => {
    fs.readFile(`${__dirname}/txt/${data1}.txt`, 'utf-8', (err, data2) => {
        fs.readFile(`./txt/append.txt`, 'utf-8', (err, data3) => {
            fs.writeFile('./txt/final.txt', `${data2}\n${data3}`, 'utf-8', err => {
                console.log('File has been writen.')
            })
        })
    })
})
console.log("Started reading file...")



