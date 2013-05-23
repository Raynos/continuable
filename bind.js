module.exports = bind

// bind :: (lambda:(A) => Continuable<B>) => (Continuable<A>) => Continuable<B>
function bind(lambda) {
    return function(source) {
        return function(callback) {
            source(function(err, value) {
                if (err) {
                    return callback(err)
                }

                lambda(value)(callback)
            })
        }
    }
}
