var map = require("./map")
var join = require("./join")

module.exports = bind

// bind :: (A => Continuable<B>) => (Continuable<A>) => Continuable<B>
function bind(lambda) {
    var mapped = map(lambda)

    return function duplex(source) {
        return join(mapped(source))
    }
}
