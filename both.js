// both := (Continuable) => Continuable<[Error, Any]>
module.exports = both

function both(source) {
    return function continuable(callback) {
        source(function (err, value) {
            callback(null, [err || null, value])
        })
    }
}
