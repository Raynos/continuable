module.exports = chain

// bind :: (Continuable<A>, lambda:(A) => Continuable<B>) => Continuable<B>
function chain(source, lambda) {
    return function(callback) {
        source(function(err, value) {
            if (err) {
                return callback(err)
            }

            lambda(value)(callback)
        })
    }
}
