const EventEmitter = require('events')
const http = require('http')

/*!!Important -> Where ever you see .on() it is an event listner*/

/*
-) Here we are creating an event listners to capture event of 'newSale' just like we create in react js for window resize'.
-) Event listner should be registered before emitting the event.
 */
//const myEmitter = new EventEmitter() //here we are creating an object of class events
// myEmitter.on('newSale', () => {
//     console.log('There was a new sale')
// })

// myEmitter.on('newSale', () => {
//     console.log('Customer name: Buggz')
// })

/*
-) Here we are emitting an event known as 'newSale' just like when resizing browser window , it emits an event of 'resize'
 */

//myEmitter.emit('newSale')

/* ================================================Advance=========================================================*/
/*
-) when we add a window resize listener , on resizing window it also send the current dimentions of the window, similarly
   we can add that as a second argument in .emit()
 */

// myEmitter.on('newSale', (stock) => {
//     console.log(`There are now ${stock} item left in stock`)
// })

// myEmitter.emit('newSale', 9)


/*
-) We can make a class that extends the EventEmitter and then we can use the class name for object 
 */

class Sales extends EventEmitter {
    constructor() {
        super();
    }
}

const myEmitterClass = new Sales();

/**
 -) Example with http
 */
/*!!Important -> Where ever you see .on() it is an event listner*/
const server = http.createServer();

server.on("request", (req, res) => {
  console.log("Request received!");
  console.log(req.url);
  res.end("Request received");
});

server.on("request", (req, res) => {
  console.log("Another request 😀");
});

server.on("close", () => {
  console.log("Server closed");
});

server.listen(8000, "127.0.0.1", () => {
  console.log("Waiting for requests...");
});
