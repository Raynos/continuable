module.exports = mapAsync

// mapAsync := (Continuable<A>, lambda: (A, Callback<B>)) => Continuable<B>
function mapAsync(source, lambda) {
    bind(source, function(value) {
        return function continuable(callback) {
            lambda(value, callback)
        }
    })
}
