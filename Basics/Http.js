const http = require('http')

/*==================================Server==========================*/
/*
-)createServer() is used to create a new server.
-) it require a callback func with two params.
-) response.end() send the data to every client which connects to the server and it only sends string values .
-) Important! =>  there can be only one response.end().
-) Above the .createServer() execution is done only once, only that function repeats. So we can write
code blocking line in the start.
*/
const server = http.createServer((request, response) => {
    //console.log(request)
    response.end('Hello from the server')
})
/*
-) listen() receives three params => port number, address (if left empty is points to localhost), and a callback func.
-) To access this server use Address:Port (here http://127.0.0.1:8000/) in web browser.
*/
server.listen(8000, '127.0.0.1', () => {
    console.log('Listening to requests on port 8000')
})