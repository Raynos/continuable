module.exports = of

// of := (Value) => Continuable<Value>
function of(value) {
    return function continuable(callback) {
        callback(null, value)
    }
}
