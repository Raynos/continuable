module.exports = bind

// bind := (Continuable<A>, (A) => Continuable<B>) => Continuable<B>
// bind = join . map

function bind(source, lambda) {
    return function continuable(callback) {
        source(function continuation(err, value) {
            if (err) {
                return callback(err)
            }

            var next = lambda(value)
            next(callback)
        })
    }
}
