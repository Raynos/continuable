var slice = Array.prototype.slice

/* Given a function that takes n arguments and returns a continuable
    return a function that takes n arguments and maybe a n+1th argument
    which is a callback or takes n arguments and returns a continuable

This basically means that you can do this:

```js
var readFile = maybeCallback(function (uri) {
    return function (cb) { fs.readFile(uri, cb) }
})

readFile("./foo")(cb)
readFile("./foo", cb)
```

Be warned this breaks if the last argument is a function

*/
module.exports = maybeCallback

//  maybeCallback := (fn: (Any, ...) => Continuable<T>) =>
//      (Any, ..., Callback<T>?) => Continuable<T>
function maybeCallback(fn) {
    return function maybeContinuable() {
        var args = slice.call(arguments)
        var callback = args[args.length - 1]

        if (typeof callback === "function") {
            args.pop()
        }

        var continuable = fn.apply(null, args)

        if (typeof callback === "function") {
            continuable(callback)
        } else {
            return continuable
        }
    }
}
