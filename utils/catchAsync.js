/*
-) This functions receives the async middleware function and returns a
  function to the caller (here it will be the router).
-) This function gets the middleware signature  (req,res,next) from the caller
    as the caller is a middleware.
-) Then it passes down the params to the async function running there.
-) As inside the fn() there is an async function, so it will return a promise whose
   error or rejection can be catched by the catch().
-) For the question that why are we returning a anonymous function and inside that we
   are executing the function is
   1) To provide (req,res,next) to the inside async function which this function is 
      receiving from the router.
   2) The router should receive a function to run when a route hits it, not the result of the fuction,
      so we are creating a function that the router can call and run when required.
-) The catch is calling next as we already mentioned 
   -) If in the next() we pass any param then express automatically knows that it is an error, and this applies to all the next()s
      of all the middleware.
   -) Once we pass any param to next() of any middleware, then it will skip all the other middleware and will go directly to 
      the error handler middleware.
*/

module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next)
      .catch(next) //catch(err=> next(err))
  }
}
