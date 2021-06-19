const http = require('http')
const url = require('url')

const server = http.createServer((request, response) => {
    console.log(request.url)
    /*==========================Routing============*/
    /*
    -) Here we are storing the router the client is trying to access using request.url
    -) Then nin normal if- else ladder we will check and give response respectively. 
    */
    const pathName = request.url
    if (pathName === '/overview') {
        response.end('You are checking the Overview')
    } else if (pathName === '/product') {
        response.end('You are checking the Product')
    } else {
        /*
        -) response.writeHead() is used to write and send headers to client.
        -) first param receives the status code and second one receives the headers.
        -) we can add our own headers.
        -) headers should be created before sending any response to client.
        */
        response.writeHead(404, {
            'Content-type': 'text/html',
            'my-own-header': 'hello-world'
        })
        response.end('<h1>Page not found</h1>')
    }
})
server.listen(8000, '127.0.0.1', () => {
    console.log('Listening to requests on port 8000')
})