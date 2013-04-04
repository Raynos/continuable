var test = require("tape")

var continuable = require("../index")

test("continuable is a function", function (assert) {
    assert.equal(typeof continuable, "function")
    assert.end()
})
