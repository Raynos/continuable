# continuable

<!-- [![build status][1]][2] [![dependency status][3]][4]

[![browser support][5]][6] -->

Idea for callbacks as values

## Example

```js
var readFile = function (uri) {
    return function (cb) {
        fs.readFile(uri, cb)
    }
}

function map(lambda) { return function (source) {
    return function continuable(callback) {
        source(function (err, value) {
            callback(err, err ? null : lambda(value))
        })
    }
} }

var asString = map(String)
var asJSON = map(function (x) { return JSON.parse(x) })

asJSON(asString(readFile("/tmp/foo.json")))(function (err, value) {
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
        fs.readFile(uri, cb)
    }
}
```

The reason to have a continuable instead of passing a callback directly into
another value is that a continuable is a concrete value that can be returned.

Which means you can call useful functions on this value like `map` and `join`

### `map(lambda)(source)`

```js
map := (lambda:(A) => B) => (source:Continuable<A>) => Continuable<B>
```

map takes a transformation function and a continuable and returns a new
continuable. The new continuable is the value of the first continuable
transformed by your mapping function.

```js
var asString = map(String)
var asJSON = map(function (x) { return JSON.parse(x) })

var json = asJSON(asString(readFile("/tmp/foo.json")))
```

### `join(continuable)`

```js
join := (source:Continuable<Continuable<T>>) => Continuable<T>
```

join takes a continuable that contains another continuable and flattens it by
one layer. This is useful if you return another asynchronous operation from
`map`

```js
var asString = map(String)
var asJSON = map(function (x) { return JSON.parse(x) })

var json = asJSON(asString(readFile("/tmp/foo.json")))
var write = map(function (json) {
    return function continuable(cb) {
        fs.writeFile("/tmp/bar.json", JSON.stringify(json))
    }
})(json)
join(write)(function (err, writeResult) {
    /* stuff */
})
```

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
