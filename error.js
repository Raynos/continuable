module.exports = error

// error := (Error) => Continuable<void>
function error(err) {
    return function continuable(callback) {
        callback(err)
    }
}
