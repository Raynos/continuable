# Continuables

## General

A continuable represents an asynchronous operation that returns
    a value or an error.

## Terminology

1. "value" is any legal JavaScript value.
2. "error" is a value that represents an error. It must not
    be falsey.
3. "callback" is a function which takes two arguments, an
    error and a value
4. "continuable" is a function which takes a callback as an
    argument
5. "resolution" of a continuable is either a value or an error,
    never both.

## Requirements

### The `continuable` function.

A continuable must be a function. It accepts a single argument:

```js
continuable(function callback(err, value) { })
```

1. callback is a required argument and it must be a function
    1. The continuable must produce a resolution
        1. If the resolution is a value then the callback must
            be called with `null` as the "error" and the value.
        2. If the resolution is an error then the callback must
            be called with the error as the "error"

## Notes

That's it. Dead simple.

```js
continuable(function callback(err, value) {
    // the continuable has produced a resolution

    if (err) {
        // the continuable resoluted to an error.
    } else {
        // the continuable resoluted to a value.
    }
})
```
