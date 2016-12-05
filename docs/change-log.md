# Change log

- [Migrating from v0.2.x](#migrating-from-v02x)

---

### Migrating from `v0.2.x`

`v1.x` is largely API-compatible with `v0.2.x`, but there are some breaking changes.

If you are migrating, consider using the [mithril-codemods](https://www.npmjs.com/package/mithril-codemods) tool to help automate the most straightforward migrations.

- [`m.prop` removed](#mprop-removed)
- [`m.component` removed](#mcomponent-removed)
- [`config` function](#config-function)
- [Changes in redraw behaviour](#changes-in-redraw-behaviour)
   - [No more redraw locks](#no-more-redraw-locks)
   - [Cancelling redraw from event handlers](#cancelling-redraw-from-event-handlers)
- [Component `controller` function](#component-controller-function)
- [Component arguments](#component-arguments)
- [`view()` parameters](#view-parameters)
- [Passing components to `m()`](#passing-components-to-m)
- [Passing vnodes to `m.mount()` and `m.route()`](#passing-vnodes-to-mmount-and-mroute)
- [`m.route.mode`](#mroutemode)
- [`m.route` and anchor tags](#mroute-and-anchor-tags)
- [Reading/writing the current route](#readingwriting-the-current-route)
- [Accessing route params](#accessing-route-params)
- [Preventing unmounting](#preventing-unmounting)
- [`m.request`](#mrequest)
- [`m.sync` removed](#msync-removed)
- [`xlink` namespace required](#xlink-namespace-required)
- [Nested arrays in views](#nested-arrays-in-views)
- [`vnode` equality checks](#vnode-equality-checks)
- [`m.startComputation`/`m.endComputation` removed](#mstartcomputationmendcomputation-removed)
- [Synchronous redraw removed](#synchronous-redraw-removed)

---

## `m.prop` removed

In `v1.x`, `m.prop()` is now a more powerful stream micro-library, but it's no longer part of core.

### `v0.2.x`

```javascript
var m = require("mithril")

var num = m.prop(1)
```

### `v1.x`

```javascript
var m = require("mithril")
var prop = require("mithril/stream")

var num = prop(1)
var doubled = num.map(function(n) {return n * 2})
```

---

## `m.component` removed

In `v0.2.x` components could be created using either `m(component)` or `m.component(component)`. `v1.x` only supports `m(component)`.

### `v0.2.x`

```javascript
// These are equivalent
m.component(component);
m(component);
```

### `v1.x`

```javascript
m(component);
```

---

## `config` function

In `v0.2.x` mithril provided a single lifecycle method, `config`. `v1.x` provides much more fine-grained control over the lifecycle of a vnode.

### `v0.2.x`

```javascript
m("div", {
    config : function(element, isInitialized) {
        // runs on each redraw
        // isInitialized is a boolean representing if the node has been added to the DOM
    }
});
```

### `v1.x`

More documentation on these new methods is available in [lifecycle-methods.md](lifecycle-methods.md).

```javascript
m("div", {
    // Called before the DOM node is created
    oninit : function(vnode) { /*...*/ },
    // Called after the DOM node is created
    oncreate : function(vnode) { /*...*/ },
    // Called before the node is updated, return false to cancel
    onbeforeupdate : function(vnode, old) { /*...*/ },
    // Called after the node is updated
    onupdate : function(vnode) { /*...*/ },
    // Called before the node is removed, call done() when ready for the node to be removed from the DOM
    onbeforeremove : function(vnode, done) { /*...*/ },
    // Called before the node is removed, but after onbeforeremove calls done()
    onremove : function(vnode) { /*...*/ }
});
```

If available the DOM-Element of the vnode can be accessed at `vnode.dom`.

---

## Changes in redraw behaviour

Mithril's rendering engine still operates on the basis of semi-automated global redraws, but some APIs and behaviours differ:

### No more redraw locks

In v0.2.x, Mithril allowed 'redraw locks' which temporarily prevented blocked draw logic: by default, `m.request` would lock the draw loop on execution and unlock when all pending requests had resolved - the same behaviour could be invoked manually using `m.startComputation()` and `m.endComputation()`. The latter APIs and the associated behaviour has been removed in v1.x. Redraw locking can lead to buggy UIs: the concerns of one part of the application should not be allowed to prevent other parts of the view from updating to reflect change.

### Cancelling redraw from event handlers

`m.mount()` and `m.route()` still automatically redraw after a DOM event handler runs. Cancelling these redraws from within your event handlers is now done by setting the `redraw` property on the passed-in event object to `false`.

### `v0.2.x`

```javascript
m("div", {
    onclick : function(e) {
        m.redraw.strategy("none");
    }
})
```

### `v1.x`

```javascript
m("div", {
    onclick : function(e) {
        e.redraw = false;
    }
})
```

---

## Component `controller` function

In `v1.x` there is no more `controller` property in components, use `oninit` instead.

### `v0.2.x`

```javascript
m.mount(document.body, {
    controller : function() {
        var ctrl = this;

        ctrl.fooga = 1;
    },

    view : function(ctrl) {
        return m("p", ctrl.fooga);
    }
});
```

### `v1.x`

```javascript
m.mount(document.body, {
    oninit : function(vnode) {
        vnode.state.fooga = 1;
    },

    view : function(vnode) {
        return m("p", vnode.state.fooga);
    }
});

// OR

m.mount(document.body, {
    oninit : function(vnode) {
        var state = this;  // this is bound to vnode.state by default

        state.fooga = 1;
    },

    view : function(vnode) {
        var state = this; // this is bound to vnode.state by default

        return m("p", state.fooga);
    }
});
```

---

## Component arguments

Arguments to a component in `v1.x` must be an object, simple values like `String`/`Number`/`Boolean` will be treated as text children. Arguments are accessed within the component by reading them from the `vnode.attrs` object.

### `v0.2.x`

```javascript
var component = {
    controller : function(options) {
        // options.fooga === 1
    },

    view : function(ctrl, options) {
        // options.fooga == 1
    }
};

m("div", m.component(component, { fooga : 1 }));
```

### `v1.x`

```javascript
var component = {
    oninit : function(vnode) {
        // vnode.attrs.fooga === 1
    },

    view : function(vnode) {
        // vnode.attrs.fooga == 1
    }
};

m("div", m(component, { fooga : 1 }));
```

---

## `view()` parameters

In `v0.2.x` view functions are passed a reference to the `controller` instance and (optionally) any options passed to the component. In `v1.x` they are passed **only** the `vnode`, exactly like the `controller` function.

### `v0.2.x`

```javascript
m.mount(document.body, {
    controller : function() {},

    view : function(ctrl, options) {
        // ...
    }
});
```

### `v1.x`

```javascript
m.mount(document.body, {
    oninit : function(vnode) {
        // ...
    },

    view : function(vnode) {
        // Use vnode.state instead of ctrl
        // Use vnode.attrs instead of options
    }
});
```

---

## Passing components to `m()`

In `v0.2.x` you could pass components as the second argument of `m()` w/o any wrapping required. To help with consistency in `v1.x` they must always be wrapped with a `m()` invocation.

### `v0.2.x`

```javascript
m("div", component);
```

### `v1.x`

```javascript
m("div", m(component));
```

---

## Passing vnodes to `m.mount()` and `m.route()`

In `v0.2.x`, `m.mount(element, component)` tolerated [vnodes](vnodes.md) as second arguments instead of [components](components.md) (even though it wasn't documented). Likewise, `m.route(element, defaultRoute, routes)` accepted vnodes as values in the `routes` object.

In `v1.x`, components are required instead in both cases.

### `v0.2.x`

```javascript
m.mount(element, m('i', 'hello'));
m.mount(element, m(Component, attrs));

m.route(element, '/', {
    '/': m('b', 'bye')
})
```

### `v1.x`

```javascript
m.mount(element, {view: function () {return m('i', 'hello')}});
m.mount(element, {view: function () {return m(Component, attrs)}});

m.route(element, '/', {
    '/': {view: function () {return m('b', 'bye')}}
})
```

---

## `m.route.mode`

In `v0.2.x` the routing mode could be set by assigning a string of `"pathname"`, `"hash"`, or `"search"` to `m.route.mode`. In `v.1.x` it is replaced by `m.route.prefix(prefix)` where `prefix` can be `#`, `?`, or an empty string (for "pathname" mode). The new API also supports hashbang (`#!`), which is the default, and it supports non-root pathnames and arbitrary mode variations such as querybang (`?!`)

### `v0.2.x`

```javascript
m.route.mode = "pathname";
m.route.mode = "search";
```

### `v1.x`

```javascript
m.route.prefix("");
m.route.prefix("?");
```

---

## `m.route()` and anchor tags

Handling clicks on anchor tags via the mithril router is similar to `v0.2.x` but uses a new lifecycle method and API.

### `v0.2.x`

```javascript
// When clicked this link will load the "/path" route instead of navigating
m("a", {
    href   : "/path",
    config : m.route
})
```

### `v1.x`

```javascript
// When clicked this link will load the "/path" route instead of navigating
m("a", {
    href     : "/path",
    oncreate : m.route.link
})
```

---

## Reading/writing the current route

In `v0.2.x` all interaction w/ the current route happened via `m.route()`. In `v1.x` this has been broken out into two functions.

### `v0.2.x`

```javascript
// Getting the current route
m.route()

// Setting a new route
m.route("/other/route");
```

### `v1.x`

```javascript
// Getting the current route
m.route.get();

// Setting a new route
m.route.set("/other/route");
```

---

## Accessing route params

In `v0.2.x` reading route params was all handled through the `m.route.param()` method. In `v1.x` any route params are passed as the `attrs` object on the vnode passed as the first argument to lifecycle methods/`view`.

### `v0.2.x`

```javascript
m.route(document.body, "/booga", {
    "/:attr" : {
        view : function() {
            m.route.param("attr"); // "booga"
        }
    }
});
```

### `v1.x`

```javascript
m.route(document.body, "/booga", {
    "/:attr" : {
        oninit : function(vnode) {
            vnode.attrs.attr; // "booga"
        },
        view : function(vnode) {
            vnode.attrs.attr; // "booga"
        }
    }
});
```

---

## Preventing unmounting

It is no longer possible to prevent unmounting via `onunload`'s `e.preventDefault()`. Instead you should explicitly call `m.route.set` when the expected conditions are met.

### `v0.2.x`

```javascript
var Component = {
	controller: function() {
		this.onunload = function(e) {
			if (condition) e.preventDefault()
		}
	},
	view: function() {
		return m("a[href=/]", {config: m.route})
	}
}
```

### `v1.x`

```javascript
var Component = {
	view: function() {
		return m("a", {onclick: function() {if (!condition) m.route.set("/")}})
	}
}
```

---

## m.request

Promises returned by [m.request](request.md) are no longer `m.prop` getter-setters. In addition, `initialValue`, `unwrapSuccess` and `unwrapError` are no longer supported options.

In addition, requests no longer have `m.startComputation`/`m.endComputation` semantics. Instead, redraws are always triggered when a request promise chain completes (unless `background:true` is set).

### `v0.2.x`

```javascript
var data = m.request({
	method: "GET",
	url: "https://api.github.com/",
	initialValue: [],
})

setTimeout(function() {
	console.log(data())
}, 1000)
```

### `v1.x`

```javascript
var data = []
m.request({
	method: "GET",
	url: "https://api.github.com/",
})
.then(function (responseBody) {
	data = responseBody
})

setTimeout(function() {
	console.log(data) // note: not a getter-setter
}, 1000)
```

Additionally, if the `extract` option is passed to `m.request` the return value of the provided function will be used directly to resolve its promise, and the `deserialize` callback is ignored.

---

## `m.sync` removed

`m.sync` has been removed in favor of `Promise.all`

### `v0.2.x`

```javascript
m.sync([
    m.request({ method: 'GET', url: 'https://api.github.com/users/lhorie' }),
    m.request({ method: 'GET', url: 'https://api.github.com/users/isiahmeadows' }),
])
.then(function (users) {
	console.log("Contributors:", users[0].name, "and", users[1].name);
})
```

### `v1.x`

```javascript
Promise.all([
    m.request({ method: 'GET', url: 'https://api.github.com/users/lhorie' }),
    m.request({ method: 'GET', url: 'https://api.github.com/users/isiahmeadows' }),
])
.then(function (users) {
	console.log("Contributors:", users[0].name, "and", users[1].name);
})
```

---

## `xlink` namespace required

In `v0.2.x`, the `xlink` namespace was the only supported attribute namespace, and it was supported via special casing behavior. Now namespace parsing is fully supported, and namespaced attributes should explicitly declare their namespace.

### `v0.2.x`

```javascript
m("svg",
    // the `href` attribute is namespaced automatically
	m("image[href='image.gif']")
)
```

### `v1.x`

```javascript
m("svg",
    // User-specified namespace on the `href` attribute
	m("image[xlink:href='image.gif']")
)
```

---

## Nested arrays in views

Arrays now represent [fragments](fragment.md), which are structurally significant in v1.x virtual DOM. Whereas nested arrays in v0.2.x would be flattened into one continuous list of virtual nodes for the purposes of diffing, v1.x preserves the array structure - the children of any given array are not considered siblings of those of adjacent arrays.

---

## `vnode` equality checks

If a vnode is strictly equal to the vnode occupying its place in the last draw, v1.x will skip that part of the tree without checking for mutations or triggering any lifecycle methods in the subtree. The component documentation contains [more detail on this issue](components.md#avoid-creating-component-instances-outside-views).

---

## `m.startComputation`/`m.endComputation` removed

They are considered anti-patterns and have a number of problematic edge cases, so they no longer exist in v1.x

---

## Synchronous redraw removed

In v0.2.x it was possible to force mithril to redraw immediately by passing a truthy value to `m.redraw()`. This behavior complicated usage of `m.redraw()` and caused some hard-to-reason about issues and has been removed.

### `v0.2.x`

```javascript
m.redraw(true); // redraws immediately & synchronously
```

### `v1.x`

```javascript
m.redraw(); // schedules a redraw on the next requestAnimationFrame tick
```
