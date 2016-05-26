## Change Log

[v0.2.5](http://mithril.js.org/archive/v0.2.5)

### News:

-	performance improvements in IE (thanks to @gyandeeps)
-	m.request now has a `callbackName` option to specify the name of the javascript function that gets called on JSONP response [#1072](https://github.com/lhorie/mithril.js/issues/1072)

### Bug Fixes:

-	fix active form element syncing [#691](https://github.com/lhorie/mithril.js/issues/691)
-	ignore url interpolations without value in m.request [#1039](https://github.com/lhorie/mithril.js/issues/1039)
-	fixed native promise absorption in `m.prop` [#1076](https://github.com/lhorie/mithril.js/issues/1076)

---

[v0.2.4](http://mithril.js.org/archive/v0.2.4)

### Bug Fixes:

-	fix regression that caused errors to be swallowed in promises returned by m.request [#968](https://github.com/lhorie/mithril.js/issues/968)
-	fix ReferenceError when calling an event handler via mithril-query without an event argument

---

[v0.2.3](http://mithril.js.org/archive/v0.2.3)

### Bug Fixes:

-	fix regression that prevented string keys
-	fix handling of read-only attributes [#925](https://github.com/lhorie/mithril.js/issues/925)
-	fix double unloading issue [#931](https://github.com/lhorie/mithril.js/issues/931)

---

[v0.2.2-rc.1](http://mithril.js.org/archive/v0.2.2-rc.1)

### Bug Fixes:

-	revert regressions from 0.2.1 refactor
-	revert `finally` because it's not in the ES6 promise spec

---

[v0.2.1](http://mithril.js.org/archive/v0.2.1)

**IMPORTANT NOTE: Due to some unfortunate factors, 0.2.1 is not a stable release. Please use either 0.2.0 or latest instead**

### News:

-	large refactor to take better advantage of Chrome js optimizations and improve source code readability (thanks to @isiahmeadows)
-	added `catch` to promises
-	improvements and fixes in the documentation and wiki
-	`m(component, ...args)` can now be used as a shorthand for `m.component(component, ...args)`

### Bug Fixes:

-	errors thrown from the exception monitor no longer freeze redrawing
-	fix edge case with falsy keys
-	fix controller prototype inheritance in component controllers
-	fix return value of `parseQueryString` if input is empty string

---

[v0.2.0](http://mithril.js.org/archive/v0.2.0) - improved components

### News:

-	Mithril modules will be referred to as *components* from now on.
-	Virtual DOM tree can now contain [components](mithril.component.md)
-	Components can now be parameterized via `m.component`

### Deprecations:

-	`m.module` has been renamed `m.mount`. Calling `m.module` will still work, but should be considered deprecated. Rationale: Mithril modules and components are the same thing, therefore from now on, they will be referred to as components, since that name is more descriptive of their purpose, and causes less confusion in the face of ES6 modules.

	In order to migrate, search for `m.module` calls and replace them with `m.mount`. The method signature is the same.

### Bug Fixes:

-	fix diff edge case in `<select>` [#569](https://github.com/lhorie/mithril.js/issues/569)
-	fix support for arrays in template compiler

---

[v0.1.34](http://mithril.js.org/archive/v0.1.34) - maintenance

### Bug Fixes:

-	fix identity bug when mixing unkeyable elements in a tree [#524](https://github.com/lhorie/mithril.js/issues/524)

---

[v0.1.33](http://mithril.js.org/archive/v0.1.33) - maintenance

### Bug Fixes:

-	fix diff bug when mixing `undefined` in a tree [#524](https://github.com/lhorie/mithril.js/issues/524)
-	fix reference to map file in package.json for cdnjs
-	fix links in documentation

---

[v0.1.32](http://mithril.js.org/archive/v0.1.32) - maintenance

### Bug Fixes:

-	fix regression caused by [#454](https://github.com/lhorie/mithril.js/issues/454)

---

[v0.1.31](http://mithril.js.org/archive/v0.1.31) - maintenance

### News:

-	Typescript definitions are more strongly typed
-	m.request's `unwrapSuccess` and `unwrapError` callbacks now receive the XMLHttpRequest instance as a second parameter
-	3rd parameter for `m.route(route, params, shouldReplaceHistory)` is now public
-	exact routes now have higher precedence than routes w/ variables [#452](https://github.com/lhorie/mithril.js/issues/452)
-	there's now a `retain` flag to control on-route-change diff strategy on a per-element basis

### Bug Fixes:

-	fix routing bug in IE9 [#320](https://github.com/lhorie/mithril.js/issues/320)
-	fix ordering bug in m.trust when using HTML entities [#453](https://github.com/lhorie/mithril.js/issues/453)
-	set promise's default value to initialValue if coming from m.request [#454](https://github.com/lhorie/mithril.js/issues/454)
-	fix dom element ownership bug when mixing keyed elements and third party plugin elements [#463](https://github.com/lhorie/mithril.js/issues/463)
-	fix edge case in flatten algorithm [#448](https://github.com/lhorie/mithril.js/issues/448)
-	prevent unnecessary DOM move operation when mixing keyed and unkeyed elements [#398](https://github.com/lhorie/mithril.js/issues/398)
-	revert [#382](https://github.com/lhorie/mithril.js/issues/382) due to diff regression [#512](https://github.com/lhorie/mithril.js/issues/512)

---

[v0.1.30](http://mithril.js.org/archive/v0.1.30) - maintenance

### Bug Fixes:

-	fix history.back() regression [#435](https://github.com/lhorie/mithril.js/issues/435)
-	fix module.view's `this` association regression in Haxe environment [#434](https://github.com/lhorie/mithril.js/issues/434)
-	fix array serialization syntax in querystrings [#440](https://github.com/lhorie/mithril.js/issues/440)

---

[v0.1.29](http://mithril.js.org/archive/v0.1.29) - maintenance

### News:

-	Calling m.module without a module now unloads the current one [#420](https://github.com/lhorie/mithril.js/issues/420)
-	Both `controller` and `view` properties in modules are now optional

### Bug Fixes:

-	prevent empty class attributes [#382](https://github.com/lhorie/mithril.js/issues/382)
-	array-to-querystring serialization in `m.request` now behaves like jQuery [#426](https://github.com/lhorie/mithril.js/issues/426)
-	fix querystring detection bug in pathname mode [#425](https://github.com/lhorie/mithril.js/issues/425)
-	don't add history entry if reloading from a link [#428](https://github.com/lhorie/mithril.js/issues/428)
-	fix key association when DOM order is modified by external code [#424](https://github.com/lhorie/mithril.js/issues/424)

---

[v0.1.28](http://mithril.js.org/archive/v0.1.28) - maintenance

### News:

-	Landed some performance improvements

### Bug Fixes:

-	throw error if root element is null in m.module/m.route [#388](https://github.com/lhorie/mithril.js/issues/388)

---

[v0.1.27](http://mithril.js.org/archive/v0.1.27) - maintenance

### Bug Fixes:

-	prevent strategy("none") event contamination [#378](https://github.com/lhorie/mithril.js/issues/378)
-	fix equality strictness [#379](https://github.com/lhorie/mithril.js/issues/379)
-	fix keys bug when list has nulls [#299](https://github.com/lhorie/mithril.js/issues/299)
-	make sure empty value in option tag creates attribute [#380](https://github.com/lhorie/mithril.js/issues/380)

---

[v0.1.26](http://mithril.js.org/archive/v0.1.26) - maintenance

### Bug Fixes:

-	make sure input[type] is CSS-targetable [#364](https://github.com/lhorie/mithril.js/issues/364)
-	throw error if m.route.param is called before initializing routes [#361](https://github.com/lhorie/mithril.js/issues/361)

---

[v0.1.25](http://mithril.js.org/archive/v0.1.25) - maintenance

### Bug Fixes:

-	fixed input cursor jumping regression
-	fixed interop bug when QUnit and AMD are used at the same time [#355](https://github.com/lhorie/mithril.js/issues/355)
-	fixed route arg duplication in edge case [#352](https://github.com/lhorie/mithril.js/issues/352)
-	prevented meaningless error in Chrome edge case [#358](https://github.com/lhorie/mithril.js/issues/358)

---

[v0.1.24](http://mithril.js.org/archive/v0.1.24) - maintenance

### Bug Fixes:

-	Prevent rogue `is` attribute from being created in Chrome
-	Fix `data` regression in `m.request`

---

[v0.1.23](http://mithril.js.org/archive/v0.1.23) - maintenance

### News:

-	There's now support for extended custom elements (e.g. `m("button[is=my-button]")`)
-	`m.request` now supports a `initialValue` option to help prevent type errors in views when using the `background` option

### Bug Fixes:

-	docs now have anchor links for easier navigation
-	fixed a bunch of IE8 issues [#298](https://github.com/lhorie/mithril.js/issues/298)
-	fixed handling of `method` option in JSONP mode [#292](https://github.com/lhorie/mithril.js/issues/292)
-	fixed source map files
-	fixed handling of select[multiple]
-	fixed template compiler edge case [#286](https://github.com/lhorie/mithril.js/issues/286)
-	fixed pathname bug in m.route [#290](https://github.com/lhorie/mithril.js/issues/290)
-	fixed pathname querystring bug in routed links [#304](https://github.com/lhorie/mithril.js/issues/304)
-	fixed handling of value in inputs when model value is not in sync with input value [#336](https://github.com/lhorie/mithril.js/issues/336)

---

[v0.1.22](http://mithril.js.org/archive/v0.1.22) - maintenance

### News:

-	docs now have anchor links for easier navigation
-	there is more documentation for things that weren't that clear
-	json-p support added
-	`m()` now supports splat for children (e.g. `m("div", m("a"), m("b"), m("i"))` for nicer Coffeescript syntax
-	by popular demand, `m.module` now returns a controller instance

### Bug Fixes:

-	gracefully degrade on IE exceptions when setting invalid values
-	fixes for Typescript definition file
-	fixed bug in keys algorithm when mixing keyed and unkeyed elements [#246](https://github.com/lhorie/mithril.js/issues/246)
-	added promise exception monitor and reverted promise exception handling semantics to v0.1.19 semantics (see [docs](mithril.deferred.md#unchecked-error-handling))
-	fixed redraw scheduling bug in old version of IE
-	fixed incorrect diff when document is root, and html element is omitted
-	fixed querystring clobbering in links w/ config:m.route [#261](https://github.com/lhorie/mithril.js/issues/261)
-	fixed rare bug that made events get dropped [#214](https://github.com/lhorie/mithril.js/issues/214)
-	don't send Content-Type header if there's no request data [#280](https://github.com/lhorie/mithril.js/issues/280)

---

[v0.1.21](http://mithril.js.org/archive/v0.1.21) - maintenance

### News:

-	passing a promise to an `m.prop` now populates it with the resolved value upon resolution, and returns `undefined` otherwise
-	`m.redraw` can now be forced to called synchronously

### Bug Fixes:

-	fixed handling of `+` character in `m.route.param` [#204](https://github.com/lhorie/mithril.js/issues/204)
-	fixed corner case for undefined children in diff [#206](https://github.com/lhorie/mithril.js/issues/206)
-	fixed context.onunload for array items [#200](https://github.com/lhorie/mithril.js/issues/200)
-	fixed handling on comments in HTML converter tool

---

[v0.1.20](http://mithril.js.org/archive/v0.1.20) - maintenance

### News:

-	redraw strategy can now be modified via `m.redraw.strategy`
-	`math` tags now automatically get created with the MathML namespace

### Bug Fixes:

-	fixed IE8 null reference exception in `m`
-	fixed IE8 empty-text-node-in-input issue [#195](https://github.com/lhorie/mithril.js/issues/195)
-	fixed `m.sync` resolution when passed an empty array [#191](https://github.com/lhorie/mithril.js/issues/191)

---

[v0.1.19](http://mithril.js.org/archive/v0.1.19) - maintenance

### Bug Fixes:

-	fixed double redraw when events fire simultaneously [#151](https://github.com/lhorie/mithril.js/issues/151)
-	fixed node insertion bug when using document as root [#153](https://github.com/lhorie/mithril.js/issues/153)
-	prevent routes from reverting to original route in some cases
-	fixed nested array ordering [#156](https://github.com/lhorie/mithril.js/issues/156)
-	fixed key ordering in interpolation case [#157](https://github.com/lhorie/mithril.js/issues/157)

---

[v0.1.18](http://mithril.js.org/archive/v0.1.18) - maintenance

### Bug Fixes:

-	routing now correctly clears diff cache [#148](https://github.com/lhorie/mithril.js/issues/148)
-	fixed incorrect context unloading when reattaching a child to a new parent

---

[v0.1.17](http://mithril.js.org/archive/v0.1.17) - maintenance

### News:

-	config contexts can now have an `onunload` property for clean up tasks after elements are detached from the document
-	route changes now re-render from scratch, rather than attempting a virtual dom diff
-	virtual elements that are children of an array can now accept a `key` attribute which maintains the identity of the underlying DOM elements when the array gets shuffled [#98](https://github.com/lhorie/mithril.js/issues/98)

### Bug Fixes:

-	fixed a subtree directive bug that happened in inputs inside loops
-	fixed select.value so that the correct option is displayed on first render
-	in m.request, non-idempotent methods now automatically send appropriate Content-Type header if `serialize` is `JSON.stringify` [#139](https://github.com/lhorie/mithril.js/issues/139)
-	`m` selectors now correctly handle empty attribute values like `[href='']`
-	pre-existing nodes in a root element now get cleared if there's no cell cache associated with the element [#60](https://github.com/lhorie/mithril.js/issues/60)

---

[v0.1.16](http://mithril.js.org/archive/v0.1.16) - maintenance

### News:

-	controller::onunload now receives an event parameter so that the unloading can be aborted [#135](https://github.com/lhorie/mithril.js/issues/135)

### Bug Fixes:

-	prevent route change when only hash changes in non-hash mode [#107](https://github.com/lhorie/mithril.js/issues/107)
-	config now always runs after template is attached to document [#109](https://github.com/lhorie/mithril.js/issues/109)
-	fix null reference exception with Browserify [#110](https://github.com/lhorie/mithril.js/issues/110)
-	fix nested array removal edge cases [#120](https://github.com/lhorie/mithril.js/issues/120)
-	ignore redraw calls when controller is not ready [#127](https://github.com/lhorie/mithril.js/issues/127)
-	fix null reference exception in nested array edge case [#129](https://github.com/lhorie/mithril.js/issues/129)
-	fix a contenteditable null reference error [#134](https://github.com/lhorie/mithril.js/issues/134)
-	fix textarea value diffing when value is a node inside an array [#136](https://github.com/lhorie/mithril.js/issues/136)
-	fix diff bug with trusted strings [#138](https://github.com/lhorie/mithril.js/issues/138)

### Breaking changes:

-	Due to the poor level of compatibility between XDomainRequest and XHR2, XDomainRequest is no longer called internally by Mithril. If you need to use CORS in IE9 or lower, you will need to return an XDomainRequest instance from `m.request`'s `config` method [#121](https://github.com/lhorie/mithril.js/issues/121)

---

[v0.1.15](http://mithril.js.org/archive/v0.1.15) - maintenance

### Bug Fixes:

-	`m.sync` now correctly passes arguments to resolver in same order as input arguments [#96](https://github.com/lhorie/mithril.js/issues/96) 
-	fixed diff deletion bug [#99](https://github.com/lhorie/mithril.js/issues/99) 
-	updating textarea attributes updates its value correctly [#100](https://github.com/lhorie/mithril.js/issues/100)

---

[v0.1.14](http://mithril.js.org/archive/v0.1.14) - maintenance

### News:

-	The signature of `m` now accepts virtual elements as the second parameter of the function.
-	`m.route(path, params)` now accepts an argument that gets parsed as a querystring.
-	routes now ignore trailing slashes [#88](https://github.com/lhorie/mithril.js/issues/88)

### Bug Fixes:

-	Resolving promises early without a value now works [#85](https://github.com/lhorie/mithril.js/issues/85)
-	Throwing exceptions within `m.request` now follow the same resolution procedure as `m.deferred` [#86](https://github.com/lhorie/mithril.js/issues/85)
-	Promises now always update their `m.prop` on success (and leave the m.prop alone on error)
-	Nested arrays no longer cause double removal of elements [#87](https://github.com/lhorie/mithril.js/issues/87)
-	HTTP error codes now correctly reject promises

---

[v0.1.13](http://mithril.js.org/archive/v0.1.13) - maintenance

### News:

-	m.module now runs clean-up code in root module controllers that implement an `onunload` instance method [#82](https://github.com/lhorie/mithril.js/issues/82)

### Bug Fixes:

-	Removing CSS rules now diffs correctly [#79](https://github.com/lhorie/mithril.js/issues/79)

---

[v0.1.12](http://mithril.js.org/archive/v0.1.12) - maintenance

### News:

-	It's now possible to define [variadic routes](mithril.route.md#variadic-routes) [#70](https://github.com/lhorie/mithril.js/issues/70)

### Bug Fixes:

-	Fix link location in links using `config: m.route` after redraws [#74](https://github.com/lhorie/mithril.js/issues/74)
-	Fixed support for `list` attribute in inputs [#69](https://github.com/lhorie/mithril.js/issues/69)
-	Fixed URL decoding in route params [#75](https://github.com/lhorie/mithril.js/issues/75)

---

[v0.1.11](http://mithril.js.org/archive/v0.1.11) - maintenance

### News:

-	Added `m.route()` overload to allow reading of current route [#61](https://github.com/lhorie/mithril.js/issues/61)
-	Added `background` option to `m.request` to allow requests that don't affect rendering [#62](https://github.com/lhorie/mithril.js/issues/62)

### Bug Fixes:

-	Links using `config: m.route` can now be opened in new tab correctly [#64](https://github.com/lhorie/mithril.js/issues/64)
-	Fixed diff within contenteditable areas [#65](https://github.com/lhorie/mithril.js/issues/65)

---

[v0.1.10](http://mithril.js.org/archive/v0.1.10) - maintenance

### News:

-	Added social buttons to homepage

### Bug Fixes:

-	Bi-directional bindings no longer wipe out cursor position in Chrome [#58](https://github.com/lhorie/mithril.js/issues/58)

---

[v0.1.9](http://mithril.js.org/archive/v0.1.9) - maintenance

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

[v0.1.8](http://mithril.js.org/archive/v0.1.8) - maintenance

### News:

-	Mock now contains a basic `insertAdjacentHTML` implementation to enable better testing of `m.trust` / `m.render` interactions

### Bug Fixes:

-	Fixed ordering bug in deep subchildren [#51](https://github.com/lhorie/mithril.js/issues/51)
-	Fixed ordering bug with trusted strings [#51](https://github.com/lhorie/mithril.js/issues/51)

---

[v0.1.7](http://mithril.js.org/archive/v0.1.7) - maintenance

### News:

-	Mithril will be on a accelerated release cycle for the rest of the v0.1.x series. This means CDNs may lag behind in versions, so it's recommended that you either use one of the supported NodeJS package managers or fork from the Github repo directly. More information can be found [here](https://groups.google.com/forum/#!msg/mithriljs/mc0qTgFTlgs/OD7Mc7_2Wa4J)

### Bug Fixes:

-	Fixed ordering bug when virtual element is preceded by array [#50](https://github.com/lhorie/mithril.js/issues/50)

---

[v0.1.6](http://mithril.js.org/archive/v0.1.6) - maintenance

### Bug Fixes:

-	Fixed serious bug when mixing cached text nodes with new virtual elements [#49](https://github.com/lhorie/mithril.js/issues/49)

---

[v0.1.5](http://mithril.js.org/archive/v0.1.5) - maintenance

### News:

-	Launched the [Mithril Blog](http://lhorie.github.io/mithril-blog)

### Bug Fixes:

-	Fixed serious ordering problem when mixing arrays with virtual elements [#48](https://github.com/lhorie/mithril.js/issues/48)

---

[v0.1.4](http://mithril.js.org/archive/v0.1.4) - maintenance

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

[v0.1.3](http://mithril.js.org/archive/v0.1.3) - maintenance

### News:

-	Mithril is now available via [Component](http://component.io)
-	There's now an extra low-level optimization hook called a SubtreeDirective, which allows implementing plugins that only create virtual trees if necessary.

### Bug Fixes:

-	diff no longer touch the DOM when processing `style` attributes and event handlers
-	returning a thennable to a resolution callback in `m.deferred().promise` now causes the promise to adopt its state 
-	diff now correctly clears subtree if null or undefined is passed as a node

---

[v0.1.2](http://mithril.js.org/archive/v0.1.2) - maintenance

### News:

-	There's now a [community mailing list](mailto:mithriljs@googlegroups.com). There's also a [web interface](https://groups.google.com/forum/#!forum/mithriljs)
-	Mithril is now on Travis CI. The build status can be found in the [project homepage](https://github.com/lhorie/mithril.js)
-	Mithril is now available via the CommonJS and AMD API
-	Mithril can now [be installed via npm and bower](installation.md)

### Bug Fixes:

-	`m.render` now correctly reattaches reused DOM elements to replaced parent nodes [#31](https://github.com/lhorie/mithril.js/issues/31)
-	UI actions that can potentially de-synchronize the DOM from cache now force synchronization [#29](https://github.com/lhorie/mithril.js/issues/29)

---

[v0.1.1](http://mithril.js.org/archive/v0.1.1) - maintenance

### News:

-	Mithril is now available at [cdnjs](http://cdnjs.com/librarieshttp://mithril.js.org/) and [jsdelivr](http://www.jsdelivr.com/#!mithril)

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

[v0.1](http://mithril.js.org/archive/v0.1) - Initial release