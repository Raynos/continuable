var of = require("./of")

module.exports = either

//  either := (source: Continuable<A>,
//             left: (Error, cb?: Callback<B>) => Continuable<B>,
//             right?: (A) => Continuable<B>)
//      => Continuable<B>
function either(cont, left, right) {
    right = right || of

    return function continuable(callback) {
        cont(function (err, value) {
            if (!err) {
                return right(value)(callback)
            }

            // the left function takes either a callback or
            // it returns a continuable. Both are valid
            var cont = left(err, callback)

            if (cont) {
                cont(callback)
            }
        })
    }
}
