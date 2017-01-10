# API

### Cheatsheet

Here are examples for the most commonly used methods. If a method is not listed below, it's meant for advanced usage.

#### m(selector, attrs, children) - [docs](hyperscript.md)

```javascript
m("div.class#id", {title: "title"}, ["children"])
```

---

#### m.mount(element, component) - [docs](mount.md)

```javascript
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

```javascript
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

```javascript
m.route.set("/home")
```

#### m.route.get() - [docs](route.md#mrouteget)

```javascript
var currentRoute = m.route.get()
```

#### m.route.prefix(prefix) - [docs](route.md#mrouteprefix)

Call this before `m.route()`

```javascript
m.route.prefix("#!")
```

#### m.route.link() - [docs](route.md#mroutelink)

```javascript
m("a[href='/Home']", {oncreate: m.route.link}, "Go to home page")
```

---

#### m.request(options) - [docs](request.md)

```javascript
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

```javascript
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

```javascript
var object = m.parseQueryString("a=1&b=2")
// {a: "1", b: "2"}
```

---

#### m.buildQueryString(object) - [docs](buildQueryString.md)

```javascript
var querystring = m.buildQueryString({a: "1", b: "2"})
// "a=1&b=2"
```

---

#### m.withAttr(attrName, callback) - [docs](withAttr.md)

```javascript
var state = {
	value: "",
	setValue: function(v) {state.value = v}
}

var Component = {
	view: function() {
		return m("input", {
			oninput: m.withAttr("value", state.setValue),
			value: state.value,
		})
	}
}

m.mount(document.body, Component)
```

---

#### m.trust(htmlString) - [docs](trust.md)

```javascript
m.render(document.body, m.trust("<h1>Hello</h1>"))
```

---

#### m.redraw() - [docs](redraw.md)

```javascript
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
