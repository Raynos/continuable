# Continuables

## General

A continuable represents an asynchronous operation that returns
    a value or an error.

## Terminology

1. "value" is any legal JavaScript value.
2. "error" is a value that represents an error. It must not
    be falsey.
3. "continuation" is a function which takes two arguments, an
    error and a value
4. "continuable" is a function which takes a continuation as an
    argument
5. "resolution" are the results that will be passed to a given
    continuation of a continuable. The resolution is either an error
    or a value, not both.
6. "async function" is a function which does an asynchronous
    operation. An async function will return a continuable.

## Requirements

### The `Continuable` datatype.

A `Continuable` must be a function. It accepts a single argument:

```js
continuable(function continuation(err, value) { })
```

1. continuation is a required argument and it must be a function
    1. The continuable must produce a single resolution for this
    continuation. This resolution may be synchronous or asynchronous
        1. If the resolution is a value then the continuation must
        be called with `null` as the "error" and the value.
        2. If the resolution is an error then the continuation must
        be called with the error as the "error"

## Notes

That's it. Dead simple.

```js
continuable(function continuation(err, value) {
    // the continuable has produced a resolution

    if (err) {
        // the continuable resoluted to an error.
    } else {
        // the continuable resoluted to a value.
    }
})
```
