## Change Log

[v0.1.4](/mithril/archive/v0.1.3) - maintenance

### Bug Fixes:

-	URLs with port numbers are now handled correctly [#40](https://github.com/lhorie/mithril.js/issues/40)
-	NPM package now contains unminified version for map files [#39](https://github.com/lhorie/mithril.js/issues/39)

[v0.1.3](/mithril/archive/v0.1.3) - maintenance

### News:

-	Mithril is now available via [Component](http://component.io)
-	There's now an extra low-level optimization hook called a SubtreeDirective, which allows implementing plugins that only create virtual trees if necessary.

### Bug Fixes:

-	diff no longer touch the DOM when processing `style` attributes and event handlers
-	returning a thennable to a resolution callback in `m.deferred().promise` now causes the promise to adopt its state 
-	diff now correctly clears subtree if null or undefined is passed as a node

---

[v0.1.2](/mithril/archive/v0.1.2) - maintenance

### News:

-	There's now a [community mailing list](mailto:mithriljs@googlegroups.com). There's also a [web interface](https://groups.google.com/forum/#!forum/mithriljs)
-	Mithril is now on Travis CI. The build status can be found in the [project homepage](https://github.com/lhorie/mithril.js)
-	Mithril is now available via the CommonJS and AMD API
-	Mithril can now [be installed via npm and bower](installation.md)

### Bug Fixes:

-	`m.render` now correctly reattaches reused DOM elements to replaced parent nodes [#31](https://github.com/lhorie/mithril.js/issues/31)
-	UI actions that can potentially de-synchronize the DOM from cache now force synchronization [#29](https://github.com/lhorie/mithril.js/issues/29)

---

[v0.1.1](/mithril/archive/v0.1.1) - maintenance

### News:

-	Mithril is now available at [cdnjs](http://cdnjs.com/libraries/mithril/) and [jsdelivr](http://www.jsdelivr.com/#!mithril)

### Bug Fixes:

-	`m.route.param` now resets on route change correctly [#15](https://github.com/lhorie/mithril.js/issues/15)
-	`m.render` now correctly ignores undefined values in the virtual tree[#16](https://github.com/lhorie/mithril.js/issues/16)
-	errors thrown in promises now cause downstreams to be rejected [#1](https://github.com/lhorie/mithril.js/issues/1)

### Breaking changes:

-	changed default value for `xhr.withCredentials` from `true` to `false` for `m.request`, since public APIs are more common than auth-walled ones. [#14](https://github.com/lhorie/mithril.js/issues/14)

	In order to configure this flag, the following configuration should be used:
	
	```javascript
	var privateAPI = function(xhr) {xhr.withCredentials = true};
	
	m.request({method: "GET", url: "http://foo.com/api", config: privateAPI});
	```

---

[v0.1](/mithril/archive/v0.1) - Initial release