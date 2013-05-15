var map = require("./map")
var bind = require("./bind")
var of = require("./of")

module.exports = ContinuableAlgebra

function ContinuableAlgebra(continuable) {
    continuable._type = "continuable@ContinuableAlgebra"

    continuable.map = function (lambda) {
        return ContinuableAlgebra(map(lambda)(continuable))
    }
    continuable.chain = function (lambda) {
        return ContinuableAlgebra(bind(lambda)(continuable))
    }
    continuable.of = function (value) {
        return ContinuableAlgebra(of(value))
    }

    return continuable
}
