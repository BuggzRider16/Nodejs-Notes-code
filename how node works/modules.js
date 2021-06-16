/*
-) Everything we right inside a Nodejs file is wrapped inside a wrapper function having the arguments exports,require,
   module, __filename, __dirname
-) If we console.log(arguments) we will able to see every one of them.
-) To view the wrapper template itself use console.log(require('module').wrapper).

 */

// console.log(arguments)
// console.log(require('module').wrapper)

/* ========  module.exports (for single entity exports)========= */
// const C = require('./test-module-1')

// const calc1 = new C()
// console.log(calc1.add(2, 5))

/*============ exports (for multiple entity exports) ===========*/
const calc2 = require('./test-module-2')

console.log(calc2.add(2, 5))

// Caching
/* 
-) this will result to this
hello form the module
Log this beautiful text
Log this beautiful text
Log this beautiful text
-) this happens due to cashing as once we import the module it is cashed and then it is not called again
*/
require('./test-module-3')()
require('./test-module-3')()
require('./test-module-3')()

