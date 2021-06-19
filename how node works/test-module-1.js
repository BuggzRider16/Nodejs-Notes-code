/*
-) Use module.export to export a single entity or expression
 */

// Eg 1
// class Calculator {
//     add(a, b) {
//         return a + b;
//     }

//     multiply(a, b) {
//         return a * b
//     }

//     divide(a, b) {
//         return a / b
//     }
// }
// module.exports = Calculator

//Eg 2

module.exports = class {
    add(a, b) {
        return a + b;
    }

    multiply(a, b) {
        return a * b
    }

    divide(a, b) {
        return a / b
    }
}