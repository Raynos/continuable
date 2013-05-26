var of = require("./of")

module.exports = either

//  either := (source: Continuable<A>,
//             left: (Error) => Continuable<B>,
//             right?: (A) => Continuable<B>)
//      => Continuable<B>
function either(cont, left, right) {
    right = right || of

    return function continuable(callback) {
        cont(function (err, value) {
            var next = err ? left(err) : right(value)

            next(callback)
        })
    }
}
