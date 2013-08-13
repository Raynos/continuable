module.exports = mapAsync

// mapAsync := (Continuable<A>, lambda: (A, Callback<B>)) => Continuable<B>
function mapAsync(source, lambda) {
    return function continuable(callback) {
        source(function continuation(err, value) {
            if (err) {
                return callback(err)
            }

            lambda(value, callback)
        })
    }
}
