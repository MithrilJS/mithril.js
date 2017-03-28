# Introduction

- [What is Mithril?](#what-is-mithril)
- [Getting started](#getting-started)
- [Hello world](#hello-world)
- [DOM elements](#dom-elements)
- [Components](#components)
- [Routing](#routing)
- [XHR](#xhr)

---

### What is Mithril?

Mithril is a modern client-side Javascript framework for building Single Page Applications.
It's small (< 8kb gzip), fast and provides routing and XHR utilities out of the box.

<div style="display:flex;margin:0 0 30px;">
	<div style="width:50%;">
		<h5>Download size</h5>
		<small>Mithril (8kb)</small>
		<div style="animation:grow 0.08s;background:#1e5799;height:3px;margin:0 10px 10px 0;transform-origin:0;width:4%;"></div>
		<small style="color:#aaa;">Vue + Vue-Router + Vuex + fetch (40kb)</small>
		<div style="animation:grow 0.4s;background:#1e5799;height:3px;margin:0 10px 10px 0;transform-origin:0;width:20%"></div>
		<small style="color:#aaa;">React + React-Router + Redux + fetch (64kb)</small>
		<div style="animation:grow 0.64s;background:#1e5799;height:3px;margin:0 10px 10px 0;transform-origin:0;width:32%"></div>
		<small style="color:#aaa;">Angular (135kb)</small>
		<div style="animation:grow 1.35s;background:#1e5799;height:3px;margin:0 10px 10px 0;transform-origin:0;width:68%"></div>
	</div>
	<div style="width:50%;">
		<h5>Performance</h5>
		<small>Mithril (6.4ms)</small>
		<div style="animation:grow 0.64s;background:#1e5799;height:3px;margin:0 10px 10px 0;transform-origin:0;width:24%;"></div>
		<small style="color:#aaa;">Vue (9.8ms)</small>
		<div style="animation:grow 0.98s;background:#1e5799;height:3px;margin:0 10px 10px 0;transform-origin:0;width:40%"></div>
		<small style="color:#aaa;">React (12.1ms)</small>
		<div style="animation:grow 1.21s;background:#1e5799;height:3px;margin:0 10px 10px 0;transform-origin:0;width:48%"></div>
		<small style="color:#aaa;">Angular (11.5ms)</small>
		<div style="animation:grow 1.15s;background:#1e5799;height:3px;margin:0 10px 10px 0;transform-origin:0;width:44%"></div>
	</div>
</div>

Mithril is used by companies like Vimeo and Nike, and open source platforms like Lichess.

If you are an experienced developer and want to know how Mithril compares to other frameworks, see the [framework comparison](framework-comparison.md) page.

Mithril supports browsers all the way back to IE9, no polyfills required.

---

### Getting started

The easiest way to try out Mithril is to include it from a CDN, and follow this tutorial. It'll cover the majority of the API surface (including routing and XHR) but it'll only take 10 minutes.

Let's create an HTML file to follow along:

```markup
<body>
	<script src="//unpkg.com/mithril/mithril.js"></script>
	<script>
	var root = document.body

	// your code goes here!
	</script>
</body>
```

---

### Hello world

Let's start as small as we can: render some text on screen. Copy the code below into your file (and by copy, I mean type it out - you'll learn better)

```javascript
var root = document.body

m.render(root, "Hello world")
```

Now, let's change the text to something else. Add this line of code under the previous one:

```javascript
m.render(root, "My first app")
```

As you can see, you use the same code to both create and update HTML. Mithril automatically figures out the most efficient way of updating the text, rather than blindly recreating it from scratch.

---

### DOM elements

Let's wrap our text in an `<h1>` tag.

```javascript
m.render(root, m("h1", "My first app"))
```

The `m()` function can be used to describe any HTML structure you want. So if you need to add a class to the `<h1>`:

```javascript
m("h1", {class: "title"}, "My first app")
```

If you want to have multiple elements:

```javascript
[
	m("h1", {class: "title"}, "My first app"),
	m("button", "A button"),
]
```

And so on:

```javascript
m("main", [
	m("h1", {class: "title"}, "My first app"),
	m("button", "A button"),
])
```

Note: If you prefer `<html>` syntax, [it's possible to use it via a Babel plugin](jsx.md).

```jsx
// HTML syntax via Babel's JSX plugin
<main>
	<h1 class="title">My first app</h1>
	<button>A button</button>
</main>
```

---

### Components

A Mithril component is just an object with a `view` function. Here's the code above as a component:

```javascript
var Hello = {
	view: function() {
		return m("main", [
			m("h1", {class: "title"}, "My first app"),
			m("button", "A button"),
		])
	}
}
```

To activate the component, we use `m.mount`.

```javascript
m.mount(root, Hello)
```

As you would expect, doing so creates this markup:

```markup
<main>
	<h1 class="title">My first app</h1>
	<button>A button</button>
</main>
```

The `m.mount` function is similar to `m.render`, but instead of rendering some HTML only once, it activates Mithril's auto-redrawing system. To understand what that means, let's add some events:

```javascript
var count = 0 // added a variable

var Hello = {
	view: function() {
		return m("main", [
			m("h1", {class: "title"}, "My first app"),
			// changed the next line
			m("button", {onclick: function() {count++}}, count + " clicks"),
		])
	}
}

m.mount(root, Hello)
```

We defined an `onclick` event on the button, which increments a variable `count` (which was declared at the top). We are now also rendering the value of that variable in the button label.

You can now update the label of the button by clicking the button. Since we used `m.mount`, you don't need to manually call `m.render` to apply the changes in the `count` variable to the HTML; Mithril does it for you.

If you're wondering about performance, it turns out Mithril is very fast at rendering updates, because it only touches the parts of the DOM it absolutely needs to. So in our example above, when you click the button, the text in it is the only part of the DOM Mithril actually updates.

---

### Routing

Routing just means going from one screen to another in an application with several screens.

Let's add a splash page that appears before our click counter. First we create a component for it:

```javascript
var Splash = {
	view: function() {
		return m("a", {href: "#!/hello"}, "Enter!")
	}
}
```

As you can see, this component simply renders a link to `#!/hello`. The `#!` part is known as a hashbang, and it's a common convention used in Single Page Applications to indicate that the stuff after it (the `/hello` part) is a route path.

Now that we going to have more than one screen, we use `m.route` instead of `m.mount`.

```javascript
m.route(root, "/splash", {
	"/splash": Splash,
	"/hello": Hello,
})
```

The `m.route` function still has the same auto-redrawing functionality that `m.mount` does, and it also enables URL awareness; in other words, it lets Mithril know what to do when it sees a `#!` in the URL.

The `"/splash"` right after `root` means that's the default route, i.e. if the hashbang in the URL doesn't point to one of the defined routes (`/splash` and `/hello`, in our case), then Mithril redirects to the default route. So if you open the page in a browser and your URL is `http://localhost`, then you get redirected to `http://localhost/#!/splash`.

Also, as you would expect, clicking on the link on the splash page takes you to the click counter screen we created earlier. Notice that now your URL will point to `http://localhost/#!/hello`. You can navigate back and forth to the splash page using the browser's back and next button.

---

### XHR

Basically, XHR is just a way to talk to a server.

Let's change our click counter to make it save data on a server. For the server, we'll use [REM](http://rem-rest-api.herokuapp.com), a mock REST API designed for toy apps like this tutorial.

First we create a function that calls `m.request`. The `url` specifies an endpoint that represents a resource, the `method` specifies the type of action we're taking (typically the `PUT` method [upserts](https://en.wiktionary.org/wiki/upsert)), `data` is the payload that we're sending to the endpoint and `withCredentials` means to enable cookies (a requirement for the REM API to work)

```javascript
var count = 0
var increment = function() {
	m.request({
		method: "PUT",
		url: "//rem-rest-api.herokuapp.com/api/tutorial/1",
		data: {count: count + 1},
		withCredentials: true,
	})
	.then(function(data) {
		count = parseInt(data.count)
	})
}
```

Calling the increment function [upserts](https://en.wiktionary.org/wiki/upsert) an object `{count: 1}` to the `/api/tutorial/1` endpoint. This endpoint returns an object with the same `count` value that was sent to it. Notice that the `count` variable is only updated after the request completes, and it's updated with the response value from the server now.

Let's replace the event handler in the component to call the `increment` function instead of incrementing the `count` variable directly:

```javascript
var Hello = {
	view: function() {
		return m("main", [
			m("h1", {class: "title"}, "My first app"),
			m("button", {onclick: increment}, count + " clicks"),
		])
	}
}
```

Clicking the button should now update the count.

---

We covered how to create and update HTML, how to create components, routes for a Single Page Application, and interacted with a server via XHR.

This should be enough to get you started writing the frontend for a real application. Now that you are comfortable with the basics of the Mithril API, [be sure to check out the simple application tutorial](simple-application.md), which walks you through building a realistic application.
