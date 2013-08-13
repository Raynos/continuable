# continuable

[![build status][1]][2] [![dependency status][3]][4]

[![browser support][5]][6]

Idea for callbacks as values

## Example

```js
var readFile = function (uri) {
    return function (cb) {
        fs.readFile(uri, cb)
    }
}

function map(source, lambda) {
    return function continuable(callback) {
        source(function (err, value) {
            callback(err, err ? null : lambda(value))
        })
    }
}

var asString = map(readFile("/tmp/foo.json"), String)
var asJSON = map(asString, function (x) { return JSON.parse(x) })

asJSON(function (err, value) {
    /* do stuff with JSON */
})
```

## Docs

### `Continuable(callback)`

```js
type Continuable := (callback:(Error, Value) => void) => void
```

A continuable is simply a function that takes a single argument, a callback.
The callback get's called with the normal node error and value pattern.

```js
// readFile := (String) => Continuable<Buffer>
var readFile = function (uri) {
    return function continuable(callback) {
        fs.readFile(uri, callback)
    }
}
```

The reason to have a continuable instead of passing a callback directly into
another value is that a continuable is a concrete value that can be returned.

Which means you can call useful functions on this value like `map` and `join`

### `to(asyncFunction)`

take an async function and return a function that works as async function or continuable.

``` js
var readFile = continuable.to(fs.readFile)

readFile (path, 'utf8') (function (err, text) {
  //there you go
})
```

### `map(source, lambda)`

```js
map := (source:Continuable<A>, lambda:(A) => B) => Continuable<B>
```

map takes a transformation function and a continuable and returns a new
continuable. The new continuable is the value of the first continuable
transformed by your mapping function.

```js
var asString = map(readFile("/tmp/foo.json"), String)
var asJSON = map(asString, function (x) { return JSON.parse(x) })

asJSON(function (err, json) {
    /* do stuff */
})
```

### `mapAsync(source, lambda)`

```ocaml
mapAsync := (source: Continuable<A>, lambda: (A, Callback<B>))
    => Continuable<B>
```

mapAsync takes an asynchronous transformation function and a source
continuable. The new continuable is the value of the first continuable
passed through the async transformation.

```js
var asString = map(readFile("/tmp/foo.json"), String)
var asJSON = map(asString, function (x) { return JSON.parse(x) })

var written = mapAsync(asJSON, function (json, cb) {
    fs.writeFile("/tmp/bar.json", JSON.stringify(json), cb)
})

written(function (err, writeResult) {
    /* stuff */
})
```

### `join(continuable)`

```js
join := (source:Continuable<Continuable<T>>) => Continuable<T>
```

`join` takes a continuable that contains another continuable and flattens it by
one layer. This is useful if you return another asynchronous operation from
`map`

```js
var asString = map(readFile("/tmp/foo.json"), String)
var asJSON = map(asString, function (x) { return JSON.parse(x) })

var write = map(asJSON, function (json) {
    return function continuable(cb) {
        fs.writeFile("/tmp/bar.json", JSON.stringify(json), cb)
    }
})

join(write)(function (err, writeResult) {
    /* stuff */
})
```

### `both(source)`

```ocaml
continuable := (Continuable<A>) => Continuable<[Error, A]>
```

`both` takes a continuable and returns a continuable containing a tuple of
    the error and the value. The returned continuable will never contain an
    error.

This is useful for handling errors using if statements

```js
var fileOrNull = function (uri) {
    var source = fs.readFile.bind(null, uri)
    var maybeFile = both(source)

    return map(maybeFile, function (err, tuple) {
        if (tuple[0]) {
            return null
        }

        return tuple[1]
    })
}
```

### `of(value)`

```js
of := (Value) => Continuable<Value>
```

`of` takes any value and returns a Continuable for this value. This is useful
    if you want to implement a function that either returns a value or a
    continuable.

```js
function getThing() {
    var thing = localStorage.getItem("thing")

    if (thing) return of(thing)

    return ajax("/thing")
}
```

### `error(err)`

```js
error := (Error) => Continuable<void>
```

`error` takes any error and returns a Continuable that will return said error.
    This is useful if you want to transform a normal continuable into an
    error state one.

```js
var body = getBody(req, res)

var dbWrite = map(body, function (body) {
    if (!body) {
        return error(new Error("Need body"))
    }

    return db.write(body)
})

join(dbWrite)(function (err, writeResult) {
    /* do stuff */
})
```

### `chain(continuable, lambda)`

```js
chain := (Continuable<A>, (A) => Continuable<B>) => Continuable<B>
```

`chain` takes a lambda function that is given the value and returns another
    continuables. The result will be a continuable given the value of the
    returned continuable.

In combination with `of` this makes `Continuable` a monad.

Alternatively this can be seen as sugar for `map` followed by `join`

```js
var body = getBody(req, res)

var dbWrite = chain(body, function (body) {
    if (!body) {
        return error(new Error("Need body"))
    }

    return db.write(body)
})

dbWrite(function (err, writeResult) {
    /* do stuff */
})
```

### `either(continuable, left, right?)`

```js
either := (source: Continuable<A>,
           left: (Error, cb: Callback<B>) => Continuable<B>,
          right?: (A) => Continuable<B>)
    => Continuable<B>
```

`either` takes a source continuable and a left and right function.
    It will either call the left function with the error in source
    or call the right function with the value in the source.

The returned continuable will contain the value returned from
    either left or right. Note that left and right return
    continuables themself.

```js
var fs = require("fs")
var either = require("continuable/either")

var fileStat = fs.stat.bind(null, "./package.json")
var fileExists = either(fileStat, function left(err) {
    return fs.writeFile.bind(null, "./package.json", "{}")
}) // note the right function is optional

var file = chain(fileExists, function () {
    return fs.readFile.bind(null, "./package.json")
})

file(function (err, body) {
    // There is no error because we create an empty file if the
    // stat failed. Body is either body or {}
})
```

The left function can either return a Continuable or call the
    passed callback directly. For example:

```js
var item = fs.stat.bind(null, "./file")
var maybeItem = either(item, function left(err, cb) {
    if (err.code === "ENOENT") {
        return cb(null, null)
    }

    cb(err)
})

maybeItem(function (err, item) {
    // if stat returns a file not found then item is null
    // if stat returns a random disk error then error!
    // if stat returns the stat then item!
})
```

Using the callback form is convenient and avoids the usage of
    return `return of(null)` and `return error(err)`

## `series([continuables])`

See [continuable-series][7]

Given an array of continuables return a continuable that invokes them in order,
or until one errors.

## `para([continuables])`

See [continuable-para][8]

Given an array on continuables return a continuable

## Installation

`npm install continuable`

## Contributors

 - Raynos

## MIT Licenced

  [1]: https://secure.travis-ci.org/Raynos/continuable.png
  [2]: https://travis-ci.org/Raynos/continuable
  [3]: https://david-dm.org/Raynos/continuable.png
  [4]: https://david-dm.org/Raynos/continuable
  [5]: https://ci.testling.com/Raynos/continuable.png
  [6]: https://ci.testling.com/Raynos/continuable
  [7]: http://ghub.io/continuable-series
  [8]: http://ghub.io/continuable-para
