'use strict';

var cont = require('../index.js')
var fs = require('fs')

// Idea for callbacks as values

// ## Example

!function () {
    var readFile = function (uri) {
        return function continuable (cb) {
            fs.readFile(uri, cb)
        }
    }

    // Check map.js, this is the actual source
    function map(source, lambda) {
        return function continuable(callback) {
            source(function continuation(err, value) {
                if (err) {
                    return callback(err)
                }

                callback(null, lambda(value))
            })
        }
    }

    var fileAsString = map(readFile('./file.json'), String)
    var fileAsJSON = map(fileAsString, function (x) { return JSON.parse(x) })

    fileAsJSON(function (err, json) {
        console.log('Continuable', err, json)
    })
}()


// ## Docs

// ### `Continuable(callback)`

// type Continuable := (callback:(Error, Value) => void) => void

// A continuable is simply a function that takes a single argument, a callback.
// The callback get's called with the normal node error and value pattern.

// readFile := (String) => Continuable<Buffer>
var readFile = function (uri) {
    return function continuable (callback) {
        fs.readFile(uri, callback)
    }
}

readFile('./file.json') (function (err, buff) {
    console.log('readFile', err, buff)
})

// The reason to have a continuable instead of passing a callback directly into
// another value is that a continuable is a concrete value that can be returned.

// Which means you can call useful functions on this value like `map` and `join`


// ### `to(asyncFunction)`

// take an async function and return a function that works as async function or continuable.

var readFile = cont.to(fs.readFile)

readFile('./file.json') (function (err, buff) {
    console.log('to', err, buff)
})


// ### `map(source, lambda)`

// map := (source:Continuable<A>, lambda:(A) => B) => Continuable<B>

// map takes a transformation function and a continuable and returns a new
// continuable. The new continuable is the value of the first continuable
// transformed by your mapping function.

var readFileAsString = function (uri) {
    return cont.map(readFile(uri), String)
}

var readFileAsJSON = function (uri) {
    return cont.map(readFileAsString(uri), function (x) { return JSON.parse(x) })
}

readFileAsJSON('./file.json') (function (err, json) {
    console.log('map', err, json)
})


// ### `mapAsync(source, lambda)`

// mapAsync := (source: Continuable<A>, lambda: (A, Callback<B>)) => Continuable<B>

// mapAsync takes an asynchronous transformation function and a source
// continuable. The new continuable is the value of the first continuable
// passed through the async transformation.

var copyFile = function (source, destination) {
    return cont.mapAsync(readFileAsJSON(source), function (json, cb) {
        json.copied = Date.now()
        fs.writeFile(destination, JSON.stringify(json), cb)
    })
}

copyFile('./file.json', './file1.json') (function (err) {
    console.log('mapAsync', arguments)
})


// ### `join(continuable)`

// join := (source:Continuable<Continuable<T>>) => Continuable<T>

// `join` takes a continuable that contains another continuable and flattens it by
// one layer. This is useful if you return another asynchronous operation from
// `map`

var writeFile = cont.to(fs.writeFile)

var copyFile = function (source, destination) {
    return cont.map(readFileAsJSON(source), function (json) {
        json.copied = Date.now()
        return writeFile(destination, JSON.stringify(json)) // Returning a continuable
    })
}

cont.join(copyFile('./file.json', './file2.json')) (function (err) {
    console.log('join', arguments)
})


// ### `chain(continuable, lambda)`

// chain := (Continuable<A>, (A) => Continuable<B>) => Continuable<B>

// `chain` takes a lambda function that is given the value and returns another
// continuables. The result will be a continuable given the value of the
// returned continuable.

// In combination with `of` this makes `Continuable` a monad.

// Alternatively this can be seen as sugar for `map` followed by `join`

var copyFile = function (source, destination) {
    return cont.chain(readFileAsJSON(source), function (json) {
        json.copied = Date.now()
        return writeFile(destination, JSON.stringify(json))
    })
}

copyFile('./file.json', './file3.json') (function () {
    console.log('chain', arguments)
})


// ### `of(value)`

// of := (Value) => Continuable<Value>

// `of` takes any value and returns a Continuable for this value. This is useful
// if you want to implement a function that either returns a value or a
// continuable.

var cache = {
    './cached.json': { foo: 'I am cached haha'}
}

var cachedFile = function cachedFile (uri) {
    var cached = cache[uri]

    if (cached) return cont.of(cache[uri])

    return cont.map(readFileAsJSON(uri), function (json) {
        cache[uri] = json
        console.log('added to cache.', cache)
        return json
    })
}

cachedFile('./file.json') (function (err, json) {
    console.log('of - from file', err, json)
});

cachedFile('./cached.json') (function (err, json) {
    console.log('of - from cache', err, json)
});


// ### `error(err)`

// error := (Error) => Continuable<void>

// `error` takes any error and returns a Continuable that will return said error.
// This is useful if you want to transform a normal continuable into an
// error state one. This lets you augment continuables with additional error states.

var copyFile = function (source, destination) {
    if (!destination) { return cont.error(new Error('Need destination path!')) }

    return cont.chain(readFileAsJSON(source), function (json) {
        json.copied = Date.now()
        return writeFile(destination, JSON.stringify(json))
    })
}

copyFile('./file.json', './file4.json') (function () {
    console.log('chain', arguments)
})

// ### `either(continuable, left, right?)`

// either := (source: Continuable<A>,
//            left: (Error, cb: Callback<B>) => Continuable<B>,
//           right?: (A) => Continuable<B>)
//     => Continuable<B>

// `either` takes a source continuable and a left and right function.
// It will either call the left function with the error in source
// or call the right function with the value in the source.

// The returned continuable will contain the value returned from
// either left or right. Note that left and right return
// continuables themself.

// The left function can either return a Continuable or call the
// passed callback directly. For example:

var statFile = cont.to(fs.stat)

var maybeFile = function (uri) {
    return cont.either(statFile(uri), function left (err, cb) {
        if (err.code === 'ENOENT') {
            return cb(null, null)
        }

        cb(err)
    })
}

maybeFile('') (function () {
    // if stat returns a file not found then item is null
    console.log('either - file not found', arguments)
})

// if stat returns a random disk error then error!

maybeFile('./file.json') (function () {
    // if stat returns the stat then the stat!
    console.log('either - item', arguments)
})
