## m.route

Routing is a system that allows creating Single-Page-Applications (SPA), i.e. applications that can go from a page to another without causing a full browser refresh.

It enables seamless navigability while preserving the ability to bookmark each page individually, and the ability to navigate the application via the browser's history mechanism.

This method overloads four different units of functionality:

- `m.route(rootElement, defaultRoute, routes)` - defines the available URLs in an application, and their respective modules

- `m.route(path)` - redirects to another route

- `m.route()` - returns the currently active route

- `m.route(element)` - an extension to link elements that unobtrusively abstracts away the routing mode

Routing is single-page-application (SPA) friendly, and can be implemented using either `location.hash`, HTML5 URL rewriting or `location.querystring`. See [`m.route.mode`](#mode) for the caveats of each implementation.

---

<a name="defining-routes"></a>

### Defining routes

#### Usage

To define a list of routes, you need to specify a host DOM element, a default route and a key-value map of possible routes and respective [modules](mithril.module.md) to be rendered.

The example below defines three routes, to be rendered in `<body>`. `home`, `login` and `dashboard` are modules. We'll see how to define a module in a bit.

```javascript
m.route(document.body, "/", {
	"/": home,
	"/login": login,
	"/dashboard": dashboard,
});
```

Routes can take arguments, by prefixing words with a colon `:`

The example below shows a route that takes an `userID` parameter

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

//define a route
m.route(document.body, "/dashboard/johndoe", {
	"/dashboard/:userID": dashboard
});

//setup routes to start w/ the `#` symbol
m.route.mode = "hash";
```

This redirects to the URL `http://server/#/dashboard/johndoe` and yields:

```markup
<body>johndoe</body>
```

Above, `dashboard` is a module. It contains a `controller` and a `view` properties. When the URL matches a route, the respective module's controller is instantiated and passed as a parameter to the view.

In this case, since there's only route, the app redirects to the default route `"/dashboard/johndoe"`.

The string `johndoe` is bound to the `:userID` parameter, which can be retrieved programmatically in the controller via `m.route.param("userID")`.

The `m.route.mode` defines which part of the URL to use for routing.

---

#### Variadic routes

We can append an ellipsis (`...`) to the name of a route argument to allow it to match URL snippets that contain slashes:

```javascript
m.route(document.body, "/files/pictures/pic1.jpg", {
	"/files/:file...": gallery
});

m.route.param("file") === "pictures/pic1.jpg"
```

```javascript
m.route(document.body, "/blog/2014/01/20/articles", {
	"/blog/:date.../articles": articleList
});

m.route.param("date") === "2014/01/20"
```

Note that Mithril checks for route matches in the order the routes are defined, so you should put variadic routes at the bottom of the list to prevent them from matching other more specific routes.

```
m.route(document.body, "/blog/archive/2014", {
	"/blog/:date...": module1, //for the default path in the line above, this route matches first!
	"/blog/archive/:year": module2
});

m.route.param("date") === "archive/2014"

//the routes should be flipped around to get `m.route.param("year") == "2014"`
```

---

#### Routes with querystrings

In addition to route parameters, it's possible to pass arbitrary data to `m.route.param` using the querystring

```javascript
m.route("/grid?sortby=date&dir=desc")

var sortBy = m.route.param("sortby") // "date"
var dir = m.route.param("dir") // "desc"
```

---

#### Running clean up code on route change

If a module's controller implements an instance method called `onunload`, this method will be called when a route changes.

```javascript
var home = {};
home.controller = function() {
	this.onunload = function() {
		console.log("unloading home module");
	};
};

var dashboard = {};
dashboard.controller = function() {};
dashboard.view = function() {};

//go to the default route (home)
m.route(document.body, "/", {
	"/": home,
	"/dashboard": dashboard,
});

//re-route to dashboard
m.route("/dashboard"); // logs "unloading home"
```

This mechanism is useful to clear timers and unsubscribe event handlers. If you have a hierarchy of components, you can recursively call `unload` on all the components in the tree or use a [pubsub](http://microjs.com/#pubsub) library to unload specific components on demand.

---

#### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
void route(DOMElement rootElement, String defaultRoute, Object<Module> routes) { String mode, String param(String key) }

where:
	Module :: Object { void controller(), void view(Object controllerInstance) }
```

-	**DOMElement root**

	A DOM element which will contain the view's template.
	
-	**String defaultRoute**
	
	The route to redirect to if the current URL does not match any of the defined routes
	
-	**Object<Module> routes**
	
	A key-value map of possible routes and their respective modules. Keys are expected to be absolute pathnames, but can include dynamic parameters. Dynamic parameters are words preceded by a colon `:`
	
	`{'/path/to/page/': pageModule}` - a route with a basic pathname
  
	`{'/path/to/page/:id': pageModule}` - a route with a pathname that contains a dynamic parameter called `id`. This route would be selected if the URL was `/path/to/page/1`, `/path/to/page/test`, etc

	`{'/user/:userId/book/:bookId': userBookModule}` - a route with a pathname that contains two parameters

	Dynamic parameters are wild cards that allow selecting a module based on a URL pattern. The values that replace the dynamic parameters in a URL are available via `m.route.param()`

	Note that the URL component used to resolve routes is dependent on `m.route.mode`. By default, the querystring is considered the URL component to test against the routes collection

	If the current page URL matches a route, its respective module is activated. See `m.module` for information on modules.

-	<a name="mode"></a>

	#### m.route.mode

	**String mode**

	The `m.route.mode` property defines which URL portion is used to implement the routing mechanism. Its value can be set to either "search", "hash" or "pathname". Default value is "search". Note that if you're changing this configuration value, you should change it **before** calling `m.route`.

	-	`search` mode uses the querystring (i.e. `?`). This allows named anchors (i.e. `<a href="#top">Back to top</a>`, `<a name="top"></a>`) to work on the page, but routing changes causes page refreshes in IE8, due to its lack of support for `history.pushState`.
	
		Example URL: `http://server/?/path/to/page`
	
	-	`hash` mode uses the hash (i.e. `#`). It's the only mode in which routing changes do not cause page refreshes in any browser. However, this mode does not support named anchors.
	
		Example URL: `http://server/#/path/to/page`
	
	-	`pathname` mode allows routing URLs that contains no special characters, however this mode requires server-side setup in order to support bookmarking and page refreshes. It also causes page refreshes in IE8.
		
		Example URL: `http://server/path/to/page`
	
		The simplest server-side setup possible to support pathname mode is to serve the same content regardless of what URL is requested. In Apache, this URL rewriting can be achieved using ModRewrite.

-	<a name="param"></a>

	#### m.route.param
	
	**String param(String key)**
	
	Route parameters are dynamic values that can be extracted from the URL based on the signature of the currently active route.

	A route without parameters looks like this:

	`"/path/to/page/"`

	A route with parameters might look like this:

	`"/path/to/page/:id"` - here, `id` is the name of the route parameter

	If the currently active route is `/dashboard/:userID` and the current URL is `/dashboard/johndoe`, then calling `m.route.param("userID")` returns `"johndoe"`
	
	Querystring parameters in a route are also available in this collection automatically.
	
	`"/grid?sortby=date"` - here,  `m.route.param("sortby")` returns `"date"`
	
	-	**String key**
	
		The name of a route parameter
		
	-	**returns String value**
	
		The value that maps to the parameter specified by `key`

---

<a name="redirecting"></a>

### Redirecting

#### Usage

You can programmatically redirect to another page. Given the example in the "Defining Routes" section:

```javascript
m.route("/dashboard/marysue");
```

redirects to `http://server/#/dashboard/marysue`

---

#### Signature
	
[How to read signatures](how-to-read-signatures.md)

```clike
void route(String path [, any params])
```

-	**String path**

	The route to redirect to. Note that to redirect to a different page outside of the scope of Mithril's routing, you should use `window.location`

-	**any params**

	Parameters to pass as a querystring

---

<a name="reading-current-route"></a>

### Reading the currently active route

#### Usage

Mithril updates the native `location` object after rendering in order to allow the browser's `history.pushState` API to correctly show descriptive history entries (e.g. for Chrome's Ctrl+H page).

In order to retrieve the currently active route in a controller, you can use `m.route()`. This returns the portion of the URL determined by `m.route.mode` (minus the `?` or `#` symbols for the `search` and `hash` modes, respectively).

```javascript
//if the location bar is "http://example.com/?/foo/bar"
//and m.route.mode is `search`
//then `currentRoute == "/foo/bar"`
var currentRoute = m.route();
```

---

#### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
String route()
```

-	**returns String route**

	returns the currently active route

---

<a name="mode-abstraction"></a>

### Mode abstraction

#### Usage

This method is meant to be used with a virtual element's `config` attribute. For example:

```javascript
//Note that the '#' is not required in `href`, thanks to the `config` setting.
m("a[href='/dashboard/alicesmith']", {config: m.route});
```

This makes the href behave correctly regardless of which `m.route.mode` is selected. It's a good practice to always use the idiom above, instead of hardcoding `?` or `#` in the href attribute.

See [`m()`](mithril.md) for more information on virtual elements.

---

#### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
void route(DOMElement element, Boolean isInitialized)
```

-	**DOMElement element**

	an anchor element `<a>` with an `href` attribute that points to a route

-	**Boolean isInitialized**

	the method does not run if this flag is set to true. This is to make the method compatible with virtual DOM elements' `config` attribute (see [`m()`](mithril))
