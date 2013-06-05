
module.exports = function (fun) {
  return function () {
    if('function' === typeof arguments[arguments.length - 1])
      return fun.apply(this, arguments)
    var args = [].slice.call(arguments)
    return function (callback) {
      console.error('CONT')
      args.push(callback)
      return fun.apply(this, args)
    }
  }
}
