## Change Log

[v0.1.12](/mithril/archive/v0.1.12) - maintenance

### News:

-	It's now possible to define [variadic routes](mithril.route.md#variadic-routes) [#70](https://github.com/lhorie/mithril.js/issues/70)

### Bug Fixes:

-	Fix link location in links using `config: m.route` after redraws [#74](https://github.com/lhorie/mithril.js/issues/74)
-	Fixed support for `list` attribute in inputs [#69](https://github.com/lhorie/mithril.js/issues/69)

---


[v0.1.11](/mithril/archive/v0.1.11) - maintenance

### News:

-	Added `m.route()` overload to allow reading of current route [#61](https://github.com/lhorie/mithril.js/issues/61)
-	Added `background` option to `m.request` to allow requests that don't affect rendering [#62](https://github.com/lhorie/mithril.js/issues/62)

### Bug Fixes:

-	Links using `config: m.route` can now be opened in new tab correctly [#64](https://github.com/lhorie/mithril.js/issues/64)
-	Fixed diff within contenteditable areas [#65](https://github.com/lhorie/mithril.js/issues/65)

---

[v0.1.10](/mithril/archive/v0.1.10) - maintenance

### News:

-	Added social buttons to homepage

### Bug Fixes:

-	Bi-directional bindings no longer wipe out cursor position in Chrome [#58](https://github.com/lhorie/mithril.js/issues/58)

---

[v0.1.9](/mithril/archive/v0.1.9) - maintenance

### News:

-	Added comparison with React to homepage
-	Added support for multi-island apps [#34](https://github.com/lhorie/mithril.js/issues/34)
-	m.prop is now JSON-serializable [#54](https://github.com/lhorie/mithril.js/issues/54)
-	Added `extract` option to `m.request` to allow access to response metadata [#53](https://github.com/lhorie/mithril.js/issues/53)

### Bug Fixes:

-	Fixed node index displacement by null/undefined nodes [#56](https://github.com/lhorie/mithril.js/issues/56)
-	Fixed mock's insertBefore and appendChild when dealing w/ reattachments

### Breaking changes:

-	changing an id in a  virtual element now recreates the element, instead of recycling it [#55](https://github.com/lhorie/mithril.js/issues/55)

---

[v0.1.8](/mithril/archive/v0.1.8) - maintenance

### News:

-	Mock now contains a basic `insertAdjacentHTML` implementation to enable better testing of `m.trust` / `m.render` interactions

### Bug Fixes:

-	Fixed ordering bug in deep subchildren [#51](https://github.com/lhorie/mithril.js/issues/51)
-	Fixed ordering bug with trusted strings [#51](https://github.com/lhorie/mithril.js/issues/51)

---

[v0.1.7](/mithril/archive/v0.1.7) - maintenance

### News:

-	Mithril will be on a accelerated release cycle for the rest of the v0.1.x series. This means CDNs may lag behind in versions, so it's recommended that you either use one of the supported NodeJS package managers or fork from the Github repo directly. More information can be found [here](https://groups.google.com/forum/#!msg/mithriljs/mc0qTgFTlgs/OD7Mc7_2Wa4J)

### Bug Fixes:

-	Fixed ordering bug when virtual element is preceded by array [#50](https://github.com/lhorie/mithril.js/issues/50)

---

[v0.1.6](/mithril/archive/v0.1.6) - maintenance

### Bug Fixes:

-	Fixed serious bug when mixing cached text nodes with new virtual elements [#49](https://github.com/lhorie/mithril.js/issues/49)

---

[v0.1.5](/mithril/archive/v0.1.5) - maintenance

### News:

-	Launched the [Mithril Blog](http://lhorie.github.io/mithril-blog)

### Bug Fixes:

-	Fixed serious ordering problem when mixing arrays with virtual elements [#48](https://github.com/lhorie/mithril.js/issues/48)

---

[v0.1.4](/mithril/archive/v0.1.4) - maintenance

### News:

-	added regression tests for reported bugs
-	added support for SVG

### Bug Fixes:

-	URLs with port numbers are now handled correctly [#40](https://github.com/lhorie/mithril.js/issues/40)
-	NPM package now contains unminified version for map files [#39](https://github.com/lhorie/mithril.js/issues/39)
-	fixed ordering issue when mixing newly created virtual elements with elements from cache [#44](https://github.com/lhorie/mithril.js/issues/44)
-	fixed caching bug in links w/ config option attached [#43](https://github.com/lhorie/mithril.js/issues/43)
-	fixed attribute update bug when an element has both `oninput` and `onkeydown` handlers [#36](https://github.com/lhorie/mithril.js/issues/36)

---

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