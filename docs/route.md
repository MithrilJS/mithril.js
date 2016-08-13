# route(root, defaultRoute, routes)

- [API](#api)
- [Static members](#static-members)
	- [route.set](#route-set)
	- [route.get](#route-get)
	- [route.prefix](#route-prefix)
	- [route.link](#route-link)
- [How it works](#how-it-works)
- [Typical usage](#typical-usage)
- [Navigating to different routes](#navigating-to-different-routes)
- [Routing parameters](#routing-parameters)
- [Changing router prefix](#changing-router-prefix)
- [Advanced component resolution](#advanced-component-resolution)
- [Wrapping a layout component](#wrapping-a-layout-component)
- [Authentication](#authentication)
- [Lazy loading](#lazy-loading)

---

### API

`m.route(root, defaultRoute, routes)`

Argument               | Type                                     | Required | Description
---------------------- | ---------------------------------------- | -------- | ---
`root`                 | `Element`                                | Yes      | A DOM element that will be the parent node to the subtree
`defaultRoute`         | `String`                                 | Yes      | The route to redirect to if the current URL does not match a route
`routes`               | `Object<String,Component|RouteResolver>` | Yes      | An object whose keys are route strings and values are either components or a [RouteResolver](advanced-component-resolution.md)
**returns**            |                                          |          | Returns `undefined`

[How to read signatures](signatures.md)

#### RouteResolver

A RouterResolver is an object that contains a `resolve` and a `render` methods. Both methods are optional, but at least one must be defined.

`routeResolver = {resolve, render}`

##### routeResolver.resolve

The `resolve` method is called when the router needs to find a component to render. It is called once when a router path changes, but not on subsequent redraws. It can be used to run logic before a component initializes (for example authentication logic)

This method also allows you to asynchronously define what component will be rendered, making it suitable for code splitting and asynchronous module loading.

`routeResolver.resolve(use, args, path, route)`

Argument    | Type                  | Required | Description
----------- | --------------------- | -------- | ---
`use`       | `Function(Component)` | Yes      | Call this function with a component as the first argument to use it as the route's component
`args`      | `Object`              | No       | The [routing parameters](#routing-parameters)
`path`      | `String`              | No       | The current router path, including interpolated routing parameter values, but without the prefix
`route`     | `String`              | No       | The matched route
**returns** |                       |          | Returns `undefined`

##### routeResolver.render

The `render` method is called on every redraw for a matching route. It is meant for functional composition of components, to avoid the need for repetitive component definitions

`vnode = routeResolve.render(vnode)`

Argument    | Type                  | Required | Description
----------- | --------------------- | -------- | ---
`vnode`     | `Vnode`               | Yes      | A [vnode](vnodes.md) whose attributes object contains routing parameters. If the routeResolver does not have a `resolve` method, the vnode defaults to a `div`
**returns** | `Vnode`               |          | Returns a vnode

#### Static members

##### route.set

Redirects to a matching route, or to the default route if no matching routes can be found.

`m.route.set(path, data, options)`

Argument          | Type      | Required | Description
----------------- | --------- | -------- | ---
`path`            | `String`  | Yes      | The path to route to, without a prefix. The path may include slots for routing parameters
`data`            | `Object`  | No       | Routing parameters. If `path` has routing parameter slots, the properties of this object are interpolated into the path string
`options.replace` | `Boolean` | No       | Whether to create a new history entry or to replace the current one. Defaults to false
**returns**       |           |          | Returns `undefined`

##### route.get

Returns the current routing path, without the prefix.

`path = m.route.get()`

Argument          | Type      | Required | Description
----------------- | --------- | -------- | ---
**returns**       | String    |          | Returns the current path

##### route.prefix

Defines a router prefix. The router prefix is a fragment of the URL that dictates the underlying [strategy](routing-strategies.md) used by the router.

`m.route.prefix(prefix)`

Argument          | Type      | Required | Description
----------------- | --------- | -------- | ---
`prefix`          | `String`  | Yes      | The prefix that controls the underlying [routing strategy](#routing-strategy) used by Mithril.
**returns**       |           |          | Returns `undefined`

##### route.link

`eventHandler = m.route.link(vnode)`

Argument          | Type        | Required | Description
----------------- | ----------- | -------- | ---
`vnode`           | `Vnode`     | Yes      | This method is meant to be used in conjunction with an `<a>` [vnode](vnodes.md)'s [`oncreate` hook](lifecycle-methods.md)
**returns**       | Function(e) |          | Returns an event handler that calls `m.route.set` with the link's `href` as the `path`

---

#### How it works

Routing is a system that allows creating Single-Page-Applications (SPA), i.e. applications that can go from a "page" to another without causing a full browser refresh.

It enables seamless navigability while preserving the ability to bookmark each page individually, and the ability to navigate the application via the browser's history mechanism.

Routing without page refreshes is made partially possible by the [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method) API. Using this API, it's possible to programmatically change the URL displayed by the browser after a page has loaded, but it's the application developer's responsibility to ensure that navigating to any given URL from a cold state (e.g. a new tab) will render the appropriate markup.

#### Routing strategies

The routing strategy dictates how a library might actually implement routing. There are three general strategies that can be used to implement a SPA routing system, and each has different caveats:

- Using the [fragment identifier](https://en.wikipedia.org/wiki/Fragment_identifier) (aka the hash) portion of the URL. A URL using this strategy typically looks like `http://localhost/#!/page1`
- Using the querystring. A URL using this strategy typically looks like `http://localhost/?/page1`
- Using the pathname. A URL using this strategy typically looks like `http://localhost/page1`

Using the hash strategy is guaranteed to work in browsers that don't support `history.pushState` (namely, Internet Explorer 9), because it can fall back to using `onhashchange`. Use this strategy if you want to support IE9.

The querystring strategy also technically works in IE9, but it falls back to reloading the page. Use this strategy if you want to support anchored links and you are not able to make the server-side necessary to support the pathname strategy.

The pathname strategy produces the cleanest looking URLs, but does not work in IE9 *and* requires setting up the server to serve the single page application code from every URL that the application can route to. Use this strategy if you want cleaner-looking URLs and do not need to support IE9.

Single page applications that use the hash strategy often use the convention of having an exclamation mark after the hash to indicate that they're using the hash as a routing mechanism and not for the purposes of linking to anchors. The `#!` string is known as a *hashbang*.

The default strategy uses the hashbang.

---

### Typical usage

Normally, you need to create a few [components](components.md) to map routes to:

```javascript
var Home = {
	view: function() {
		return [
			m(Menu),
			m("h1", "Home")
		]
	}
}

var Page1 = {
	view: function() {
		return [
			m(Menu),
			m("h1", "Page 1")
		]
	}
}
```

In the example above, there are two components: `Home` and `Page1`. Each contains a menu and some text. The menu is itself being defined as a component to avoid repetition:

```javascript
var Menu = {
	view: function() {
		return m("nav", [
			m("a[href=/]", {oncreate: m.route.link}, "Home"),
			m("a[href=/page1]", {oncreate: m.route.link}, "Page 1"),
		])
	}
}
```

Now we can define routes and map our components to them:

```javascript
m.route(document.body, "/", {
	"/": Home,
	"/page1": Page1,
})
```

Here we specify two routes: `/` and `/page1`, which render their respective components when the user navigates to each URL. By default, the SPA router prefix is `#!`

---

### Navigating to different routes

In the example above, the `Menu` component has two links. You can specify that their `href` attribute is a route URL (rather than being a regular link that navigates away from the current page), by adding the hook `{oncreate: m.route.link}`

You can also navigate programmatically, via `m.route.set(route)`. For example, `m.route.set("/page1")`.

When navigating to routes, there's no need to explicitly specify the router prefix. In other words, don't add the hashbang `#!` in front of the route path when linking via `m.route.link` or redirecting.


---

### Routing parameters

Sometimes we want to have a variable id or similar data appear in a route, but we don't want to explicitly specify a separate route for every possible id. In order to achieve that, Mithril supports parameterized routes:

```
var Edit = {
	view: function(vnode) {
		return [
			m(Menu),
			m("h1", "Editing " + vnode.attrs.id)
		]
	}
}
m.route(document.body, "/edit/1", {
	"/edit/:id": Edit,
})
```

In the example above, we defined a route `/edit/:id`. This creates a dynamic route that matches any URL that starts with `/edit/` and is followed by some data (e.g. `/edit/1`, `edit/234`, etc). The `id` value is then mapped as an attribute of the component's [vnode](vnodes.md) (`vnode.attrs.id`)

It's possible to have multiple arguments in a route, for example `/edit/:projectID/:userID` would yield the properties `projectID` and `userID` on the component's vnode attributes object.

#### Variadic routes

It's also possible to have variadic routes, i.e. a route with an argument that contains URL pathnames that contain slashes:

```javascript
m.route(document.body, "/edit/pictures/image.jpg", {
	"/files/:file...": Edit,
})
```

---

### Changing route prefix

The router prefix is a fragment of the URL that dictates the underlying [strategy](routing-strategies.md) used by the router.

```javascript
// set to pathname strategy
m.route.prefix("")

// set to querystring strategy
m.route.prefix("?")

// set to hash without bang
m.route.prefix("#")

// set to pathname strategy on a non-root URL
// e.g. if the app lives under `http://localhost/my-app` and something else lives under `http://localhost`
m.route.prefix("/my-app")
```

---

### Advanced component resolution

Instead of mapping a component to a route, you can specify a RouteResolver object. A RouteResolver object contains a `resolve()` and a `render()` method. Both methods are optional, but at least one of them should be specified.

```javascript
m.route(document.body, "/", {
	"/": {
		resolve: function(use) {
			use(Home)
		},
		render: function(vnode) {
			return vnode
		},
	}
})
```

The RouteResolver can be used to implement a variety of advanced component initialization use cases.

---

### Wrapping a layout component

The RouterResolver's `render` method can be used to wrap a layout around a component, or to pass parameters to a top level component

```javascript
var Layout = {
	view: function(vnode) {
		return m(".layout", vnode.children)
	}
}

m.route(document.body, "/", {
	"/": {
		render: function() {
			return m(Layout, Home)
		},
	}
})
```

---

### Authentication

The RouterResolver's `resolve` method can be used to run logic before component initialization (including asynchronous logic). The example below shows how to implement a login wall that prevents users from seeing the `/secret` page unless they login.

```javascript
var isLoggedIn = false

var Login = {
	view: function() {
		return m("form", [
			m("button[type=button]", {
				onclick: function() {
					isLoggedIn = true
					m.route.set("/secret")
				}
			}, "Login")
		])
	}
}

m.route(document.body, "/secret", {
	"/secret": {
		resolve: function(use) {
			if (isLoggedIn) use(Home)
			else m.route.set("/login")
		},
	},
	"/login": Login
})
```

When the application loads, `resolve` is called and since `isLoggedIn` is false, the application redirects to `/login`. Once the user pressed the login button, `isLoggedIn` would be set to true, and the application would redirect to `/secret`. The `resolve` method would run once again, and since `isLoggedIn` is true this time, the application would render the `Home` component.

For the sake of simplicity, in the example above, the user's logged in status is kept in a global variable, and that flag is merely toggled when the user clicks the login button. In a real life application, a user would obviously have to supply proper login credentials, and clicking the login button would trigger a request to a server to authenticate the user.

---

### Lazy loading

One important feature of the `resolve` method in RouteResolvers is that the `use` callback can be triggered asynchronously. This allows components to be downloaded on demand.

At its simplest form, one could do the following:

```javascript
// Home.js
module.export = {
	view: function() {
		return [
			m(Menu),
			m("h1", "Home")
		]
	}
}
```

```javascript
// index.js
function load(file, done) {
	m.request({
		method: "GET",
		url: file,
		extract: function(xhr) {
			return new Function("var module = {};" + xhr.responseText + ";return module.exports;")
		}
	})
	.run(done)
}

m.route(document.body, "/", {
	"/": {
		resolve: function(use) {
			load("Home.js", use)
		},
	},
})
```

However, realistically, in order for that to work on a production scale, it would be necessary to bundle all of the dependencies for the `Home.js` module into the file that is ultimately served by the server.

Fortunately, there are a number of tools that facilitate the task of bundling modules for lazy loading. Here's an example using webpack's code splitting system:

```javascript
m.route(document.body, "/", {
	"/": {
		resolve: function(use) {
			//using Webpack async code splitting
			require(['./Home.js'], use)
		},
	},
})
```
