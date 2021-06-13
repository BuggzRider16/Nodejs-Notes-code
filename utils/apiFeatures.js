class APIFeatures {
    constructor(query, queryString) {
        this.query = query
        this.queryString = queryString
    }

    filter() {
        /*===Now we are implementing basic filtering===
                -) To get query params we used req.query.
                -) There are two ways of filtering data in mongoose.
                1) await Tour.find({
                    duration:5,         // directly pass the query object
                    difficulty:'easy',   
                })
                2) const allTours = await Tour.find()
                    .where('duration')
                    .equals(5).
                    where('difficulty')
                    .equals('easy')
                 */

        /*
        -) For pagination, sort, limit, fields etc , we have to remove all the fields from query object so that our Tour.find query
           will not take it as a entry of the collection and filter on those fields.
         */

        const queryObj = { ...this.queryString }
        const excludedFields = ['page', 'sort', 'limit', 'fields']
        excludedFields.forEach(el => delete queryObj[el])


        /*=============== Advance filtering ============
        -) Eg of adding operator in filtering in a mongoDB query - 
               db.tour.find({difficulty: 'easy', duration: {$gte: 5}})
        -) For the above query we need to edit URl for adding operator in this way -
               127.0.0.1:3000/api/v1/tours?difficulty=easy&duration[gte]=5
        -) For the above url we will receive the following query in req.query
                {difficulty: 'easy', duration:{gte:'5'}}
        -) So we need to add the $ before gte in the incoming object.
        -) So first we will convert the query object to string and replace gte with $gte
        */

        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
        //let query = Tour.find(JSON.parse(queryStr))//let query = Tour.find(JSON.parse(queryStr))
        this.query = this.query.find(JSON.parse(queryStr))

        return this
    }

    sort() {

        /*================== Sorting ====================
        -) So for sorting we will use the sort on the exsisting query.
        -) In other words we are chaining the queries,
        -) To sort multiple fields we have to get space spreated string 
                query.sort(price rating)
        -) For above URl will be 
                    127.0.0.1:3000/api/v1/tours?sort=price,rating
        -) To have decending sorting add - before the field in URL 
        -) For above URl will be 
                    127.0.0.1:3000/api/v1/tours?sort=price,-rating
        */

        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ')
            console.log(sortBy)
            this.query = this.query.sort(sortBy)
        } else {
            // Adding default sort
            this.query = this.query.sort('-createdAt')
        }
        return this
    }

    limitField() {
        /*============ Limiting================
                -)Operation of selecting certain filed names is called projecting.
                -) In query.select() we need to provide the names of the fields which the user wants
                    Eg query.select(name duration ratingAverage)
                -) If we want to remove any fields , add - in the starting of that field name.
                    Eg query.select(-name -duration ratingAverage)
                -) URL is like
                    127.0.0.1:3000/api/v1/tours?fields=name,duration,price
                -) _id will always be there.
                 */

        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ')
            this.query = this.query.select(fields)
        } else {
            // Adding default field removal
            this.query = this.query.select('-__v')
        }
        return this
    }

    paginate() {
        /*=============Pagination =================
               -) .skip() is for how many documents must be skipped.
               -) .limit() is for setting a limit for how many documents should db should return.
               -) If user has requested a page which is more than that of the total number of documents then we will calculate 
                  the number of documents by Tour.countDocuments() and will check, if check is true then will raise an error.
                */
        const page = this.queryString.page * 1 || 1 // changing string to number and defining default value
        const limit = this.queryString.limit * 1 || 100
        const skip = (page - 1) * limit      // formula for skipping
        this.query = this.query.skip(skip).limit(limit)

        // if (this.queryString.page) {
        //     const numTours = await Tour.countDocuments()
        //     if (skip >= numTours) {
        //         throw new Error('This page do not exist')
        //     }
        // }
        return this
    }
}

module.exports = APIFeatures