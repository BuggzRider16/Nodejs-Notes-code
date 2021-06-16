const http = require('http')
const fs = require('fs')
const url = require('url')

const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8')
const dataObject = JSON.parse(data)

/* 
-) As we know top level code is only executed once and the code inside the createServer()
   callback is repeated every time a request comes so we will fetch the file in synchronous 
   way.
-) Always do the cpu intensive or repeated work outside the createServer()
   as the code outside it runs once before starting the server
*/

const server = http.createServer((request, response) => {
    console.log(request.url)
    const pathName = request.url
    if (pathName === '/overview') {
        response.end('You are checking the Overview')
    } else if (pathName === '/product') {
        response.end('You are checking the Product')
    } else if (pathName === '/api') {
        response.writeHead(200, { 'Content-type': 'application/json' })
        response.end(data)
    } else {
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