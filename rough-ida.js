// The well-known callback pattern
fs.mkdir("some-path", function(err) {
    fs.open("some-path/file", "w", function(err, fd) {
        var buffer = new Buffer("hello world")
        fs.write(fd, buffer, 0, buffer.length, null, function(err, bytes) {
            console.log("Wrote " + bytes + " bytes")
        })
    })
})

// What if we changed all the APIS to return a function that takes the callback
// It's the exact same as node core except we have a return value of a callback
function mkdir(uri) {
    return function (cb) {
        fs.mkdir(uri, cb)
    }
}

function open(uri, flags) {
    return function (cb) {
        fs.open(uri, flags, cb)
    }
}

function write(fd, buffer, offset, length, position) {
    return function (cb) {
        fs.write(fd, buffer, offset, length, position, cb)
    }
}

// Nothing is stopping you from doing the same thing with partial functions.
// Slightly different syntax, but the same pattern. Nothing major
// new to learn here.
mkdir("some-path")(function (err) {
    open("some-path/file", "w")(function (err, fd) {
        var buffer = new Buffer("hello world")
        write(fd, buffer, 0, buffer.length, null)(function (err, bytes) {
            console.log("Wrote " + bytes + " bytes")
        })
    })
})

// Want pipeable sugar. Sure that's easy.
// We introduce the notion of a duplex callback. It's a callback that takes
// a callback and returns a callback!
function pipeable(future) {
    future.pipe = function (duplex) {
        return pipeable(duplex(future))
    }
    return future
}

pipeable(mkdir("some-path"))
    // Of course we don't have the file, that would be magic!
    // Instead we have a callback that we can call. So here lets
    // Return a callback invoke the file callback, then open the fd and
    // pass it to the callback
    .pipe(function (file) {
        return function future(callback) {
            file(function (err) {
                open("some-path/file", "w")(callback)
            })
        }
    })
    .pipe(function (fd) {
        return function future(callback) {
            fd(function (err, fd) {
                var buffer = new Buffer("hello world")
                write(fd, buffer, 0, buffer.length, null)(callback)
            })
        }
    })
    (function (err, bytes) {
        console.log("Wrote " + bytes + " bytes")
    })

// Wow that's noisy! But it's re-occuring everywhere. Can we write a function
// for this?
function map(lambda) {
    return function (source) {
        return function future(callback) {
            source(function (err, value) {
                lambda(err, value)(callback)
            })
        }
    }
}

pipeable(mkdir("some-path"))
    .pipe(map(function (err) {
        return open("some-path/file", "w")
    }))
    .pipe(map(function (err, fd) {
        var buffer = new Buffer("hello world")
        return write(fd, buffer, 0, buffer.length, null)
    }))
    // this is still a bit weird!
    (function (err, bytes) {
        console.log("Wrote " + bytes + " bytes")
    })

// let's update pipeable to support half duplex callbacks. That is
// a callback that takes a callback and doesn't return one
function pipeable(future) {
    if (!future) return
    future.pipe = function (duplex) {
        return pipeable(duplex(future))
    }
    return future
}

pipeable(mkdir("some-path"))
    .pipe(map(function (err) {
        return open("some-path/file", "w")
    }))
    .pipe(map(function (err, fd) {
        var buffer = new Buffer("hello world")
        return write(fd, buffer, 0, buffer.length, null)
    }))
    .pipe(function (req) {
        // not quite optimum!!
        req(function (err, bytes) {
            console.log("Wrote " + bytes + " bytes")
        })
    })

// Let's create a little sink function for this
function sink(callback) {
    return function future(source) {
        source(callback)
    }
}

pipeable(mkdir("some-path"))
    .pipe(map(function (err) {
        return open("some-path/file", "w")
    }))
    .pipe(map(function (err, fd) {
        var buffer = new Buffer("hello world")
        return write(fd, buffer, 0, buffer.length, null)
    }))
    .pipe(sink(function (err, bytes) {
        console.log("Wrote " + bytes + " bytes")
    })

// BUT WHAT ABOUT ERROR HANDLING >:(
// Actually that's not hard either. Just have map pass on the
// err to the callback instead of to the lambda.
function map(lambda) {
    return function (source) {
        return function future(callback) {
            source(function (err, value) {
                if (err) {
                    return callback(err)
                }

                lambda(value)(callback)
            })
        }
    }
}

// Now just drop the errors everywhere. They will bubble up to
// the last item in the chain by default, which is the sink
pipeable(mkdir("some-path"))
    .pipe(map(function () {
        return open("some-path/file", "w")
    }))
    .pipe(map(function (fd) {
        var buffer = new Buffer("hello world")
        return write(fd, buffer, 0, buffer.length, null)
    }))
    .pipe(sink(function (err, bytes) {
        console.log("Wrote " + bytes + " bytes")
    })

// Now the most important part of this is that this is STILL callbacks
// Our fancy pants chaining sugar & higher order functions are 100%
// compatible with everything else in node core & npm.
function readAndWriteFile(folder, file, callback) {
    pipeable(mkdir(folder))
        .pipe(map(function () {
            return open(path.join(folder, file), "w")
        }))
        .pipe(map(function (fd) {
            var buffer = new Buffer("hello world")
            return write(fd, buffer, 0, buffer.length, null)
        }))
        .pipe(sink(callback)
}

// Or maybe let's get rid of that pipeable chaining sugar.
function readAndWriteFile(folder, file, callback) {
    var dir = mkdir(folder)
    var fd = map(function (directory) {
        return open(path.join(folder, file), "w")
    })(dir)
    map(function (fd) {
        var buffer = new Buffer("hello world")
        write(fd, buffer, 0, buffer.length, null)(callback)
    })(fd)
}
