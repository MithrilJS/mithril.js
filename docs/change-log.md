# Change log

- [v1.1.6](#v116)
- [v1.1.5](#v115)
- [v1.1.4](#v114)
- [v1.1.3](#v113)
- [v1.1.2](#v112)
- [v1.1.1](#v111)
- [v1.1.0](#v110)
- [v1.0.1](#v101)
- [Migrating from v0.2.x](#migrating-from-v02x)
- [Older docs](http://mithril.js.org/archive/v0.2.5/index.html)

---

### v1.1.6

#### Bug fixes

- core: render() function can no longer prevent from changing `document.activeElement` in lifecycle hooks ([#1988](https://github.com/MithrilJS/mithril.js/pull/1988), [@purplecode](https://github.com/purplecode))
- core: don't call `onremove` on the children of components that return null from the view [#1921](https://github.com/MithrilJS/mithril.js/issues/1921) [@octavore](https://github.com/octavore) ([#1922](https://github.com/MithrilJS/mithril.js/pull/1922))
- hypertext: correct handling of shared attributes object passed to `m()`. Will copy attributes when it's necessary [#1941](https://github.com/MithrilJS/mithril.js/issues/1941) [@s-ilya](https://github.com/s-ilya) ([#1942](https://github.com/MithrilJS/mithril.js/pull/1942))

#### Ospec improvements

- ospec v1.4.0
  - Added support for async functions and promises in tests ([#1928](https://github.com/MithrilJS/mithril.js/pull/1928), [@StephanHoyer](https://github.com/StephanHoyer))
  - Error handling for async tests with `done` callbacks supports error as first argument ([#1928](https://github.com/MithrilJS/mithril.js/pull/1928))
  - Error messages which include newline characters do not swallow the stack trace [#1495](https://github.com/MithrilJS/mithril.js/issues/1495) ([#1984](https://github.com/MithrilJS/mithril.js/pull/1984), [@RodericDay](https://github.com/RodericDay))
- ospec v2.0.0 (to be released)
  - Added support for custom reporters ([#2009](https://github.com/MithrilJS/mithril.js/pull/2020))
  - Make Ospec more [Flems](https://flems.io)-friendly ([#2034](https://github.com/MithrilJS/mithril.js/pull/2034))
    - Works either as a global or in CommonJS environments
    - the o.run() report is always printed asynchronously (it could be synchronous before if none of the tests were async).
    - Properly point to the assertion location of async errors [#2036](https://github.com/MithrilJS/mithril.js/issues/2036)
    - expose the default reporter as `o.report(results)`
    - Don't try to access the stack traces in IE9

---

### v1.1.5

#### Bug fixes

- API: If a user sets the Content-Type header within a request's options, that value will be the entire header value rather than being appended to the default value [#1919](https://github.com/MithrilJS/mithril.js/issues/1919) ([#1924](https://github.com/MithrilJS/mithril.js/pull/1924), [@tskillian](https://github.com/tskillian))

---

### v1.1.4

#### Bug fixes

- Fix IE bug where active element is null causing render function to throw error ([#1943](https://github.com/MithrilJS/mithril.js/pull/1943), [@JacksonJN](https://github.com/JacksonJN))

---

### v1.1.3

#### Bug fixes

- move out npm dependencies added by mistake

---

### v1.1.2

#### Bug fixes

- core: Namespace fixes [#1819](https://github.com/MithrilJS/mithril.js/issues/1819), ([#1825](https://github.com/MithrilJS/mithril.js/pull/1825) [@SamuelTilly](https://github.com/SamuelTilly)), [#1820](https://github.com/MithrilJS/mithril.js/issues/1820) ([#1864](https://github.com/MithrilJS/mithril.js/pull/1864)), [#1872](https://github.com/MithrilJS/mithril.js/issues/1872) ([#1873](https://github.com/MithrilJS/mithril.js/pull/1873))
- core: Fix select option to allow empty string value [#1814](https://github.com/MithrilJS/mithril.js/issues/1814) ([#1828](https://github.com/MithrilJS/mithril.js/pull/1828) [@spacejack](https://github.com/spacejack))
- core: Reset e.redraw when it was set to `false` [#1850](https://github.com/MithrilJS/mithril.js/issues/1850) ([#1890](https://github.com/MithrilJS/mithril.js/pull/1890))
- core: differentiate between `{ value: "" }` and `{ value: 0 }` for form elements [#1595 comment](https://github.com/MithrilJS/mithril.js/pull/1595#issuecomment-304071453) ([#1862](https://github.com/MithrilJS/mithril.js/pull/1862))
- core: Don't reset the cursor of textareas in IE10 when setting an identical `value` [#1870](https://github.com/MithrilJS/mithril.js/issues/1870) ([#1871](https://github.com/MithrilJS/mithril.js/pull/1871))
- hypertext: Correct handling of `[value=""]` ([#1843](https://github.com/MithrilJS/mithril.js/issues/1843), [@CreaturesInUnitards](https://github.com/CreaturesInUnitards))
- router: Don't overwrite the options object when redirecting from `onmatch with m.route.set()` [#1857](https://github.com/MithrilJS/mithril.js/issues/1857) ([#1889](https://github.com/MithrilJS/mithril.js/pull/1889))
- stream: Move the "use strict" directive inside the IIFE [#1831](https://github.com/MithrilJS/mithril.js/issues/1831) ([#1893](https://github.com/MithrilJS/mithril.js/pull/1893))

#### Ospec improvements

- Shell command: Ignore hidden directories and files ([#1855](https://github.com/MithrilJS/mithril.js/pull/1855) [@pdfernhout)](https://github.com/pdfernhout))
- Library: Add the possibility to name new test suites ([#1529](https://github.com/MithrilJS/mithril.js/pull/1529))

#### Docs / Repo maintenance

Our thanks to [@0joshuaolson1](https://github.com/0joshuaolson1), [@ACXgit](https://github.com/ACXgit), [@cavemansspa](https://github.com/cavemansspa), [@CreaturesInUnitards](https://github.com/CreaturesInUnitards), [@dlepaux](https://github.com/dlepaux), [@isaaclyman](https://github.com/isaaclyman), [@kevinkace](https://github.com/kevinkace), [@micellius](https://github.com/micellius), [@spacejack](https://github.com/spacejack) and [@yurivish](https://github.com/yurivish)

#### Other

- Addition of a performance regression test suite ([#1789](https://github.com/MithrilJS/mithril.js/issues/1789))

---

### v1.1.1

#### Bug fixes

- hyperscript: Allow `0` as the second argument to `m()` - [#1752](https://github.com/MithrilJS/mithril.js/issues/1752) / [#1753](https://github.com/MithrilJS/mithril.js/pull/1753) ([@StephanHoyer](https://github.com/StephanHoyer))
- hyperscript: restore `attrs.class` handling to what it was in v1.0.1 - [#1764](https://github.com/MithrilJS/mithril.js/issues/1764) / [#1769](https://github.com/MithrilJS/mithril.js/pull/1769)
- documentation improvements ([@JAForbes](https://github.com/JAForbes), [@smuemd](https://github.com/smuemd), [@hankeypancake](https://github.com/hankeypancake))

---

### v1.1.0

#### News

- support for ES6 class components
- support for closure components
- improvements in build and release automation

#### Bug fixes

- fix IE11 input[type] error - [#1610](https://github.com/MithrilJS/mithril.js/issues/1610)
- apply [#1609](https://github.com/MithrilJS/mithril.js/issues/1609) to unkeyed children case
- fix abort detection [#1612](https://github.com/MithrilJS/mithril.js/issues/1612)
- fix input value focus issue when value is loosely equal to old value [#1593](https://github.com/MithrilJS/mithril.js/issues/1593)

---

### v1.0.1

#### News

- performance improvements in IE [#1598](https://github.com/MithrilJS/mithril.js/pull/1598)

#### Bug fixes

- prevent infinite loop in non-existent default route - [#1579](https://github.com/MithrilJS/mithril.js/issues/1579)
- call correct lifecycle methods on children of recycled keyed vnodes - [#1609](https://github.com/MithrilJS/mithril.js/issues/1609)

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
   - [Synchronous redraw removed](#synchronous-redraw-removed)
   - [`m.startComputation`/`m.endComputation` removed](#mstartcomputationmendcomputation-removed)
- [Component `controller` function](#component-controller-function)
- [Component arguments](#component-arguments)
- [`view()` parameters](#view-parameters)
- [Passing components to `m()`](#passing-components-to-m)
- [Passing vnodes to `m.mount()` and `m.route()`](#passing-vnodes-to-mmount-and-mroute)
- [`m.route.mode`](#mroutemode)
- [`m.route` and anchor tags](#mroute-and-anchor-tags)
- [Reading/writing the current route](#readingwriting-the-current-route)
- [Accessing route params](#accessing-route-params)
- [Building/Parsing query strings](#buildingparsing-query-strings)
- [Preventing unmounting](#preventing-unmounting)
- [Run code on component removal](#run-code-on-component-removal)
- [`m.request`](#mrequest)
- [`m.deferred` removed](#mdeferred-removed)
- [`m.sync` removed](#msync-removed)
- [`xlink` namespace required](#xlink-namespace-required)
- [Nested arrays in views](#nested-arrays-in-views)
- [`vnode` equality checks](#vnode-equality-checks)

---

## `m.prop` removed

In `v1.x`, `m.prop()` is now a more powerful stream micro-library, but it's no longer part of core. You can read about how to use the optional Streams module in [the documentation](stream.md).

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
m.component(component)
m(component)
```

### `v1.x`

```javascript
m(component)
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
})
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
    // Called before the node is removed, return a Promise that resolves when
    // ready for the node to be removed from the DOM
    onbeforeremove : function(vnode) { /*...*/ },
    // Called before the node is removed, but after onbeforeremove calls done()
    onremove : function(vnode) { /*...*/ }
})
```

If available the DOM-Element of the vnode can be accessed at `vnode.dom`.

---

## Changes in redraw behaviour

Mithril's rendering engine still operates on the basis of semi-automated global redraws, but some APIs and behaviours differ:

### No more redraw locks

In v0.2.x, Mithril allowed 'redraw locks' which temporarily prevented blocked draw logic: by default, `m.request` would lock the draw loop on execution and unlock when all pending requests had resolved - the same behaviour could be invoked manually using `m.startComputation()` and `m.endComputation()`. The latter APIs and the associated behaviour has been removed in v1.x. Redraw locking can lead to buggy UIs: the concerns of one part of the application should not be allowed to prevent other parts of the view from updating to reflect change.

### Cancelling redraw from event handlers

`m.mount()` and `m.route()` still automatically redraw after a DOM event handler runs. Cancelling these redraws from within your event handlers is now done by setting the `redraw` property on the passed-in event object to `false`.

#### `v0.2.x`

```javascript
m("div", {
    onclick : function(e) {
        m.redraw.strategy("none")
    }
})
```

#### `v1.x`

```javascript
m("div", {
    onclick : function(e) {
        e.redraw = false
    }
})
```

### Synchronous redraw removed

In v0.2.x it was possible to force mithril to redraw immediately by passing a truthy value to `m.redraw()`. This behavior complicated usage of `m.redraw()` and caused some hard-to-reason about issues and has been removed.

#### `v0.2.x`

```javascript
m.redraw(true) // redraws immediately & synchronously
```

#### `v1.x`

```javascript
m.redraw() // schedules a redraw on the next requestAnimationFrame tick
```

### `m.startComputation`/`m.endComputation` removed

They are considered anti-patterns and have a number of problematic edge cases, so they no longer exist in v1.x.

---

## Component `controller` function

In `v1.x` there is no more `controller` property in components, use `oninit` instead.

### `v0.2.x`

```javascript
m.mount(document.body, {
    controller : function() {
        var ctrl = this

        ctrl.fooga = 1
    },

    view : function(ctrl) {
        return m("p", ctrl.fooga)
    }
})
```

### `v1.x`

```javascript
m.mount(document.body, {
    oninit : function(vnode) {
        vnode.state.fooga = 1
    },

    view : function(vnode) {
        return m("p", vnode.state.fooga)
    }
})

// OR

m.mount(document.body, {
    oninit : function(vnode) {
        var state = this  // this is bound to vnode.state by default

        state.fooga = 1
    },

    view : function(vnode) {
        var state = this // this is bound to vnode.state by default

        return m("p", state.fooga)
    }
})
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
}

m("div", m.component(component, { fooga : 1 }))
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
}

m("div", m(component, { fooga : 1 }))
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
})
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
})
```

---

## Passing components to `m()`

In `v0.2.x` you could pass components as the second argument of `m()` w/o any wrapping required. To help with consistency in `v1.x` they must always be wrapped with a `m()` invocation.

### `v0.2.x`

```javascript
m("div", component)
```

### `v1.x`

```javascript
m("div", m(component))
```

---

## Passing vnodes to `m.mount()` and `m.route()`

In `v0.2.x`, `m.mount(element, component)` tolerated [vnodes](vnodes.md) as second arguments instead of [components](components.md) (even though it wasn't documented). Likewise, `m.route(element, defaultRoute, routes)` accepted vnodes as values in the `routes` object.

In `v1.x`, components are required instead in both cases.

### `v0.2.x`

```javascript
m.mount(element, m('i', 'hello'))
m.mount(element, m(Component, attrs))

m.route(element, '/', {
    '/': m('b', 'bye')
})
```

### `v1.x`

```javascript
m.mount(element, {view: function () {return m('i', 'hello')}})
m.mount(element, {view: function () {return m(Component, attrs)}})

m.route(element, '/', {
    '/': {view: function () {return m('b', 'bye')}}
})
```

---

## `m.route.mode`

In `v0.2.x` the routing mode could be set by assigning a string of `"pathname"`, `"hash"`, or `"search"` to `m.route.mode`. In `v.1.x` it is replaced by `m.route.prefix(prefix)` where `prefix` can be `#`, `?`, or an empty string (for "pathname" mode). The new API also supports hashbang (`#!`), which is the default, and it supports non-root pathnames and arbitrary mode variations such as querybang (`?!`)

### `v0.2.x`

```javascript
m.route.mode = "pathname"
m.route.mode = "search"
```

### `v1.x`

```javascript
m.route.prefix("")
m.route.prefix("?")
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
m.route("/other/route")
```

### `v1.x`

```javascript
// Getting the current route
m.route.get()

// Setting a new route
m.route.set("/other/route")
```

---

## Accessing route params

In `v0.2.x` reading route params was entirely handled through `m.route.param()`. This API is still available in `v1.x`, and additionally any route params are passed as properties in the `attrs` object on the vnode.

### `v0.2.x`

```javascript
m.route(document.body, "/booga", {
    "/:attr" : {
        controller : function() {
            m.route.param("attr") // "booga"
        },
        view : function() {
            m.route.param("attr") // "booga"
        }
    }
})
```

### `v1.x`

```javascript
m.route(document.body, "/booga", {
    "/:attr" : {
        oninit : function(vnode) {
            vnode.attrs.attr // "booga"
            m.route.param("attr") // "booga"
        },
        view : function(vnode) {
            vnode.attrs.attr // "booga"
            m.route.param("attr") // "booga"
        }
    }
})
```

---

## Building/Parsing query strings

`v0.2.x` used methods hanging off of `m.route`, `m.route.buildQueryString()` and `m.route.parseQueryString()`. In `v1.x` these have been broken out and attached to the root `m`.

### `v0.2.x`

```javascript
var qs = m.route.buildQueryString({ a : 1 });

var obj = m.route.parseQueryString("a=1");
```

### `v1.x`

```javascript
var qs = m.buildQueryString({ a : 1 });

var obj = m.parseQueryString("a=1");
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

## Run code on component removal

Components no longer call `this.onunload` when they are being removed. They now use the standardized lifecycle hook `onremove`.

### `v0.2.x`

```javascript
var Component = {
    controller: function() {
        this.onunload = function(e) {
            // ...
        }
    },
    view: function() {
        // ...
    }
}
```

### `v1.x`

```javascript
var Component = {
    onremove : function() {
        // ...
    }
    view: function() {
        // ...
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

Additionally, if the `extract` option is passed to `m.request` the return value of the provided function will be used directly to resolve the request promise, and the `deserialize` callback is ignored.

---

## `m.deferred` removed

`v0.2.x` used its own custom asynchronous contract object, exposed as `m.deferred`, which was used as the basis for `m.request`. `v1.x` uses Promises instead, and implements a [polyfill](promises.md) in non-supporting environments. In situations where you would have used `m.deferred`, you should use Promises instead.

### `v0.2.x`

```javascript
var greetAsync = function() {
    var deferred = m.deferred()
    setTimeout(function() {
        deferred.resolve("hello")
    }, 1000)
    return deferred.promise
}

greetAsync()
    .then(function(value) {return value + " world"})
    .then(function(value) {console.log(value)}) //logs "hello world" after 1 second
```

### `v1.x`

```javascript
var greetAsync = function() {
    return new Promise(function(resolve){
        setTimeout(function() {
            resolve("hello")
        }, 1000)
    })
}

greetAsync()
    .then(function(value) {return value + " world"})
    .then(function(value) {console.log(value)}) //logs "hello world" after 1 second
```

---

## `m.sync` removed

Since `v1.x` uses standards-compliant Promises, `m.sync` is redundant. Use `Promise.all` instead.

### `v0.2.x`

```javascript
m.sync([
    m.request({ method: 'GET', url: 'https://api.github.com/users/lhorie' }),
    m.request({ method: 'GET', url: 'https://api.github.com/users/isiahmeadows' }),
])
.then(function (users) {
    console.log("Contributors:", users[0].name, "and", users[1].name)
})
```

### `v1.x`

```javascript
Promise.all([
    m.request({ method: 'GET', url: 'https://api.github.com/users/lhorie' }),
    m.request({ method: 'GET', url: 'https://api.github.com/users/isiahmeadows' }),
])
.then(function (users) {
    console.log("Contributors:", users[0].name, "and", users[1].name)
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
