# continuable

<!-- [![build status][1]][2] [![dependency status][3]][4]

[![browser support][5]][6] -->

Idea for callbacks as values

## Example

```js

var readdir = function (uri) {
    return function (cb) {
        fs.readdir(uri, cb)
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

asJSON(asString(readdir("/tmp/foo.json")))(function (err, value) {
    /* do stuff with JSON */
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
