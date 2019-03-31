# API

### Cheatsheet

Here are examples for the most commonly used methods. If a method is not listed below, it's meant for advanced usage.

#### m(selector, attrs, children) - [docs](hyperscript.md)

```JavaScript
m("div.class#id", {title: "title"}, ["children"])
```

---

#### m.mount(element, component) - [docs](mount.md)

```JavaScript
var state = {
	count: 0,
	inc: function() {state.count++}
}

var Counter = {
	view: function() {
		return m("div", {onclick: state.inc}, state.count)
	}
}

m.mount(document.body, Counter)
```

---

#### m.route(root, defaultRoute, routes) - [docs](route.md)

```JavaScript
var Home = {
	view: function() {
		return "Welcome"
	}
}

m.route(document.body, "/home", {
	"/home": Home, // defines `http://localhost/#!/home`
})
```

#### m.route.set(path) - [docs](route.md#mrouteset)

```JavaScript
m.route.set("/home")
```

#### m.route.get() - [docs](route.md#mrouteget)

```JavaScript
var currentRoute = m.route.get()
```

#### m.route.prefix(prefix) - [docs](route.md#mrouteprefix)

Call this before `m.route()`

```JavaScript
m.route.prefix("#!")
```

#### m.route.link() - [docs](route.md#mroutelink)

```JavaScript
m("a[href='/Home']", {oncreate: m.route.link}, "Go to home page")
```

---

#### m.request(options) - [docs](request.md)

```JavaScript
m.request({
	method: "PUT",
	url: "/api/v1/users/:id",
	data: {id: 1, name: "test"}
})
.then(function(result) {
	console.log(result)
})
```

---

#### m.jsonp(options) - [docs](jsonp.md)

```JavaScript
m.jsonp({
	url: "/api/v1/users/:id",
	data: {id: 1},
	callbackKey: "callback",
})
.then(function(result) {
	console.log(result)
})
```

---

#### m.parseQueryString(querystring) - [docs](parseQueryString.md)

```JavaScript
var object = m.parseQueryString("a=1&b=2")
// {a: "1", b: "2"}
```

---

#### m.buildQueryString(object) - [docs](buildQueryString.md)

```JavaScript
var querystring = m.buildQueryString({a: "1", b: "2"})
// "a=1&b=2"
```

---

#### m.trust(htmlString) - [docs](trust.md)

```JavaScript
m.render(document.body, m.trust("<h1>Hello</h1>"))
```

---

#### m.redraw() - [docs](redraw.md)

```JavaScript
var count = 0
function inc() {
	setInterval(function() {
		count++
		m.redraw()
	}, 1000)
}

var Counter = {
	oninit: inc,
	view: function() {
		return m("div", count)
	}
}

m.mount(document.body, Counter)
```
