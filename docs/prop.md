# prop()

- [API](#api)
- [Static members](#static-members)
	- [prop.combine](#prop-combine)
	- [prop.reject](#prop-reject)
- [Instance members](#static-members)
	- [stream.map](#stream-map)
	- [stream.end](#stream-end)
	- [stream.error](#stream-error)
	- [stream.catch](#stream-catch)
	- [stream.of](#stream-of)
	- [stream.ap](#stream-ap)
- [Basic usage](#basic-usage)
- [Streams vs promises](#streams-vs-promises)
- [Chaining streams](#chaining-streams)
- [Combining streams](#combining-streams)
- [Absorbing streams](#absorbing-streams)
- [Stream states](#stream-states)
- [Handling errors](#handling-errors)

---

### API

Creates a stream

`stream = m.prop(value)`

Argument    | Type                 | Required | Description
----------- | -------------------- | -------- | ---
`value`     | `any`                | No       | If this argument is present, the value of the prop is set to it
**returns** | `Stream`             |          | Returns a stream

[How to read signatures](signatures.md)

#### Static members

##### prop.combine

Creates a computed stream that reactively updates if any of its upstreams are updated. See [combining streams](#combining-streams)

`stream = prop.combine(combiner, streams)`

Argument    | Type                        | Required | Description
----------- | --------------------------- | -------- | ---
`combiner`  | `(Stream..., Array) -> any` | Yes      | See [combiner](#combiner) argument
`streams`   | `Array<Stream>`             | Yes      | A list of streams to be combined
**returns** | `Stream`                    |          | Returns a stream

[How to read signatures](signatures.md)

###### combiner

Specifies how the value of a computed stream is generated. See [combining streams](#combining-streams)

`any = combiner(streams..., changed)`

Argument     | Type                 | Required | Description
------------ | -------------------- | -------- | ---
`streams...` | splat of `Stream`s   | No       | Splat of zero or more streams that correspond to the streams passed as the second argument to [`prop.combine`](#prop-combine.md)
`changed`    | `Array<Stream>`      | Yes      | List of streams that were affected by an update
**returns**  | `any`                |          | Returns a computed value

[How to read signatures](signatures.md)

##### prop.reject

Creates a stream in a error state. See [stream states](#stream-states)

`stream = m.prop.reject(value)`

Argument     | Type                 | Required | Description
------------ | -------------------- | -------- | ---
`value`      | `any`                | Yes      | The error value
**returns**  | `Stream`             |          | Returns a stream in an error state

[How to read signatures](signatures.md)

#### Instance members

##### stream.map

Creates a dependent stream whose value is set to the result of the callback function. See [chaining streams](#chaining-streams)

This method exists to conform to [Fantasy Land's Applicative specification](https://github.com/fantasyland/fantasy-land)

`dependentStream = m.prop().map(callback)`

Argument     | Type                 | Required | Description
------------ | -------------------- | -------- | ---
`callback`   | `any -> any`         | Yes      | The error value
**returns**  | `Stream`             |          | Returns a stream in an error state

[How to read signatures](signatures.md)

##### stream.end

A co-dependent stream that unregisters dependent streams when set to true. See [ended state](#ended-state).

`endStream = m.prop().end`

##### stream.error

A co-dependent stream that is set if the stream is in an errored state. See [handling errors](#handling-errors).

`errorStream = m.prop().error`

##### stream.catch

Returns an active stream whose value is equal to the return value of `catch`'s callback.

`stream = m.prop().catch(callback)`

Argument     | Type                 | Required | Description
------------ | -------------------- | -------- | ---
`callback`   | `any -> any`         | Yes      | A callback whose return value becomes the value of the stream returned by `catch`
**returns**  | `Stream`             |          | Returns a stream

[How to read signatures](signatures.md)

##### stream.of

This method is functionally identical to `m.prop`. It exists to conform to [Fantasy Land's Applicative specification](https://github.com/fantasyland/fantasy-land)

`stream = m.prop().of(value)`

Argument    | Type                 | Required | Description
----------- | -------------------- | -------- | ---
`value`     | `any`                | No       | If this argument is present, the value of the prop is set to it
**returns** | `Stream`             |          | Returns a stream

##### stream.ap

The name of this method stands for `apply`. If a stream has a function as its value, calling `ap` will call the function with the value of the input stream as its argument, and it will return another stream whose value is the result of the function call. This method exists to conform to [Fantasy Land's Applicative specification](https://github.com/fantasyland/fantasy-land)

`errorStream = m.prop().ap(value)`

Argument    | Type                 | Required | Description
----------- | -------------------- | -------- | ---
`value`     | `Stream`             | Yes      | If this argument is present, the value of the prop is set to it
**returns** | `Stream`             |          | Returns a stream

---

### Basic usage

`m.prop()` returns a stream. At its most basic level, a stream works similar to a variable or a getter-setter property: it can hold state, which can be modified.

```javascript
var username = m.prop("John")
console.log(username()) // logs "John"

username("John Doe")
console.log(username()) // logs "John Doe"
```

The main difference is that a stream is a function, and therefore can be composed into higher order functions.

```javascript
var users = m.prop()

// request users from a server using the fetch API
fetch("/api/users")
	.then(function(response) {return response.json()})
	.then(users)
```

In the example above, the `users` stream is populated with the response data when the request resolves. It can also be populated from other higher order functions, such as [`m.withAttr`](withAttr.md)

```javascript
// a stream
var user = m.prop("")

// a bi-directional binding to the stream
m("input", {
	oninput: m.withAttr("value", user),
	value: user()
})
```

In the example above, when the user types in the input, the `user` stream is updated to the value of the input field.

---

### Streams vs promiss

Mithril streams have many similarities to [ES6 promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise):

- streams can be [chained](#chaining-streams) (analogous to `promise.then(callback)`)
- streams can be [absorbed by other streams](#absorbing-streams) (analogous to `Promise.resolve(promise)`)
- streams have [composable error handling semantics](#handling-errors) (analogous to `promise.catch`)

These semantic similarities are designed to make it easy to migrate from promise-based asynchronous code to stream-based code.

For example, here's some sample promise-based code:

```javascript
fetch("/api/users", {method: "GET"}).then(function(response) {return response.json()})
	.then(function(users) {
		if (users.length === 0) return Promise.reject("No users found")
	})
	.catch(function(e) {
		console.log(e)
	})
```

And here's equivalent stream-based code:

```javascript
m.request({url: "/api/users", method: "GET"})
	.map(function(users) {
		if (users.length === 0) return m.prop.reject("No users found")
	})
	.catch(function(e) {
		console.log(e)
	})
```

Aside from the syntax differences between the [`fetch API`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) and [`m.request()`](request.md) in the first line of each snippet above, the only other syntax difference is that streams use the method `map` to chain, instead of `then`.

#### Differences

In most use cases, streams can be used as replacements for promises without much effort. However, because streams are more powerful, they have some important differences.

Promises are *immutable*; in other words, a promise can only ever resolve to one value. Streams, on the other hand, are *reactive*: a stream's value can be changed freely, and it automatically updates the values of other streams that depend on it.

Promises are required by spec to resolve asynchronously, even if the resolution value is known in advance (e.g. `Promise.resolve("hello")`). Mithril streams are guaranteed to update synchronously and atomically.

Mithril streams are also more oriented towards functional programming. In addition to being usable for composing higher order functions, the stream API comply with [Fantasy Land's Applicative specification](https://github.com/fantasyland/fantasy-land), which enables interoperability with functional libraries like Ramda and Sanctuary.

#### Interoperability with promises

An increasing number of third party APIs return promises, and it's often desirable to transfer their resolved values to Mithril streams. This can be accomplished by simply chaining the stream itself to the promise chain:

```javascript
var promise = Promise.resolve(123)
var stream = m.prop()

// set the stream to listen to the promise resolution event
promise.then(stream)
```

To track promise rejections as well as resolutions, pass the error stream as a rejection callback:

```javascript
promise.then(stream, stream.error)
```

To use a stream value to resolve a promise, simply pass the stream value to it:

```javascript
var stream = m.prop("hello")
var promise = Promise.resolve(stream())
// promise resolves to "hello"
```

---

### Chaining streams

Streams can be chained using the `map` method. A chained stream is also known as a *dependent stream*.

```javascript
// parent stream
var stream = m.prop(1)

// dependent stream
var doubled = stream.map(function(value) {
	return value * 2
})

console.log(doubled()) // logs 2
```

Dependent streams are *reactive*: their values are updated any time the value of their parent stream is updated. This happens regardless of whether the dependent stream was created before or after the value of the parent stream was set.

---

### Combining streams

Streams can depend on more than one parent stream. These kinds of streams can be created via `m.prop.combine()`

```javascript
var a = m.prop(5)
var b = m.prop(7)

var added = m.prop.combine(function(a, b) {
	return a() + b()
}, [a, b])

console.log(added()) // logs 12
```

A stream can depend on any number of streams and it's guaranteed to update atomically. For example, if a stream A has two dependent streams B and C, and a fourth stream D is dependent on both B and C, the stream D will only update once if the value of A changes. This guarantees that the callback for stream D is never called with unstable values such as receiving the new value of C but the old value of D. This also bring performance benefits of not recomputing downstreams unnecessarily.

---

### Absorbing streams

It's not possible to set the value of a stream to another streams. Doing so will cause wrapper stream to *absorb* the inner stream and adopt its value and [state](#stream-states):

```javascript
var stream = m.prop(m.prop(1))

console.log(stream()) // logs 1
```

```javascript
var pending = m.prop(m.prop())

console.log(stream()) // logs undefined because the stream is pending
```

This behavior also applies when mapping and combining streams:

```javascript
var mapped = m.prop(1).map(function(value) {
	return m.prop(value * 2)
})

console.log(mapped()) // logs 2
```

```javascript
var stream = m.prop(1)
var combined = m.prop.combine(function(stream) {
	return m.prop(stream() * 2)
}, [stream])

console.log(combined()) // logs 2
```

---

### Stream states

At any given time, a stream can be in one of four states: *pending*, *active*, *errored* and *ended*.

#### Pending state

Pending streams can be created by calling `m.prop()` with no parameters.

```javascript
var pending = m.prop()
```

If a stream is dependent on more than one stream, any of its parent streams is in a pending state, the dependent streams is also in a pending state, and does not update its value.

```javascript
var a = m.prop(5)
var b = m.prop() // pending stream

var added = m.prop.combine(function(a, b) {
	return a() + b()
}, [a, b])

console.log(added()) // logs undefined
```

In the example above, `added` is a pending stream, because its parent `b` is also pending.

This also applies to dependent streams created via `stream.map`:

```javascript
var stream = m.prop()
var doubled = stream.map(function(value) {return value * 2})

console.log(doubled()) // logs undefined because `doubled` is pending
```

#### Active state

When a stream receives a value, it becomes active (unless the stream is ended).

```javascript
var stream1 = m.prop("hello") // stream1 is active

var stream2 = m.prop() // stream2 starts off pending
stream2("world") // then becomes active
```

A dependent stream with multiple parents becomes active if all of its parents are active.

In the example above, setting `b(7)` would cause `b` to become active, and therefore `added` would also become active, and be updated to have the value `12`

#### Errored state

Errored streams can be created by calling `m.prop.reject()`

```javascript
var erroredStream = m.prop.reject(new Error("Server is offline"))
```

A stream can also become errored if it's a dependent stream and its [`combiner`](#combiner) or [`map`](#stream-map) function throws an error

```javascript
var errored1 = m.prop(1).map(function(value) {
	if (typeof value !== "string") {
		throw new Error("Not a string")
	}
	return value
})
// errored1 is in an errored state
```

```javascript
var stream = m.prop(1)
var errored2 = m.prop.combine(function(stream) {
	if (typeof stream() !== "string") {
		throw new Error("Not a string")
	}
	return value
}, [stream])
// errored2 is in an errored state
```

When a stream is in a errored state, its value is set to `undefined` and its `error` method is set to the error value

```javascript
var errored = m.prop.reject("Server is offline")

console.log(errored()) // logs undefined
console.log(errored.error()) // logs "Server is offline"
```

#### Ended state

A stream can stop affecting its dependent streams by calling `stream.end(true)`. This effectively removes the connection between a stream and its dependent streams.

```javascript
var stream = m.prop()
var doubled = stream.map(function(value) {return value * 2})

stream.end(true) // set to ended state

stream(5)

console.log(doubled())
// logs undefined because `doubled` no longer depends on `stream`
```

Ended streams still have state container semantics, i.e. you can still use them as getter-setters, even after they are ended.

```javascript
var stream = m.prop(1)
stream.end(true) // set to ended state

console.log(stream(1)) // logs 1

stream(2)
console.log(stream()) // logs 2
```

Ending a stream can be useful in cases where a stream has a limited lifetime (for example, reacting to `mousemove` events only while a DOM element is being dragged, but not after it's been dropped).

---

### Handling errors

When a stream is in a errored state, its value is set to `undefined`, and its `error` method returns the error value.

```javascript
var erroredStream = m.prop.reject("Server is offline")

console.log(erroredStream()) // logs undefined
console.log(erroredStream.error()) // logs "Server is offline"
```

Errors can be set in various ways:

```javascript
// via m.prop.reject
var errored1 = m.prop.reject("Server is offline")
console.log(errored1.error()) // logs "Server is offline"

// via `.error`
var errored2 = m.prop("hello")
errored.error("Server is offline")
console.log(errored2.error()) // logs "Server is offline"

// by throwing an error in a chain
var errored3 = m.prop("hello").map(function() {
	throw "Server is offline"
})
console.log(errored3.error()) // logs "Server is offline"

var errored4 = m.prop.combine(function() {
	throw "Server is offline"
}, [m.prop("hello")])
console.log(errored4.error()) // logs "Server is offline"

//by returning an errored stream in a chain
var errored5 = m.prop("hello").map(function() {
	return m.prop.reject("Server is offline")
})
console.log(errored5.error()) // logs "Server is offline"

var errored6 = m.prop.combine(function() {
	return m.prop.reject("Server is offline")
}, [m.prop("hello")])
console.log(errored6.error()) // logs "Server is offline"
```


Errors in stream chains propagate: if a stream is in an errored state, all of its dependent streams will have the same errored state, unless the error is handled via a `catch` method.

```javascript
var dependentStream = erroredStream.map(function(value) {return value})
console.log(dependentStream()) // logs undefined
console.log(dependentStream.error()) // logs "Server is offline"

var recoveredStream = dependentStream.catch(function() {return "hello"})
console.log(recoveredStream()) // logs "hello"
console.log(recoveredStream.error()) // logs undefined
```

Like in ES6 promises, the `catch` callback is only called if there is an error. If there isn't an error, it adopts the same value as its parent stream:

```javascript
erroredStream("hi")

console.log(dependentStream()) // logs "hi"
console.log(dependentStream.error()) // logs undefined

console.log(recoveredStream()) // logs "hi"
console.log(recoveredStream.error()) // logs undefined
```


