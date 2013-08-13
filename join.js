module.exports = join

// join := (Continuable<Continuable<T>>) => Continuable<T>
function join(source) {
    return function continuable(callback) {
        source(function continuation(err, next) {
            if (err) {
                return callback(err)
            }

            next(callback)
        })
    }
}
