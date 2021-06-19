const fs = require('fs')
const server = require('http').createServer()

server.on('request', (req, res) => {

    /*===== solution 1 (without streams) ====*/
    // fs.readFile("test-file.txt", (err, data) => {
    //     if (err) {
    //         console.log(err)
    //     }
    //     res.end(data)
    // })

    /*================ Solution 2 : Streams ===================*/
    /*
    -) the createReadStream() will create a stream of data on a chunk by chunk basis.
    -) Then we will add an event listener, listening to 'data' event, and once a chunk is avaialable 
       we will send to client
    -) Then will add an event listener, listening to 'end' event showing that data read is complete.
    -) in end EV( Event Listener) we will then send response.end() as response.end() is also a stream and we need to end it.
     */
    // const readable = fs.createReadStream('test-file.txt')
    // readable.on('data', chunk => {
    //     res.write(chunk)
    // })
    // readable.on('end', () => {
    //     res.end()
    // })
    // readable.on('error', err=>{
    //     console.log(err)
    //     res.statusCode = 500
    //     res.end("File not found")
    // })

    /*================ Solution 3 : Streams Pipe ===================*/
    /*
    -) Solution 2 has a drawback that is the createReadStream is much much faster then the response writable stream.
    -) This will overwhelm the response writable stream and can cause issues which are known as "backpressure".
    -) So here we will use the pipe operator which will sync the speed of data coming in and going out.
    -) Syntax readableSource.pipe(writeableDestination)
     */
    const readable = fs.createReadStream('test-file.txt')
    readable.pipe(res)
})

server.listen(8000, '127.0.0.1', () => {
    console.log("Listening.....")
})