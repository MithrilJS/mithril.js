<!--meta-description
Documentation on m.route(), Mithril.js' client-side router
-->

# route(root, defaultRoute, routes)

- [Description](#description)
- [Signature](#signature)
	- [Static members](#static-members)
		- [m.route.set](#mrouteset)
		- [m.route.get](#mrouteget)
		- [m.route.prefix](#mrouteprefix)
		- [m.route.Link](#mroutelink)
		- [m.route.param](#mrouteparam)
		- [m.route.SKIP](#mrouteskip)
	- [RouteResolver](#routeresolver)
		- [routeResolver.onmatch](#routeresolveronmatch)
		- [routeResolver.render](#routeresolverrender)
- [How it works](#how-it-works)
- [Typical usage](#typical-usage)
- [Navigating to different routes](#navigating-to-different-routes)
- [Routing parameters](#routing-parameters)
	- [Key parameter](#key-parameter)
	- [Variadic routes](#variadic-routes)
	- [History state](#history-state)
- [Changing router prefix](#changing-router-prefix)
- [Advanced component resolution](#advanced-component-resolution)
	- [Wrapping a layout component](#wrapping-a-layout-component)
	- [Redirection](#redirection)
	- [Preloading data](#preloading-data)
	- [Code splitting](#code-splitting)
	- [Typed routes](#typed-routes)
	- [Hidden routes](#hidden-routes)
	- [Route cancellation / blocking](#route-cancellation--blocking)
- [Third-party integration](#third-party-integration)

---

### Description

Navigate between "pages" within an application

```javascript
var Home = {
	view: function() {
		return "Welcome"
	}
}

m.route(document.body, "/home", {
	"/home": Home, // defines `https://localhost/#!/home`
})
```

You can only have one `m.route` call per application.

---

### Signature

`m.route(root, defaultRoute, routes)`

Argument               | Type                                     | Required | Description
---------------------- | ---------------------------------------- | -------- | ---
`root`                 | `Element`                                | Yes      | A DOM element that will be the parent node to the subtree
`defaultRoute`         | `String`                                 | Yes      | The route to redirect to if the current URL does not match a route. Note, this is not the initial route.  Initial route will be your address bar's url.
`routes`               | `Object<String,Component|RouteResolver>` | Yes      | An object whose keys are route strings and values are either components or a [RouteResolver](#routeresolver)
**returns**            |                                          |          | Returns `undefined`

[How to read signatures](signatures.md)


#### Static members

##### m.route.set

Redirects to a matching route, or to the default route if no matching routes can be found. Triggers an asynchronous redraw off all mount points.

`m.route.set(path, params, options)`

Argument          | Type      | Required | Description
----------------- | --------- | -------- | ---
`path`            | `String`  | Yes      | The [path name](paths.md) to route to, without a prefix. The path may include parameters, interpolated with values from `params`.
`params`          | `Object`  | No       | Routing parameters. If `path` has routing parameter slots, the properties of this object are interpolated into the path string
`options.replace` | `Boolean` | No       | Whether to create a new history entry or to replace the current one. Defaults to false
`options.state`   | `Object`  | No       | The `state` object to pass to the underlying `history.pushState` / `history.replaceState` call. This state object becomes available in the `history.state` property, and is merged into the [routing parameters](#routing-parameters) object. Note that this option only works when using the pushState API, but is ignored if the router falls back to hashchange mode (i.e. if the pushState API is not available)
`options.title`   | `String`  | No       | The `title` string to pass to the underlying `history.pushState` / `history.replaceState` call.
**returns**       |           |          | Returns `undefined`

Remember that when using `.set` with `params` you also need to define the route:
```javascript
var Article = {
	view: function(vnode) {
		return "This is article " + vnode.attrs.articleid
	}
}

m.route(document.body, {
	'/article/:articleid': Article
})
m.route.set('/article/:articleid', {articleid: 1})
```

##### m.route.get

Returns the last fully resolved routing path, without the prefix. It may differ from the path displayed in the location bar while an asynchronous route is [pending resolution](#code-splitting).

`path = m.route.get()`

Argument          | Type      | Required | Description
----------------- | --------- | -------- | ---
**returns**       | `String`  |          | Returns the last fully resolved path

##### m.route.prefix

Defines a router prefix. The router prefix is a fragment of the URL that dictates the underlying [strategy](#routing-strategies) used by the router.

`m.route.prefix = prefix`

Argument          | Type      | Required | Description
----------------- | --------- | -------- | ---
`prefix`          | `String`  | Yes      | The prefix that controls the underlying [routing strategy](#routing-strategies) used by Mithril.

This is a simple property, so you can both read it and write to it.

##### m.route.Link

This component creates a dynamic routed link. Its essential function is to produce `a` links with local `href`s transformed to take account of the [route prefix](#mrouteprefix).

```javascript
m(m.route.Link, {href: "/foo"}, "foo")

// Unless m.route.prefix has changed from the default strategy, render to:
// <a href="#!/foo">foo</a>
```

Links accept a selection of special attributes: 
* `selector` is what would be passed as the first argument to [`m`](hyperscript.md): any selector is valid, including non-`a` elements.
* `params` & `options` are the arguments with the same names as defined in [`m.route.set`](#mrouteset).
* `disabled`, if true, disables routing behaviour and any bound `onclick` handler, and attaches a `data-disabled="true"` attribute for accessibility hints; if the element is an `a`, the `href` is removed.

*Routing behaviour cannot be prevented using the event handling API: use `disabled` instead.*

```javascript
m(m.route.Link, {
	href: "/foo",
	selector: "button.large",
	disabled: true,
	params: {key: "value"},
	options: {replace: true},
}, "link name")

// Renders to:
// <button disabled aria-disabled="true" class="large">link name</button>
```

`vnode = m(m.route.Link, attributes, children)`

Argument              | Type                                 | Required | Description
--------------------- | ------------------------------------ | -------- | ---
`attributes.href`     | `Object`                             | Yes      | The target route to navigate to.
`attributes.disabled` | `Boolean`                            | No       | Disables the element accessibly.
`attributes.selector` | `String|Object|Function`             | No       | A selector for [`m`](hyperscript.md), defaults to `"a"`.
`attributes.options`  | `Object`                             | No       | Sets the `options` passed to [`m.route.set`](#mrouteset).
`attributes.params`   | `Object`                             | No       | Sets the `params` passed to [`m.route.set`](#mrouteset).
`attributes`          | `Object`                             | No       | Any other attributes to be forwarded to `m`.
`children`            | `Array<Vnode>|String|Number|Boolean` | No       | Child [vnodes](vnodes.md) for this link.
**returns**           | `Vnode`                              |          | A [vnode](vnodes.md).

##### m.route.param

Retrieves a route parameter from the last fully resolved route. A route parameter is a key-value pair. Route parameters may come from a few different places:

- route interpolations (e.g. if a route is `/users/:id`, and it resolves to `/users/1`, the route parameter has a key `id` and value `"1"`)
- router querystrings (e.g. if the path is `/users?page=1`, the route parameter has a key `page` and value `"1"`)
- `history.state` (e.g. if history.state is `{foo: "bar"}`, the route parameter has key `foo` and value `"bar"`)

`value = m.route.param(key)`

Argument          | Type            | Required | Description
----------------- | --------------- | -------- | ---
`key`             | `String`        | No       | A route parameter name (e.g. `id` in route `/users/:id`, or `page` in path `/users/1?page=3`, or a key in `history.state`)
**returns**       | `String|Object` |          | Returns a value for the specified key. If a key is not specified, it returns an object that contains all the interpolation keys

Note that in the `onmatch` function of a RouteResolver, the new route hasn't yet been fully resolved, and `m.route.param()` will return the parameters of the previous route, if any. `onmatch` receives the parameters of the new route as an argument.

##### m.route.SKIP

A special value that can be returned from a [route resolver's `onmatch`](#routeresolveronmatch) to skip to the next route.

#### RouteResolver

A RouteResolver is a non-component object that contains an `onmatch` method and/or a `render` method. Both methods are optional, but at least one must be present.

If an object can be detected as a component (by the presence of a `view` method or by being a `function`/`class`), it will be treated as such even if it has `onmatch` or `render` methods. Since a RouteResolver is not a component, it does not have lifecycle methods.

As a rule of thumb, RouteResolvers should be in the same file as the `m.route` call, whereas component definitions should be in their own modules.

`routeResolver = {onmatch, render}`

When using components, you could think of them as special sugar for this route resolver, assuming your component is `Home`:

```javascript
var routeResolver = {
	onmatch: function() { return Home },
	render: function(vnode) { return [vnode] },
}
```

##### routeResolver.onmatch

The `onmatch` hook is called when the router needs to find a component to render. It is called once per router path changes, but not on subsequent redraws while on the same path. It can be used to run logic before a component initializes (for example authentication logic, data preloading, redirection analytics tracking, etc)

This method also allows you to asynchronously define what component will be rendered, making it suitable for code splitting and asynchronous module loading. To render a component asynchronously return a promise that resolves to a component.

For more information on `onmatch`, see the [advanced component resolution](#advanced-component-resolution) section

`routeResolver.onmatch(args, requestedPath, route)`

Argument        | Type                                     | Description
--------------- | ---------------------------------------- | ---
`args`          | `Object`                                 | The [routing parameters](#routing-parameters)
`requestedPath` | `String`                                 | The router path requested by the last routing action, including interpolated routing parameter values, but without the prefix. When `onmatch` is called, the resolution for this path is not complete and `m.route.get()` still returns the previous path.
`route`         | `String`                                 | The router path requested by the last routing action, excluding interpolated routing parameter values
**returns**     | `Component|Promise<Component>|undefined` | Returns a component or a promise that resolves to a component

If `onmatch` returns a component or a promise that resolves to a component, this component is used as the `vnode.tag` for the first argument in the RouteResolver's `render` method. Otherwise, `vnode.tag` is set to `"div"`. Similarly, if the `onmatch` method is omitted, `vnode.tag` is also `"div"`.

If `onmatch` returns a promise that gets rejected, the router redirects back to `defaultRoute`. You may override this behavior by calling `.catch` on the promise chain before returning it.

##### routeResolver.render

The `render` method is called on every redraw for a matching route. It is similar to the `view` method in components and it exists to simplify [component composition](#wrapping-a-layout-component). It also lets you escape from Mithril.js' normal behavior of replacing the entire subtree.

`vnode = routeResolver.render(vnode)`

Argument            | Type                 | Description
------------------- | -------------------- | -----------
`vnode`             | `Object`             | A [vnode](vnodes.md) whose attributes object contains routing parameters. If onmatch does not return a component or a promise that resolves to a component, the vnode's `tag` field defaults to `"div"`
`vnode.attrs`       | `Object`             | A map of URL parameter values
**returns**         | `Array<Vnode>|Vnode` | The [vnodes](vnodes.md) to be rendered

The `vnode` parameter is just `m(Component, m.route.param())` where `Component` is the resolved component for the route (after `routeResolver.onmatch`) and `m.route.param()` is as documented [here](#mrouteparam). If you omit this method, the default return value is `[vnode]`, wrapped in a fragment so you can use [key parameters](#key-parameter). Combined with a `:key` parameter, it becomes a [single-element keyed fragment](keys.md#reinitializing-views-with-single-child-keyed-fragments), since it ends up rendering to something like `[m(Component, {key: m.route.param("key"), ...})]`.

---

#### How it works

Routing is a system that allows creating Single Page Applications (SPA), i.e. applications that can go from a "page" to another without causing a full browser refresh.

It enables seamless navigability while preserving the ability to bookmark each page individually, and the ability to navigate the application via the browser's history mechanism.

Routing without page refreshes is made partially possible by the [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState%28%29_method) API. Using this API, it's possible to programmatically change the URL displayed by the browser after a page has loaded, but it's the application developer's responsibility to ensure that navigating to any given URL from a cold state (e.g. a new tab) will render the appropriate markup.

#### Routing strategies

The routing strategy dictates how a library might actually implement routing. There are three general strategies that can be used to implement a SPA routing system, and each has different caveats:

- `m.route.prefix = '#!'` (default) – Using the [fragment identifier](https://en.wikipedia.org/wiki/Fragment_identifier) (aka the hash) portion of the URL. A URL using this strategy typically looks like `https://localhost/#!/page1`
- `m.route.prefix = '?'` – Using the querystring. A URL using this strategy typically looks like `https://localhost/?/page1`
- `m.route.prefix = ''` – Using the pathname. A URL using this strategy typically looks like `https://localhost/page1`

Using the hash strategy is guaranteed to work in browsers that don't support `history.pushState`, because it can fall back to using `onhashchange`. Use this strategy if you want to keep the hashes purely local.

The querystring strategy allows server-side detection, but it doesn't appear as a normal path. Use this strategy if you want to support and potentially detect anchored links server-side and you are not able to make the changes necessary to support the pathname strategy (like if you're using Apache and can't modify your .htaccess).

The pathname strategy produces the cleanest looking URLs, but requires setting up the server to serve the single page application code from every URL that the application can route to. Use this strategy if you want cleaner-looking URLs.

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
			m(m.route.Link, {href: "/"}, "Home"),
			m(m.route.Link, {href: "/page1"}, "Page 1"),
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

Here we specify two routes: `/` and `/page1`, which render their respective components when the user navigates to each URL.

---

### Navigating to different routes

In the example above, the `Menu` component has two `m.route.Link`s. That creates an element, by default an `<a>`, and sets it up to where if the user clicks on it, it navigates to another route on its own. It doesn't navigate remotely, just locally.

You can also navigate programmatically, via `m.route.set(route)`. For example, `m.route.set("/page1")`.

When navigating between routes, the router prefix is handled for you. In other words, leave out the hashbang `#!` (or whatever prefix you set `m.route.prefix` to) when linking Mithril.js routes, including in both `m.route.set` and in `m.route.Link`.

Do note that when navigating between components, the entire subtree is replaced. Use [a route resolver with a `render` method](#routeresolverrender) if you want to just patch the subtree.

---

### Routing parameters

Sometimes we want to have a variable id or similar data appear in a route, but we don't want to explicitly specify a separate route for every possible id. In order to achieve that, Mithril.js supports [parameterized routes](paths.md#path-parameters):

```javascript
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

#### Key parameter

When a user navigates from a parameterized route to the same route with a different parameter (e.g. going from `/page/1` to `/page/2` given a route `/page/:id`, the component would not be recreated from scratch since both routes resolve to the same component, and thus result in a virtual dom in-place diff. This has the side-effect of triggering the `onupdate` hook, rather than `oninit`/`oncreate`. However, it's relatively common for a developer to want to synchronize the recreation of the component to the route change event.

To achieve that, it's possible to combine route parameterization with [keys](#reinitializing-views-with-single-child-keyed-fragments) for a very convenient pattern:

```javascript
m.route(document.body, "/edit/1", {
	"/edit/:key": Edit,
})
```

This means that the [vnode](vnodes.md) that is created for the root component of the route has a route parameter object `key`. Route parameters become `attrs` in the vnode. Thus, when jumping from one page to another, the `key` changes and causes the component to be recreated from scratch (since the key tells the virtual dom engine that old and new components are different entities).

You can take that idea further to create components that recreate themselves when reloaded:

`m.route.set(m.route.get(), {key: Date.now()})`

Or even use the [`history state`](#history-state) feature to achieve reloadable components without polluting the URL:

`m.route.set(m.route.get(), null, {state: {key: Date.now()}})`

Note that the key parameter works only for component routes. If you're using a route resolver, you'll need to use a [single-child keyed fragment](keys.md#reinitializing-views-with-single-child-keyed-fragments), passing `key: m.route.param("key")`, to accomplish the same.

#### Variadic routes

It's also possible to have variadic routes, i.e. a route with an argument that contains URL pathnames that contain slashes:

```javascript
m.route(document.body, "/edit/pictures/image.jpg", {
	"/edit/:file...": Edit,
})
```

#### Handling 404s

For isomorphic / universal JavaScript app, an url param and a variadic route combined is very useful to display custom 404 error page.

In a case of 404 Not Found error, the server send back the custom page to client. When Mithril.js is loaded, it will redirect client to the default route because it can't know that route.

```javascript
m.route(document.body, "/", {
  "/": homeComponent,
  // [...]
  "/:404...": errorPageComponent
});
```

#### History state

It's possible to take full advantage of the underlying `history.pushState` API to improve user's navigation experience. For example, an application could "remember" the state of a large form when the user leaves a page by navigating away, such that if the user pressed the back button in the browser, they'd have the form filled rather than a blank form.

For example, you could create a form like this:

```javascript
var state = {
	term: "",
	search: function() {
		// save the state for this route
		// this is equivalent to `history.replaceState({term: state.term}, null, location.href)`
		m.route.set(m.route.get(), null, {replace: true, state: {term: state.term}})

		// navigate away
		location.href = "https://google.com/?q=" + state.term
	}
}

var Form = {
	oninit: function(vnode) {
		state.term = vnode.attrs.term || "" // populated from the `history.state` property if the user presses the back button
	},
	view: function() {
		return m("form", [
			m("input[placeholder='Search']", {
				oninput: function (e) { state.term = e.target.value },
				value: state.term
			}),
			m("button", {onclick: state.search}, "Search")
		])
	}
}

m.route(document.body, "/", {
	"/": Form,
})
```

This way, if the user searches and presses the back button to return to the application, the input will still be populated with the search term. This technique can improve the user experience of large forms and other apps where non-persisted state is laborious for a user to produce.

---

### Changing router prefix

The router prefix is a fragment of the URL that dictates the underlying [strategy](#routing-strategies) used by the router.

```javascript
// set to pathname strategy
m.route.prefix = ""

// set to querystring strategy
m.route.prefix = "?"

// set to hash without bang
m.route.prefix = "#"

// set to pathname strategy on a non-root URL
// e.g. if the app lives under `https://localhost/my-app` and something else
// lives under `https://localhost`
m.route.prefix = "/my-app"
```

---

### Advanced component resolution

Instead of mapping a component to a route, you can specify a RouteResolver object. A RouteResolver object contains a `onmatch()` and/or a `render()` method. Both methods are optional but at least one of them must be present.

```javascript
m.route(document.body, "/", {
	"/": {
		onmatch: function(args, requestedPath, route) {
			return Home
		},
		render: function(vnode) {
			return vnode // equivalent to m(Home)
		},
	}
})
```

RouteResolvers are useful for implementing a variety of advanced routing use cases.

---

#### Wrapping a layout component

It's often desirable to wrap all or most of the routed components in a reusable shell (often called a "layout"). In order to do that, you first need to create a component that contains the common markup that will wrap around the various different components:

```javascript
var Layout = {
	view: function(vnode) {
		return m(".layout", vnode.children)
	}
}
```

In the example above, the layout merely consists of a `<div class="layout">` that contains the children passed to the component, but in a real life scenario it could be as complex as needed.

One way to wrap the layout is to define an anonymous component in the routes map:

```javascript
// example 1
m.route(document.body, "/", {
	"/": {
		view: function() {
			return m(Layout, m(Home))
		},
	},
	"/form": {
		view: function() {
			return m(Layout, m(Form))
		},
	}
})
```

However, note that because the top level component is an anonymous component, jumping from the `/` route to the `/form` route (or vice-versa) will tear down the anonymous component and recreate the DOM from scratch. If the Layout component had [lifecycle methods](lifecycle-methods.md) defined, the `oninit` and `oncreate` hooks would fire on every route change. Depending on the application, this may or may not be desirable.

If you would prefer to have the Layout component be diffed and maintained intact rather than recreated from scratch, you should instead use a RouteResolver as the root object:

```javascript
// example 2
m.route(document.body, "/", {
	"/": {
		render: function() {
			return m(Layout, m(Home))
		},
	},
	"/form": {
		render: function() {
			return m(Layout, m(Form))
		},
	}
})
```

Note that in this case, if the Layout component has `oninit` and `oncreate` lifecycle methods, they would only fire on the first route change (assuming all routes use the same layout).

To clarify the difference between the two examples, example 1 is equivalent to this code:

```javascript
// functionally equivalent to example 1
var Anon1 = {
	view: function() {
		return m(Layout, m(Home))
	},
}
var Anon2 = {
	view: function() {
		return m(Layout, m(Form))
	},
}

m.route(document.body, "/", {
	"/": {
		render: function() {
			return m(Anon1)
		}
	},
	"/form": {
		render: function() {
			return m(Anon2)
		}
	},
})
```

Since `Anon1` and `Anon2` are different components, their subtrees (including `Layout`) are recreated from scratch. This is also what happens when components are used directly without a RouteResolver.

In example 2, since `Layout` is the top-level component in both routes, the DOM for the `Layout` component is diffed (i.e. left intact if it has no changes), and only the change from `Home` to `Form` triggers a recreation of that subsection of the DOM.

---

#### Redirection

The RouteResolver's `onmatch` hook can be used to run logic before the top level component in a route is initialized. You can use either Mithril's `m.route.set()` or native HTML's `history` API. When redirecting with the `history` API, the `onmatch` hook must return a never-resolving Promise to prevent resolution of the matched route. `m.route.set()` cancels resolution of the matched route internally, so this isn't necessary with it.

##### Example: authentication

The example below shows how to implement a login wall that prevents users from seeing the `/secret` page unless they login.

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
		onmatch: function() {
			if (!isLoggedIn) m.route.set("/login")
			else return Home
		}
	},
	"/login": Login
})
```

When the application loads, `onmatch` is called and since `isLoggedIn` is false, the application redirects to `/login`. Once the user pressed the login button, `isLoggedIn` would be set to true, and the application would redirect to `/secret`. The `onmatch` hook would run once again, and since `isLoggedIn` is true this time, the application would render the `Home` component.

For the sake of simplicity, in the example above, the user's logged in status is kept in a global variable, and that flag is merely toggled when the user clicks the login button. In a real life application, a user would obviously have to supply proper login credentials, and clicking the login button would trigger a request to a server to authenticate the user:

```javascript
var Auth = {
	username: "",
	password: "",

	setUsername: function(value) {
		Auth.username = value
	},
	setPassword: function(value) {
		Auth.password = value
	},
	login: function() {
		m.request({
			url: "/api/v1/auth",
			params: {username: Auth.username, password: Auth.password}
		}).then(function(data) {
			localStorage.setItem("auth-token", data.token)
			m.route.set("/secret")
		})
	}
}

var Login = {
	view: function() {
		return m("form", [
			m("input[type=text]", {
				oninput: function (e) { Auth.setUsername(e.target.value) },
				value: Auth.username
			}),
			m("input[type=password]", {
				oninput: function (e) { Auth.setPassword(e.target.value) },
				value: Auth.password
			}),
			m("button[type=button]", {onclick: Auth.login}, "Login")
		])
	}
}

m.route(document.body, "/secret", {
	"/secret": {
		onmatch: function() {
			if (!localStorage.getItem("auth-token")) m.route.set("/login")
			else return Home
		}
	},
	"/login": Login
})
```

---

#### Preloading data

Typically, a component can load data upon initialization. Loading data this way renders the component twice. The first render pass occurs upon routing, and the second fires after the request completes. Take care to note that `loadUsers()` returns a Promise, but any Promise returned by `oninit` is currently ignored. The second render pass comes from the [`background` option for `m.request`](request.md).

```javascript
var state = {
	users: [],
	loadUsers: function() {
		return m.request("/api/v1/users").then(function(users) {
			state.users = users
		})
	}
}

m.route(document.body, "/user/list", {
	"/user/list": {
		oninit: state.loadUsers,
		view: function() {
			return state.users.length > 0 ? state.users.map(function(user) {
				return m("div", user.id)
			}) : "loading"
		}
	},
})
```

In the example above, on the first render, the UI displays `"loading"` since `state.users` is an empty array before the request completes. Then, once data is available, the UI redraws and a list of user ids is shown.

RouteResolvers can be used as a mechanism to preload data before rendering a component in order to avoid UI flickering and thus bypassing the need for a loading indicator:

```javascript
var state = {
	users: [],
	loadUsers: function() {
		return m.request("/api/v1/users").then(function(users) {
			state.users = users
		})
	}
}

m.route(document.body, "/user/list", {
	"/user/list": {
		onmatch: state.loadUsers,
		render: function() {
			return state.users.map(function(user) {
				return m("div", user.id)
			})
		}
	},
})
```

Above, `render` only runs after the request completes, making the ternary operator redundant.

---

#### Code splitting

In a large application, it may be desirable to download the code for each route on demand, rather than upfront. Dividing the codebase this way is known as code splitting or lazy loading. In Mithril.js, this can be accomplished by returning a promise from the `onmatch` hook:

At its most basic form, one could do the following:

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
function load(file) {
	return m.request({
		method: "GET",
		url: file,
		extract: function(xhr) {
			return new Function("var module = {};" + xhr.responseText + ";return module.exports;")
		}
	})
}

m.route(document.body, "/", {
	"/": {
		onmatch: function() {
			return load("Home.js")
		},
	},
})
```

However, realistically, in order for that to work on a production scale, it would be necessary to bundle all of the dependencies for the `Home.js` module into the file that is ultimately served by the server.

Fortunately, there are a number of tools that facilitate the task of bundling modules for lazy loading. Here's an example using [native dynamic `import(...)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import), supported by many bundlers:

```javascript
m.route(document.body, "/", {
	"/": {
		onmatch: function() {
			return import('./Home.js')
		},
	},
})
```

---

### Typed routes

In certain advanced routing cases, you may want to constrain a value further than just the path itself, only matching something like a numeric ID. You can do that pretty easily by returning `m.route.SKIP` from a route.

```javascript
m.route(document.body, "/", {
	"/view/:id": {
		onmatch: function(args) {
			if (!/^\d+$/.test(args.id)) return m.route.SKIP
			return ItemView
		},
	},
	"/view/:name": UserView,
})
```

---

### Hidden routes

In rare circumstances, you may want to hide certain routes for some users, but not all. For instance, a user might be prohibited from viewing a particular user, and instead of showing a permission error, you'd rather pretend it doesn't exist and redirect to a 404 view instead. In this case, you can use `m.route.SKIP` to just pretend the route doesn't exist.

```javascript
m.route(document.body, "/", {
	"/user/:id": {
		onmatch: function(args) {
			return Model.checkViewable(args.id).then(function(viewable) {
				return viewable ? UserView : m.route.SKIP
			})
		},
	},
	"/:404...": PageNotFound,
})
```

---

### Route cancellation / blocking

RouteResolver `onmatch` can prevent route resolution by returning a promise that never resolves. This can be used to detect attempted redundant route resolutions and cancel them:

```javascript
m.route(document.body, "/", {
	"/": {
		onmatch: function(args, requestedPath) {
			if (m.route.get() === requestedPath)
				return new Promise(function() {})
		},
	},
})
```

---

### Third-party integration

In certain situations, you may find yourself needing to interoperate with another framework like React. Here's how you do it:

- Define all your routes using `m.route` as normal, but make sure you only use it *once*. Multiple route points are not supported.
- When you need to remove routing subscriptions, use `m.mount(root, null)`, using the same root you used `m.route(root, ...)` on. `m.route` uses `m.mount` internally to hook everything up, so it's not magic.

Here's an example with React:

```jsx
class Child extends React.Component {
	constructor(props) {
		super(props)
		this.root = React.createRef()
	}

	componentDidMount() {
		m.route(this.root, "/", {
			// ...
		})
	}

	componentDidUnmount() {
		m.mount(this.root, null)
	}

	render() {
		return <div ref={this.root} />
	}
}
```

And here's the rough equivalent with Vue:

```html
<div ref="root"></div>
```

```javascript
Vue.component("my-child", {
	template: `<div ref="root"></div>`,
	mounted: function() {
		m.route(this.$refs.root, "/", {
			// ...
		})
	},
	destroyed: function() {
		m.mount(this.$refs.root, null)
	},
})
```
