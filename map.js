module.exports = map

// map := (Continuable<A>, (A) => B) => Continuable<B>
function map(source, lambda) {
    return function continuable(callback) {
        source(function continuation(err, value) {
            if (err) callback(err)
            else callback(null, lambda(value))
        })
    }
}
