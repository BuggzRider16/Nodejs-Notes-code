const fs = require('fs')

const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
)

// router.param() middleware
exports.checkID = (req, res, next, val) => {
    console.log(`Tour id is: ${val}`)
    if (req.params.id * 1 > tours.length) {
        return res.status(404).json({  // we are returning this because we have to freeze the code after sending the response
            status: 'fail',
            message: 'Invalid ID'
        })
    }
    next()
}

exports.checkBody = (req, res, next) => {
    if (!req.body.name || !req.body.price) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing name or price'
      })
    }
    next()
  }

exports.getAllTours = (req, res) => {
    //changing data to json recommended pattern
    //In get we send response res

    console.log(req.requestTime) //testing middleware
    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: tours.length,
        data: {
            tours: tours
        }
    })
}

exports.getTour = (req, res) => {
    /*
-)  to create paramater in URL we use ':' operator following with a variable name.
-)  to create a optional param we use '?' after variable name. Eg ':id?' 
-)  request.params will then provide an object of params.
-)  We send 200 status code when get is successful
 */
    console.log(req.params)
    const id = req.params.id * 1
    const tour = tours.filter(item => item.id === id)
    //if (id < tours.length) { //if(tour)
    res.status(200).json({
        status: 'success',
        data: {
            tour: tour
        }
    })
}

exports.createTour = (req, res) => {
    /*
    -)  In post we receive data in  request req and sends responses res
     */
    //console.log(req.body)

    /*
    -) Now we will create a new ID and then will merge the new request with the id.
    -) Then we will push the data to tours object and then will write data back to file for permanent storage.
    -) We send 201 status code when post is successful
     */
    const newId = tours[tours.length - 1].id + 1
    const newTour = Object.assign({ id: newId }, req.body)
    tours.push(newTour)
    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
        res.status(201).json({
            status: 'success',
            data: {
                tours: tours
            }
        })
    })
}

exports.updateTour = (req, res) => {
    const id = req.params.id * 1
    // if (id < tours.length) { //if(tour)
    res.status(200).json({
        status: 'success',
        data: {
            tour: '<Updated tour here....>'
        }
    })
    //} 
}
exports.deleteTour = (req, res) => {
    /*
-) in case of delete we send 204 status code
 */
    const id = req.params.id * 1
    //if (id < tours.length) { //if(tour)
    res.status(204).json({
        status: 'success',
        data: null
    })
    // }
}
