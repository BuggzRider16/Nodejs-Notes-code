const http = require('http')
const fs = require('fs')
const url = require('url')
const slugify = require('slugify')  // external URL package
const replaceTemplate = require('./modules/replaceTemplate')

const tempOverview = fs.readFileSync(`${__dirname}/templates/template-overview.html`, 'utf-8')
const tempProduct = fs.readFileSync(`${__dirname}/templates/template-product.html`, 'utf-8')
const tempCard = fs.readFileSync(`${__dirname}/templates/template-card.html`, 'utf-8')

const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8')
const dataObj = JSON.parse(data)

console.log(slugify('Fresh Avocado', { lower: true })) // checking what slugify do

const server = http.createServer((request, response) => {
    /*=======================================URL Module===============================================*/
    /* 
    -) url.parse() is used to parse the query string just like url decoder
    -) it returns an object.
    -) we have to pass true to enable parsing the query string as an object,
       if we not pass true it will return the string as it is.
    */

    //console.log(url.parse(request.url, true))

    const { query, pathname } = url.parse(request.url, true)

    if (pathname === '/overview' || pathname === '/') {
        response.writeHead(200, {
            'Content-type': 'text/html',
        })
        const cardsHtml = dataObj.map(el => replaceTemplate(tempCard, el)).join('');
        // now we have to replace the main placeholder of the template-overview
        const output = tempOverview.replace('{%PRODUCT_CARDS%}', cardsHtml);
        response.end(output);
    } else if (pathname === '/product') {
        response.writeHead(200, {
            'Content-type': 'text/html',
        })
        const product = dataObj[query.id]
        const output = replaceTemplate(tempProduct, product)
        response.end(output)
    } else if (pathname === '/api') {
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