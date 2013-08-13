type Callback<T> := (err: Error, value: T) => void
type Continuable<T> := (Callback<T>) => void

continuable/both := (Continuable<A>) => Continuable<[Error, A]>

continuable/chain := (Continuable<A>, lambda: (A) => Continuable<B>)
    => Continuable<B>

continuable/either := (source: Continuable<A>,
                       left: (Error, cb? Callback<B>) => Continuable<B> | void,
                       right?: (A) => Continuable<B>)
    => Continuable<B>

continuable/error := (Error) => Continuable<void>

continuable/join := (Continuable<Continuable<T>>) => Continuable<T>

continuable/map-async := (Continuable<A>, lambda: (A, Callback<B>))
    => Continuable<B>

continuable/map := (Continuable<A>, (A) => B) => Continuable<B>

continuable/maybe-callback := (fn: (Any, ...rest) => Continuable<T>)
    => (Any, ...rest, Callback<T>?) => Continuable<T>

continuable/of := (T) => Continuable<T>

continuable/to := (fn: (Any, ...rest, Callback<T>))
    => (Any, ...rest, Callback<T>?) => Continuable<T>
