var test = require("tape")

var read = require("./util/readValue")

var continuable = require("../index")
var of = require("../of")
var error = require("../error")
var chain = require("../chain")
var map = require("../map")
var join = require("../join")
var bind = require("../bind")
var to = require("../to")

test("continuable is a function", function (assert) {
    assert.equal(typeof continuable, "function")
    assert.end()
})

test("of:(v:Value) => Continuable<v:Value>", function(assert) {
    var val = {}
    var contVal = of(val)

    var result = read( contVal )[1]

    assert.equal( result, val )
    assert.end()
})

test("error:(Error) => Continuable<void>", function(assert) {
    var err = new Error("Some error")
    var contErr = error(err)

    assert.equal( read( contErr )[0], err )
    assert.deepEqual( read( contErr ), [err] )
    assert.end()
})

test("chain:(C<A>, lambda:(A) => C<B>) => C<B>", function(assert) {
    var value = {}
    var err = new Error("Broken")

    var continuableA
    var continuableAErr
    var continuableB
    var continuableBErr

    var aToContB = function(a) {
        return of(a)
    }

    continuableA = of(value)
    continuableAErr = error(err)

    continuableB = chain(continuableA, aToContB)
    continuableBErr = chain(continuableAErr, aToContB)


    assert.equal( read( continuableB )[1], value )
    assert.deepEqual( read( continuableB ), [null, value] )

    assert.equal( read( continuableBErr )[0], err )
    assert.deepEqual( read( continuableBErr ), [err] )
    assert.end()
})

test("map:(C<A>, lambda:(A) => B) => C<B>", function(assert) {
    var value = "A"
    var continuableA
    var continuableB

    var aToB = function(a) {
        return transform(a)
    }

    continuableA = of(value)
    continuableB = map(continuableA, aToB)


    assert.deepEqual( read( continuableB ), [null, transform(value)] )
    assert.end()


    function transform(a) {
        return a + a
    }
})

test("join:(Continuable<Continuable<A>>) => Continuable<A>", function(assert) {
    var value = {}
    var contA = of(value)
    var contContA = of(contA)

    var joined = join(contContA)

    // Signature
    assert.deepEqual( read( joined ), read( contA ) )

    // Actual same object
    assert.equal( read( joined )[1], read( contA )[1] )
    assert.end()
})

test("bind:(C<A>, lambda:(A) => C<B>) => C<B>", function(assert) {
    var value = "A"
    var continuableA
    var continuableB

    var aToB = function(a) {
        return of(transform(a))
    }

    continuableA = of(value)
    continuableB = bind(continuableA, aToB)


    assert.deepEqual( read( continuableB ), [null, transform(value)] )
    assert.end()


    function transform(a) {
        return a + a
    }
})

test("to:(AsyncFunction => MaybeContinuable)", function (assert) {
    var cont = to(function async(name, cb) {
        cb(null, "hello " + name)
    })

    assert.equal(typeof cont, "function")

    var r = Math.random()

    cont(r)(function (err, hello) {
        assert.ifError(err)
        assert.equal("hello " + r, hello)
        var r2 = Math.random()
        var continuable = cont(r2)
        continuable(function (err, hello) {
            assert.ifError(err)
            assert.equal("hello " + r2, hello)

            continuable(function (err, hello) {
                assert.ifError(err)
                assert.equal("hello " + r2, hello)

                assert.end()
            })
        })
    })
})
