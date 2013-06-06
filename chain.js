module.exports = chain

// chain := (Continuable<A>, lambda:(A) => Continuable<B>) => Continuable<B>
function chain(source, lambda) {
    return function continuable(callback) {
        source(function continuation(err, value) {
            if (err) {
                return callback(err)
            }

            lambda(value)(callback)
        })
    }
}
