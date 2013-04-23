module.exports = map

// map := ((A) => B) => (Continuable<A>) => Continuable<B>
function map(lambda) { return function duplex(source) {
    return function continuable(callback) {
        source(function continuation(err, value) {
            return err ? callback(err) : callback(null, lambda(value))
        })
    }
} }
