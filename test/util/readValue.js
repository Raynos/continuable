module.exports = function(continuable) {
    var r = []
    continuable(function(err, val) {
        if (err !== undefined) {
            r[0] = err
        }
        if (val !== undefined) {
            r[1] = val
        }
    })
    return r
}
