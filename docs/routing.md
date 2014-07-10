## Routing

Routing is a system that allows creating Single-Page-Applications (SPA), i.e. applications that can go from one page to another without causing a full browser refresh.

It enables seamless navigability while preserving the ability to bookmark each page individually, and the ability to navigate the application via the browser's history mechanism.

Mithril provides utilities to handle three different aspect of routing:

-	defining a list of routes
-	programmatically redirecting between routes
-	making links in templates routed transparently and unobtrusively

---

### Defining routes

To define a list of routes, you need to specify a host DOM element, a default route and a key-value map of possible routes and respective [modules](mithril.module.md) to be rendered.

The example below defines three routes, to be rendered in `<body>`. `home`, `login` and `dashboard` are modules. We'll see how to define a module in a bit.

```javascript
m.route(document.body, "/", {
	"/": home,
	"/login": login,
	"/dashboard": dashboard,
});
```

Routes can take arguments, by prefixing words with a colon `:`.

The example below shows a route that takes a `userID` parameter.

```javascript
//a sample module
var dashboard = {
	controller: function() {
		this.id = m.route.param("userID");
	},
	view: function(controller) {
		return m("div", controller.id);
	}
}

//setup routes to start w/ the `#` symbol
m.route.mode = "hash";

//define a route
m.route(document.body, "/dashboard/johndoe", {
	"/dashboard/:userID": dashboard
});
```

This redirects to the URL `http://server/#/dashboard/johndoe` and yields:

```markup
<body>johndoe</body>
```

Above, `dashboard` is a module. It contains `controller` and `view` properties. When the URL matches a route, the respective module's controller is instantiated and passed as a parameter to the view.

In this case, since there's only one route, the app redirects to the default route `"/dashboard/johndoe"` and, under the hood, it calls `m.module(document.body, dashboard)`.

The string `johndoe` is bound to the `:userID` parameter, which can be retrieved programmatically in the controller via `m.route.param("userID")`.

The `m.route.mode` property defines which URL portion is used to implement the routing mechanism. Its value can be set to either "search", "hash" or "pathname". The default value is "search".

-	`search` mode uses the querystring. This allows named anchors (i.e. `<a href="#top">Back to top</a>`, `<a name="top"></a>`) to work on the page, but routing changes causes page refreshes in IE8, due to its lack of support for `history.pushState`.

	Example URL: `http://server/?/path/to/page`

-	`hash` mode uses the hash. It's the only mode in which routing changes do not cause page refreshes in any browser. However, this mode does not support named anchors and browser history lists.

	Example URL: `http://server/#/path/to/page`

-	`pathname` mode allows routing URLs that contain no special characters, however this mode requires server-side setup in order to support bookmarking and page refreshes. It also causes page refreshes in IE8.
	
	Example URL: `http://server/path/to/page`

	The simplest server-side setup possible to support pathname mode is to serve the same content regardless of what URL is requested. In Apache, this URL rewriting can be achieved using [mod_rewrite](https://httpd.apache.org/docs/current/mod/mod_rewrite.html).


---

### Redirecting

You can programmatically redirect to another page. Given the example in the "Defining Routes" section:

```javascript
m.route("/dashboard/marysue");
```

redirects to `http://server/#/dashboard/marysue`

---

### Mode abstraction

This method is meant to be used with a virtual element's `config` attribute. For example:

```javascript
//Note that the '#' is not required in `href`, thanks to the `config` setting.
m("a[href='/dashboard/alicesmith']", {config: m.route});
```

This makes the href behave correctly regardless of which `m.route.mode` is selected. It's a good practice to always use the idiom above, instead of hardcoding `?` or `#` in the href attribute.

See [`m()`](mithril.md) for more information on virtual elements.
