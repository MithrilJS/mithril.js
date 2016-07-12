# request(options)

- [API](#api)
- [How it works](#how-it-works)
- [Typical usage](#typical-usage)
- [Dynamic URLs](#dynamic-urls)
- [Why JSON instead of HTML](#why-json-instead-of-html)
- [Why XMLHttpRequest instead of fetch](#why-xmlhttprequest-instead-of-fetch)
- [Why return streams](#why-return-streams)

---

### API

`stream = m.request(options)`

Argument               | Type                              | Required | Description
---------------------- | --------------------------------- | -------- | ---
`options.method`       | `String`                          | Yes      | The HTTP method to use. This value should be one of the following: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD` or `OPTIONS`.
`options.url`          | `String`                          | Yes      | The URL to send the request to. The URL may be either absolute or relative, and it may contain [interpolations](#dynamic-urls).
`options.data`         | `any`                             | No       | The data to be interpolated into the URL and serialized into the querystring (for GET requests) or body (for other types of requests).
`options.async`        | `Boolean`                         | No       | Whether the request should be asynchronous. Defaults to `true`.
`options.user`         | `String`                          | No       | A username for HTTP authorization. Defaults to `undefined`.
`options.password`     | `String`                          | No       | A password for HTTP authorization. Defaults to `undefined`. This option is provided for `XMLHttpRequest` compatibility, but you should avoid using it because it sends the password in plain text over the network.
`options.config`       | `xhr = Function(xhr)`             | No       | Exposes the underlying XMLHttpRequest object for low-level configuration. Defaults to the [identity function](https://en.wikipedia.org/wiki/Identity_function).
`options.type`         | `any = Function(any)`             | No       | A constructor to be applied to each object in the response. Defaults to the [identity function](https://en.wikipedia.org/wiki/Identity_function).
`options.serialize`    | `string = Function(any)`          | No       | A serialization method to be applied to `data`. Defaults to `JSON.stringify`.
`options.deserialize`  | `any = Function(string)`          | No       | A deserialization method to be applied to the response. Defaults to a small wrapper around `JSON.parse` that returns `null` for empty responses.
`options.extract`      | `string = Function(xhr, options)` | No       | A hook to specify how the XMLHttpRequest response should be read. Useful for reading response headers and cookies. Defaults to a function that returns `xhr.responseText`
`options.initialValue` | `any`                             | No       | A value to populate the returned stream before the request completes
`options.useBody`      | `Boolean`                         | No       | Force the use of the HTTP body section for `data` in `GET` requests when set to `true`, or the use of querystring for other HTTP methods when set to `false`. Defaults to `false` for `GET` requests and `true` for other methods.
**returns**            | `Stream`                          |          | A stream that resolves to the response data, after it has been piped through the `extract`, `deserialize` and `type` methods

[How to read signatures](signatures.md)

---

### How it works

The `m.request` utility is a thin wrapper around [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest), and allows making HTTP requests to remote servers in order to save and/or retrieve data from a database.

```javascript
m.request({
	method: "GET",
	url: "/api/v1/users",
}).run(function(users) {
	console.log(users)
})
```

Calls to `m.request` return a [stream](prop.md).

---

### Typical usage

Here's an illustrative example of a self-contained component that uses `m.request` to retrieve some data from a server.

```javascript
var SimpleExample = {
	oninit: function(vnode) {
		vnode.state.items = m.request({
			method: "GET",
			url: "/api/items",
			initialValue: []
		})
	},
	view: function(vnode) {
		return vnode.state.items().map(function(item) {
			return m("div", item.name)
		})
	}
}

m.route(document.body, "/", {
	"/": SimpleExample
})
```

Let's assume making a request to the server URL `/api/items` returns an array of objects in JSON format.

When `m.route` is called at the bottom, `SimpleExample` is initialized. `oninit` is called, which calls `m.request` and assigns its return value (a stream) to `vnode.state.items`. This stream contains the `initialValue` (i.e. an empty array), and this value can be retrieved by calling the stream as a function (i.e. `value = vnode.state.items()`). After the oninit method returns, the component is then rendered. Since `vnode.state.items()` returns an empty array, the component's `view` method also returns an empty array, so no DOM elements are created. When the request to the server completes, `m.request` parses the response data into a Javascript array of objects and sets the value of the stream to that array. Then, the component is rendered again. This time, `vnode.state.items()` returns a non-empty array, so the component's `view` method returns an array of vnodes, which in turn are rendered into `div` DOM elements.

#### Loading icons and error messages

Here's an expanded version of the example above that implements a loading indicator and an error message:

```javascript
var RobustExample = {
	oninit: function(vnode) {
		var req = m.request({
			method: "GET",
			url: "/api/items",
		})
		vnode.state.items = req.catch(function() {
			return []
		})
		vnode.state.error = req.error.run(this.errorView)
	},
	view: function(vnode) {
		return [
			vnode.state.items() ? vnode.state.items().map(function(item) {
				return m("div", item.name)
			}) : m(".loading-icon"),
			vnode.state.error(),
		]
	},
	errorView: function(e) {
		return e ? m(".error", "An error occurred") : null
	}
}

m.route(document.body, "/", {
	"/": RobustExample
})
```

When this component is initialized, `m.request` is called and its return value is assigned to `req`. Unlike the previous example, here there's no `initialValue`, so the `req` stream is in a pending state, and therefore has a value of `undefined`. `req.error` is the error stream for the request. Since `req` is pending, the `req.error` stream also remain in a pending state, and likewise, `vnode.state.error` stays pending and does not call `this.errorView`.

Then the component renders. Both `vnode.state.items()` and `vnode.state.error()` return `undefined`, so the component returns `[m(".loading-icon"), undefined]`, which in turn creates a loading icon element in the DOM.

When the request to the server completes, `req` is populated with the response data, which is propagated to the `vnode.state.items` dependent stream. (Note that the function in `catch` is not called if there's no error). After the request completes, the component is re-rendered. `req.error` is set to an active state (but it still has a value of `undefined`), and `vnode.state.error()` is then set to `null`. The `view` function returns a list of vnodes containing item names, and therefore the loading icon is replaced by a list of `div` elements are created in the DOM.

If the request to the server fails, `catch` is called and `vnode.state.items()` is set to an empty array. Also, `req.error` is populated with the error, and `vnode.state.error` is populated with the vnode tree returned by `errorView`. Therefore, `view` returns `[[], m(".error", "An error occurred")]`, which replaces the loading icon with the error message in the DOM.

To clear the error message, simply set the value of the `vnode.state.error` stream to `undefined`.

---

### Dynamic URLs

Request URLs may contain interpolations:

```javascript
m.request({
	method: "GET",
	url: "/api/v1/users/:id",
	data: {id: 123},
}).run(function(user) {
	console.log(user.id) // logs 123
})
```

In the code above, `:id` is populated with the data from the `{id: 123}` object, and the request becomes `GET /api/v1/users/123`.

Interpolations are ignored if no matching data exists in the `data` property.

```javascript
m.request({
	method: "GET",
	url: "/api/v1/users/foo:bar",
	data: {id: 123},
})
```

In the code above, the request becomes `GET /api/v1/users/foo:bar`

---

### Why JSON instead of HTML

Many server-side frameworks provide a view engine that interpolates database data into a template before serving HTML (on page load or via AJAX) and then employ jQuery to handle user interactions.

By contrast, Mithril is framework designed for thick client applications, which typically download templates and data separately and combine them in the browser via Javascript. Doing the templating heavy-lifting in the browser can bring benefits like reducing operational costs by freeing server resources. Separating templates from data also allow template code to be cached more effectively and enables better code reusability across different types of clients (e.g. desktop, mobile). Another benefit is that Mithril enables a [retained mode](https://en.wikipedia.org/wiki/Retained_mode) UI development paradigm, which greatly simplifies development and maintenance of complex user interactions.

By default, `m.request` expects response data to be in JSON format. In a typical Mithril application, that JSON data is then usually consumed by a view.

You should avoid trying to render server-generated dynamic HTML with Mithril. If you have an existing application that does use a server-side templating system, and you wish to re-architecture it, first decide whether the effort is feasible at all to begin with. Migrating from a thick server architecture to a thick client architecture is typically a somewhat large effort, and involves refactoring logic out of templates into logical data services (and the testing that goes with it).

Data services may be organized in many different ways depending on the nature of the application. [RESTful](https://en.wikipedia.org/wiki/Representational_state_transfer) architectures are popular with API providers, and [service oriented architectures](https://en.wikipedia.org/wiki/Service-oriented_architecture) are often required where there are lots of highly transactional workflows.

---

### Why XMLHttpRequest instead of fetch

[`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) is a newer Web API for fetching resources from servers, similar to `XMLHttpRequest`.

Mithril's `m.request` uses `XMLHttpRequest` instead of `fetch()` for a number of reasons:

- `fetch` is not fully standardized yet, and may be subject to specification changes.
- `XMLHttpRequest` calls can be aborted before they resolve (e.g. to avoid race conditions in for instant search UIs).
- `XMLHttpRequest` provides hooks for progress listeners for long running requests (e.g. file uploads).
- `XMLHttpRequest` is supported by all browsers, whereas `fetch()` is not supported by Internet Explorer and Safari.

Currently, due to lack of browser support, `fetch()` typically requires a [polyfill](https://github.com/github/fetch), which is over 11kb uncompressed - nearly three times larger than Mithril's `m.request`.

Despite being much smaller, `m.request` supports many important and not-so-trivial-to-implement features like [URL interpolation](#dynamic-urls), querystring serialization and [JSON-P requests](jsonp.md). The `fetch` polyfill does not support any of those.

The `fetch()` API does have a few technical advantages over `XMLHttpRequest` in a few uncommon cases:

- it provides a streaming API (in the "video streaming" sense, not in the reactive programming sense), which enables better latency and memory consumption for very large responses (at the cost of code complexity).
- it integrates to the [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), which provides an extra layer of control over how and when network requests happen. This API also allows access to push notifications and background synchronization features.

In typical scenarios, streaming won't provide noticeable performance benefits because it's generally not advisable to download megabytes of data to begin with. Also, the memory gains from repeatedly reusing small buffers may be offset or nullified if they result in excessive browser repaints. For those reasons, choosing `fetch()` streaming instead of `m.request` is only recommended for extremely resource intensive applications.

---

### Why return streams

Normally, XMLHttpRequest makes HTTP requests to a server *asynchronously*. This means that it cannot return the response data via a `return` statement, since the `return` statement runs *synchronously* long before the response data is actually available. Therefore, any library that makes requests must expose the response data using some other mechanism.

Some older libraries do so via callback functions, and newer ones (including the `fetch` API) return [promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise). `m.request` returns *reactive streams*.

Callback functions are the most basic mechanism for asynchronous flow control. They are not *composable* because they require the callback function to be passed at call time, and error handling mechanisms must similarly be declared upfront.

However, it's desirable to allow the callback function to be defined (and broken into subroutines) in different places than the call site, in order to achieve better separation of concerns. In addition, it's also desirable to wrap an abstraction around errors so that they can be thrown freely and handled safely from a single place, rather than requiring `try/catch` blocks in every callback function, or duplicating error handling code. The problems that arise from callbacks' lack of composability are [infamous enough](http://callbackhell.com/) to earn nicknames such as "callback hell" and "pyramids of doom".

The Promise API is designed to address the shortcomings of callbacks. They are *composable*, which allows code to be refactored much more elegantly than using callbacks.

In the example below, the code is written in a naive style. It's highly procedural and does many different things: First it requests a project with id `123`, then requests a user whose id is the value of `project.ownerID`, then proceeds to do something useful with the user. If there's an error, it is logged to console.

```javascript
// AVOID
function doStuff() { /*...*/ }

function json(response) {
	return response.json()
}
function doStuffWithProjectOwner(projectID) {
	fetch("/api/v1/projects/" + projectID, {method: "GET"}).then(json).then(function(project) {
		fetch("/api/v1/users/" + project.ownerID, {method: "GET"}).then(json).then(function(user) {
			doStuff(user)
		})
		.catch(function(e) {
			console.log(e)
		})
	})
	.catch(function(e) {
		console.log(e)
	})
}
doStuffWithProjectOwner(123)
```

Here's a refactored version that defines composable, easy-to-reuse units, and that takes advantage of the error propagation feature of Promises to avoid repetitive error handling code:

```javascript
// PREFER
function findProject(id) {
	return fetch("/api/v1/projects/" + id, {method: "GET"}).then(json)
}
function findUser(id) {
	return fetch("/api/v1/users/" + id, {method: "GET"}).then(json)
}
function getProjectOwnerID(project) {
	return project.ownerID
}

function doStuffWithProjectOwner(projectID) {
	return findProject(projectID)
		.then(getProjectOwnerID)
		.then(findUser)
		.then(doStuff)
		.catch(function(e) {
			console.log(e)
		})
}

doStuffWithProjectOwner(123)
```

The code above separates each request into a `findProject` and `findUser` functions which can be used in more use cases than only finding the user object that owns a project.

You can think of `.then` callbacks as pipes: the `getProjectOwnerID` receives the response of the `findProject` request as an input, and return an id, which is then passed as the input to `findUser`.

The feature of Promises that let us simplify error handling is that promises *absorb* other promises: in the `.then(findUser)` line, `findUser` returns a promise. Instead of a promise being passed as an input to the next callback, the promise chain waits for the `findUser` promise to complete, and only then continues down the chain of callbacks with the resolved value. If `findUser` throws an error, the `.catch` callback handles it, in addition to handling erros from `findProject` (and from `getProjectOwnerID`, for that matter).

Promises provide the machinery that facilitates writing small straightforward functions and composing them in flexible ways.

Mithril streams have many similarities to promises. The example above could be written like this:

```javascript
// PREFER
function findProject(id) {
	return m.request({method: "GET", url: "/api/v1/projects/:id", data: {id: id}})
}
function findUser(id) {
	return m.request({method: "GET", url: "/api/v1/users/:id", data: {id: id}})
}
function getProjectOwnerID(project) {
	return project.ownerID
}

function doStuffWithProjectOwner(projectID) {
	return findProject(projectID)
		.run(getProjectOwnerID)
		.run(findUser)
		.run(doStuff)
		.catch(function(e) {
			console.log(e)
		})
}

doStuffWithProjectOwner(123)
```

Aside from the API signature difference between `fetch` and `m.request`, the only change required to achieve the same functionality was to replace all instances of `.then` with `.run`.

However, stream have some additional interesting properties. Let's suppose project objects have a `team` property that contains a list of user objects, and we wanted to display a list of designers and a list of developers in a project:

```javascript
function getProjectTeam(project) {
	return project.team
}
function getTeamUsersByType(team, type) {
	return team.filter(function(user) {
		return user.type === type
	})
}
var project = findProject(123)
var team = project.run(getProjectTeam)
var designers = team.run(function(team) {
	return getTeamUsersByType(team, "designer")
})
var developers = team.run(function(team) {
	return getTeamUsersByType(team, "developer")
})
```

Now let's suppose that the team changed for the project and we need to fetch the `project` object from the server again. We would logically also want to update `designers` and `developers` so that the UI displays the correct users in their respective lists.

Fortunately, `project` is a stream, and `team`, `designers` and `developers` are streams derived from `project`. So to update the state of all these streams, we only need to do this:

```javascript
findProject(123).run(project)
```

Doing so updates all the streams, and therefore there's no need to place the filtering code in the view, where the filtering code would recompute the same thing on every render.

Returning streams from `m.request` streamlines use cases where efficient reactivity is desired, without losing the composable semantics of promises.
