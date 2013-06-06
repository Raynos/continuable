var slice = Array.prototype.slice

module.exports = to

function to(asyncFn) {
    return function () {
        var args = slice.call(arguments)
        var callback = args[args.length - 1]

        if (typeof callback === "function") {
            return asyncFn.apply(this, args)
        }

        return function continuable(callback) {
            var _args = args.slice()
            _args.push(callback)
            return asyncFn.apply(this, _args)
        }
    }
}
