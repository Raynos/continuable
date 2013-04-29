var map = require("./map")
var bind = require("./bind")
var of = require("./of")

module.exports = ContinuableAlgebra

function ContinuableAlgebra(continuable) {
    continuable._type = "continuable@ContinuableAlgebra"

    continuable.map = function (lambda) { map(lambda)(continuable) }
    continuable.chain = function (lambda) { bind(lambda)(continuable) }
    continuable.of = of

    return continuable
}
