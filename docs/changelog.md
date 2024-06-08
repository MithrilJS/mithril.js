<!--meta-description
Official change log for Mithril.js
-->
# Change log

- [v2.0.4](#v204)
- [v2.0.3](#v203)
- [v2.0.1](#v201)
- [v2.0.0](#v200)
- [Migrating from v1.x](migration-v1x.md)
- [Migrating from v0.2.x](migration-v02x.md)
- [v1.x changelog](https://mithril.js.org/archive/v1.1.7/change-log.html)
- [v1.x docs](https://mithril.js.org/archive/v1.1.7/index.html)
- [v0.2 docs](https://mithril.js.org/archive/v0.2.5/index.html)
- [`ospec` change log](https://github.com/MithrilJS/ospec/blob/master/changelog.md)
- [`mithril-stream` change log](#mithril-stream-change-log)

---

<!--

### Upcoming...

*Note for later: release as semver-minor.*

PSA: changes to [`mithril/stream`](stream.md) are now specified in this changelog. I've also moved the old stream changelog into this file [here](#mithril-stream-change-log).

- Added `m.Fragment = "["` for an easier time with JSX setups. ([#2744](https://github.com/MithrilJS/mithril.js/pull/2744) [@dead-claudia](https://github.com/dead-claudia))
- Reduced package download size substantially by removing the archive of previous releases' documentation. ([#2561](https://github.com/MithrilJS/mithril.js/pull/2561) [@cztomsik](https://github.com/cztomsik))
- Improved error messages in multiple places. ([#2536](https://github.com/MithrilJS/mithril.js/pull/2536) [@dead-claudia](https://github.com/dead-claudia))
- The redraw reentrancy check was moved from `m.mount` to `m.render` and its error message was updated accordingly. ([#2536](https://github.com/MithrilJS/mithril.js/pull/2536) [@dead-claudia](https://github.com/dead-claudia))
    - This is unlikely to break people because if you were to do it with `m.render` directly before now, you'd corrupt Mithril.js' internal representation and internal errors could occur as a result. Now, it just warns you.
- For a better debugging experience with `m.route` route resolvers, errors on `onmatch` in the default route are left unhandled and errors in `onmatch` in other routes are logged to the console before redirecting. ([#2536](https://github.com/MithrilJS/mithril.js/pull/2536) [@dead-claudia](https://github.com/dead-claudia))
- Bug fix with `m.redraw` where if you removed a root that was previously visited in the current redraw pass, it would lose its place and skip the next root.
- Add `params:` attribute to `m.route.Link`. ([#2537](https://github.com/MithrilJS/mithril.js/pull/2537) [@dead-claudia](https://github.com/dead-claudia))
- Add `m.censor`. ([#2538](https://github.com/MithrilJS/mithril.js/pull/2538) [@dead-claudia](https://github.com/dead-claudia))
- Re-add stream bundles. ([#2539](https://github.com/MithrilJS/mithril.js/pull/2539) [@dead-claudia](https://github.com/dead-claudia))
- Remove extra isLifecycleMethod call from removeAttr. ([#2594](https://github.com/MithrilJS/mithril.js/pull/2594) [@ZeikJT](https://github.com/zeikjt))
- Fix issue where ending a stream in the middle of a stream callback would result in erroneous parent stream state for the rest of that emit. ([#2603](https://github.com/MithrilJS/mithril.js/pull/2603) [@dead-claudia](https://github.com/dead-claudia))
- Fix issue where new redraw handlers weren't copied over on update. ([#2578](https://github.com/MithrilJS/mithril.js/pull/2578) [@dead-claudia](https://github.com/dead-claudia))
- Make changes to file inputs gracefully handled, and don't break if the current value and old value mismatch (and the new value isn't empty), but instead just log an error. ([#2578](https://github.com/MithrilJS/mithril.js/pull/2578) [@dead-claudia](https://github.com/dead-claudia))
    - This mainly exists just to kick the can down the road - this is the only case I'm aware of where the DOM itself would be responsible for throwing an error. A proper fix to the greater issue of error handling is much more complex, and I'd rather not block users any longer over this one specific issue.
- Allow Mithril.js to be loaded in non-browser environments without modification. ([#2633](https://github.com/MithrilJS/mithril.js/pull/2633) [@dead-claudia](https://github.com/dead-claudia))
- Work around a bundler bug that corrupted RegExps [#2647](https://github.com/MithrilJS/mithril.js/issues/) ([#2655](https://github.com/MithrilJS/mithril.js/pull/2655))
- Adapt handling of no content (204) responses to match XHR Spec ([#2624](https://github.com/MithrilJS/mithril.js/pull/2641)) [@Evoke-PHP](https://github.com/Evoke-PHP)
- Add `URLSearchParams` support to `m.request` ([#2695](https://github.com/MithrilJS/mithril.js/pull/2695) [@Coteh](https://github.com/Coteh))
- Standardise vnode text representation ([#2670](https://github.com/MithrilJS/mithril.js/pull/2670)) [@barneycarroll](https://github.com/barneycarroll)
- API: Invalid escapes in routes are now safely handled. [@StephanHoyer](https://github.com/StephanHoyer) based on older [fix](https://github.com/MithrilJS/mithril.js/pull/2061) by [@dead-claudia](https://github.com/dead-claudia)

Important note: if you were using any of these undocumented tools, they are no longer available as of this release. This is not considered a breaking change as they were written for internal usage and as of v2 are all 100% unsupported in userland.

- Mithril.js' internal bundler, previously available at `mithril/bundler`
	- Prefer using a dedicated bundler like Webpack or Rollup instead.
- Mithril.js' CommonJS sham polyfill, previously available at `mithril/module`
	- Prefer using native `import`/`export` and/or Budo instead.
- Mithril.js' internal test mocks, previously available at `mithril/test-utils`
	- Prefer using JSDOM or similar instead.

I'd like to apologize for missing these deprecations in the initial 2.0.0 change log. This was a major policy change we had been communicating the entire time and we should've let you all know this there in the change log as well.

-->

### v2.0.4
_2019-08-18_

- Fix double-rendering of trusted content within `contenteditable` elements ([#2516](https://github.com/MithrilJS/mithril.js/pull/2516) [@dead-claudia](https://github.com/dead-claudia))
- Fix error on `m.trust` updating ([#2516](https://github.com/MithrilJS/mithril.js/pull/2516) [@dead-claudia](https://github.com/dead-claudia))

### v2.0.3
_2019-07-28_

- Ensure vnodes are removed correctly in the face of `onbeforeremove` resolving after new nodes are added ([#2492](https://github.com/MithrilJS/mithril.js/pull/2492) [@dead-claudia](https://github.com/dead-claudia))
- Fix prototype pollution vulnerability in `m.parseQueryString` ([#2494](https://github.com/MithrilJS/mithril.js/pull/2494) [@dead-claudia](https://github.com/dead-claudia))

*v2.0.2 was skipped as it had a critical flaw and was immediately unpublished.*

### v2.0.1
_2019-07-24_

Same as v2.0.0, but with a publish that didn't have a botched upload.

### v2.0.0
_2019-07-24_

#### Breaking changes

- API: Component vnode `children` are not normalized into vnodes on ingestion; normalization only happens if and when they are ingested by the view ([#2155](https://github.com/MithrilJS/mithril.js/pull/2155/) (thanks to [@magikstm](https://github.com/magikstm) for related optimization [#2064](https://github.com/MithrilJS/mithril.js/pull/2064)))
- API: `m.redraw()` is always asynchronous ([#1592](https://github.com/MithrilJS/mithril.js/pull/1592))
- API: `m.mount()` will only render its own root when called, it will not trigger a `redraw()` ([#1592](https://github.com/MithrilJS/mithril.js/pull/1592))
- API: Assigning to `vnode.state` (as in `vnode.state = ...`) is no longer supported. Instead, an error is thrown if `vnode.state` changes upon the invocation of a lifecycle hook.
- API: `m.request` will no longer reject the Promise on server errors (eg. status >= 400) if the caller supplies an `extract` callback. This gives applications more control over handling server responses.
- hyperscript: when attributes have a `null` or `undefined` value, they are treated as if they were absent. [#1773](https://github.com/MithrilJS/mithril.js/issues/1773) ([#2174](https://github.com/MithrilJS/mithril.js/pull/2174))
- API: `m.request` errors no longer copy response fields to the error, but instead assign the parsed JSON response to `error.response` and the HTTP status code `error.code`.
- hyperscript: when an attribute is defined on both the first and second argument (as a CSS selector and an `attrs` field, respectively), the latter takes precedence, except for `class` attributes that are still added together. [#2172](https://github.com/MithrilJS/mithril.js/issues/2172) ([#2174](https://github.com/MithrilJS/mithril.js/pull/2174))
- cast className using toString ([#2309](https://github.com/MithrilJS/mithril.js/pull/2309))
- render: call attrs' hooks last, with express exception of `onbeforeupdate` to allow attrs to block components from even diffing ([#2297](https://github.com/MithrilJS/mithril.js/pull/2297))
- API: `m.withAttr` removed. ([#2317](https://github.com/MithrilJS/mithril.js/pull/2317))
- request: `data` has now been split to `params` and `body` and `useBody` has been removed in favor of just using `body`. ([#2361](https://github.com/MithrilJS/mithril.js/pull/2361))
- route, request: Interpolated arguments are URL-escaped (and for declared routes, URL-unescaped) automatically. If you want to use a raw route parameter, use a variadic parameter like in `/asset/:path.../view`. This was previously only available in `m.route` route definitions, but it's now usable in both that and where paths are accepted. ([#2361](https://github.com/MithrilJS/mithril.js/pull/2361))
- route, request: Interpolated arguments are *not* appended to the query string. This means `m.request({url: "/api/user/:id/get", params: {id: user.id}})` would result in a request like `GET /api/user/1/get`, not one like `GET /api/user/1/get?id=1`. If you really need it in both places, pass the same value via two separate parameters with the non-query-string parameter renamed, like in `m.request({url: "/api/user/:urlID/get", params: {id: user.id, urlID: user.id}})`. ([#2361](https://github.com/MithrilJS/mithril.js/pull/2361))
- route, request: `m.route.set`, `m.request`, and `m.jsonp` all use the same path template syntax now, and vary only in how they receive their parameters. Furthermore, declared routes in `m.route` shares the same syntax and semantics, but acts in reverse as if via pattern matching. ([#2361](https://github.com/MithrilJS/mithril.js/pull/2361))
- request: `options.responseType` now defaults to `"json"` if `extract` is absent, and `deserialize` receives the parsed response, not the raw string. If you want the old behavior, [use `responseType: "text"`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType). ([#2335](https://github.com/MithrilJS/mithril.js/pull/2335))
- request: set `Content-Type: application/json; charset=utf-8` for all XHR methods by default, provided they have a body that's `!= null` ([#2361](https://github.com/MithrilJS/mithril.js/pull/2361), [#2421](https://github.com/MithrilJS/mithril.js/pull/2421))
    - This can cause CORS issues when issuing `GET` with bodies, but you can address them through configuring CORS appropriately.
    - Previously, it was only set for all non-`GET` methods and only when `useBody: true` was passed (the default), and it was always set for them. Now it's automatically omitted when no body is present, so the hole is slightly broadened.
- route: query parameters in hash strings are no longer supported ([#2448](https://github.com/MithrilJS/mithril.js/pull/2448) [@dead-claudia](https://github.com/dead-claudia))
    - It's technically invalid in hashes, so I'd rather push people to keep in line with spec.
- render: validate all elements are either keyed or unkeyed, and treat `null`/`undefined`/booleans as strictly unkeyed ([#2452](https://github.com/MithrilJS/mithril.js/pull/2452) [@dead-claudia](https://github.com/dead-claudia))
    - Gives a nice little perf boost with keyed fragments.
    - Minor, but imperceptible impact (within the margin of error) with unkeyed fragments.
    - Also makes the model a lot more consistent - all values are either keyed or unkeyed.
- vnodes: normalize boolean children to `null`/`undefined` at the vnode level, always stringify non-object children that aren't holes ([#2452](https://github.com/MithrilJS/mithril.js/pull/2452) [@dead-claudia](https://github.com/dead-claudia))
    - Previously, `true` was equivalent to `"true"` and `false` was equivalent to `""`.
    - Previously, numeric children weren't coerced. Now, they are.
    - Unlikely to break most components, but it *could* break some users.
    - This increases consistency with how booleans are handled with children, so it should be more intuitive.
- route: `key` parameter for routes now only works globally for components ([#2458](https://github.com/MithrilJS/mithril.js/pull/2458) [@dead-claudia](https://github.com/dead-claudia))
    - Previously, it worked for route resolvers, too.
    - This lets you ensure global layouts used in `render` still render by diff.
- redraw: `mithril/redraw` now just exposes the `m.redraw` callback ([#2458](https://github.com/MithrilJS/mithril.js/pull/2458) [@dead-claudia](https://github.com/dead-claudia))
    - The `.schedule`, `.unschedule`, and `.render` properties of the former `redrawService` are all removed.
    - If you want to know how to work around it, look at the call to `mount` in Mithril.js' source for `m.route`. That should help you in finding ways around the removed feature. (It doesn't take that much more code.)
- api: `m.version` has been removed. If you really need the version for whatever reason, just read the `version` field of `mithril/package.json` directly. ([#2466](https://github.com/MithrilJS/mithril.js/pull/2466) [@dead-claudia](https://github.com/dead-claudia))
- route: `m.route.prefix(...)` is now `m.route.prefix = ...`. ([#2469](https://github.com/MithrilJS/mithril.js/pull/2469) [@dead-claudia](https://github.com/dead-claudia))
    - This is a fully fledged property, so you can not only write to it, but you can also read from it.
    - This aligns better with user intuition.
- route: `m.route.link` function removed in favor of `m.route.Link` component. ([#2469](https://github.com/MithrilJS/mithril.js/pull/2469) [@dead-claudia](https://github.com/dead-claudia))
    - An optional `options` object is accepted as an attribute. This was initially targeting the old `m.route.link` function and was transferred to this. ([#1930](https://github.com/MithrilJS/mithril.js/pull/1930))
    - The new component handles many more edge cases around user interaction, including accessibility.
    - Link navigation can be disabled and cancelled.
    - Link targets can be trivially changed.

#### News

- Mithril.js now only officially supports IE11, Firefox ESR, and the last two versions of Chrome/FF/Edge/Safari. ([#2296](https://github.com/MithrilJS/mithril.js/pull/2296))
- API: Introduction of `m.redraw.sync()` ([#1592](https://github.com/MithrilJS/mithril.js/pull/1592))
- API: Event handlers may also be objects with `handleEvent` methods ([#1949](https://github.com/MithrilJS/mithril.js/pull/1949), [#2222](https://github.com/MithrilJS/mithril.js/pull/2222)).
- API: `m.request` better error message on JSON parse error - ([#2195](https://github.com/MithrilJS/mithril.js/pull/2195), [@codeclown](https://github.com/codeclown))
- API: `m.request` supports `timeout` as attr - ([#1966](https://github.com/MithrilJS/mithril.js/pull/1966))
- API: `m.request` supports `responseType` as attr - ([#2193](https://github.com/MithrilJS/mithril.js/pull/2193))
- Mocks: add limited support for the DOMParser API ([#2097](https://github.com/MithrilJS/mithril.js/pull/2097))
- API: add support for raw SVG in `m.trust()` string ([#2097](https://github.com/MithrilJS/mithril.js/pull/2097))
- render/core: remove the DOM nodes recycling pool ([#2122](https://github.com/MithrilJS/mithril.js/pull/2122))
- render/core: revamp the core diff engine, and introduce a longest-increasing-subsequence-based logic to minimize DOM operations when re-ordering keyed nodes.
- docs: Emphasize Closure Components for stateful components, use them for all stateful component examples.
- API: ES module bundles are now available for `mithril` and `mithril/stream` ([#2194](https://github.com/MithrilJS/mithril.js/pull/2194) [@porsager](https://github.com/porsager)).
    - All of the `m.*` properties from `mithril` are re-exported as named exports in addition to being attached to `m`.
    - `m()` itself from `mithril` is exported as the default export.
    - `mithril/stream`'s primary export is exported as the default export.
- fragments: allow same attrs/children overloading logic as hyperscript ([#2328](https://github.com/MithrilJS/mithril.js/pull/2328))
- route: Declared routes may check against path names with query strings. ([#2361](https://github.com/MithrilJS/mithril.js/pull/2361))
- route: Declared routes in `m.route` now support `-` and `.` as delimiters for path segments. This means you can have a route like `"/edit/:file.:ext"`. ([#2361](https://github.com/MithrilJS/mithril.js/pull/2361))
    - Previously, this was possible to do in `m.route.set`, `m.request`, and `m.jsonp`, but it was wholly untested for and also undocumented.
- API: `m.buildPathname` and `m.parsePathname` added. ([#2361](https://github.com/MithrilJS/mithril.js/pull/2361))
- route: Use `m.mount(root, null)` to unsubscribe and clean up after a `m.route(root, ...)` call. ([#2453](https://github.com/MithrilJS/mithril.js/pull/2453))
- render: new `redraw` parameter exposed any time a child event handler is used ([#2458](https://github.com/MithrilJS/mithril.js/pull/2458) [@dead-claudia](https://github.com/dead-claudia))
- route: `m.route.SKIP` can be returned from route resolvers to skip to the next route ([#2469](https://github.com/MithrilJS/mithril.js/pull/2469) [@dead-claudia](https://github.com/dead-claudia))
- API: Full DOM no longer required to execute `require("mithril")`. You just need to set the necessary globals to *something*, even if `null` or `undefined`, so they can be properly used. ([#2469](https://github.com/MithrilJS/mithril.js/pull/2469) [@dead-claudia](https://github.com/dead-claudia))
    - This enables isomorphic use of `m.route.Link` and `m.route.prefix`.
    - This enables isomorphic use of `m.request`, provided the `background: true` option is set and that an `XMLHttpRequest` polyfill is included as necessary.
    - Note that methods requiring DOM operations will still throw errors, such as `m.render(...)`, `m.redraw()`, and `m.route(...)`.
- render: Align custom elements to work like normal elements, minus all the HTML-specific magic. ([#2221](https://github.com/MithrilJS/mithril.js/pull/2221))

#### Bug fixes

- API: `m.route.set()` causes all mount points to be redrawn ([#1592](https://github.com/MithrilJS/mithril.js/pull/1592))
- ospec: Fix assertion definitions breaking on comparison failure
- render/attrs: Using style objects in hyperscript calls will now properly diff style properties from one render to another as opposed to re-writing all element style properties every render.
- render/attrs All vnodes attributes are properly removed when absent or set to `null` or `undefined` [#1804](https://github.com/MithrilJS/mithril.js/issues/1804) [#2082](https://github.com/MithrilJS/mithril.js/issues/2082) ([#1865](https://github.com/MithrilJS/mithril.js/pull/1865), [#2130](https://github.com/MithrilJS/mithril.js/pull/2130))
- render/core: Render state correctly on select change event [#1916](https://github.com/MithrilJS/mithril.js/issues/1916) ([#1918](https://github.com/MithrilJS/mithril.js/pull/1918) [@robinchew](https://github.com/robinchew), [#2052](https://github.com/MithrilJS/mithril.js/pull/2052))
- render/core: fix various updateNodes/removeNodes issues when the pool and fragments are involved [#1990](https://github.com/MithrilJS/mithril.js/issues/1990), [#1991](https://github.com/MithrilJS/mithril.js/issues/1991), [#2003](https://github.com/MithrilJS/mithril.js/issues/2003), [#2021](https://github.com/MithrilJS/mithril.js/pull/2021)
- render/core: fix crashes when the keyed vnodes with the same `key` had different `tag` values [#2128](https://github.com/MithrilJS/mithril.js/issues/2128) [@JacksonJN](https://github.com/JacksonJN) ([#2130](https://github.com/MithrilJS/mithril.js/pull/2130))
- render/core: fix cached nodes behavior in some keyed diff scenarios [#2132](https://github.com/MithrilJS/mithril.js/issues/2132) ([#2130](https://github.com/MithrilJS/mithril.js/pull/2130))
- render/events: `addEventListener` and `removeEventListener` are always used to manage event subscriptions, preventing external interference.
- render/events: Event listeners allocate less memory, swap at low cost, and are properly diffed now when rendered via `m.mount()`/`m.redraw()`.
- render/events: `Object.prototype` properties can no longer interfere with event listener calls.
- render/events: Event handlers, when set to literally `undefined` (or any non-function), are now correctly removed.
- render/hooks: fixed an ommission that caused `oninit` to be called unnecessarily in some cases [#1992](https://github.com/MithrilJS/mithril.js/issues/1992)
- docs: tweaks: ([#2104](https://github.com/MithrilJS/mithril.js/pull/2104) [@mikeyb](https://github.com/mikeyb), [#2205](https://github.com/MithrilJS/mithril.js/pull/2205), [@cavemansspa](https://github.com/cavemansspa), [#2250](https://github.com/MithrilJS/mithril.js/pull/2250) [@dead-claudia](https://github.com/dead-claudia), [#2265](https://github.com/MithrilJS/mithril.js/pull/2265), [@dead-claudia](https://github.com/dead-claudia))
- render/core: avoid touching `Object.prototype.__proto__` setter with `key: "__proto__"` in certain situations ([#2251](https://github.com/MithrilJS/mithril.js/pull/2251))
- render/core: Vnodes stored in the dom node supplied to `m.render()` are now normalized [#2266](https://github.com/MithrilJS/mithril.js/pull/2266)
- render/core: CSS vars can now be specified in `{style}` attributes ([#2192](https://github.com/MithrilJS/mithril.js/pull/2192) [@barneycarroll](https://github.com/barneycarroll)), ([#2311](https://github.com/MithrilJS/mithril.js/pull/2311) [@porsager](https://github.com/porsager)), ([#2312](https://github.com/MithrilJS/mithril.js/pull/2312) [@dead-claudia](https://github.com/dead-claudia))
- request: don't modify params, call `extract`/`serialize`/`deserialize` with correct `this` value ([#2288](https://github.com/MithrilJS/mithril.js/pull/2288))
- render: simplify component removal ([#2214](https://github.com/MithrilJS/mithril.js/pull/2214))
- render: remove some redundancy within the component initialization code ([#2213](https://github.com/MithrilJS/mithril.js/pull/2213))
- API: `mithril` loads `mithril/index.js`, not the bundle, so users of `mithril/hyperscript`, `mithril/render`, and similar see the same Mithril instance as those just using `mithril` itself.
    - `https://unpkg.com/mithril` is configured to receive the *minified* bundle, not the development bundle.
    - The raw bundle itself remains accessible at `mithril.js`, and is *not* browser-wrapped.
    - Note: this *will* increase overhead with bundlers like Webpack, Rollup, and Browserify.
- request: autoredraw support fixed for `async`/`await` in Chrome ([#2428](https://github.com/MithrilJS/mithril.js/pull/2428) [@dead-claudia](https://github.com/dead-claudia))
- render: fix when attrs change with `onbeforeupdate` returning false, then remaining the same on next redraw ([#2447](https://github.com/MithrilJS/mithril.js/pull/2447) [@dead-claudia](https://github.com/dead-claudia))
- render: fix internal error when `onbeforeupdate` returns false and then true with new child tree ([#2447](https://github.com/MithrilJS/mithril.js/pull/2447) [@dead-claudia](https://github.com/dead-claudia))
- route: arbitrary prefixes are properly supported now, including odd prefixes like `?#` and invalid prefixes like `#foo#bar` ([#2448](https://github.com/MithrilJS/mithril.js/pull/2448) [@dead-claudia](https://github.com/dead-claudia))
- request: correct IE workaround for response type non-support ([#2449](https://github.com/MithrilJS/mithril.js/pull/2449) [@dead-claudia](https://github.com/dead-claudia))
- render: correct `contenteditable` check to also check for `contentEditable` property name ([#2450](https://github.com/MithrilJS/mithril.js/pull/2450) [@dead-claudia](https://github.com/dead-claudia))
- docs: clarify valid key usage ([#2452](https://github.com/MithrilJS/mithril.js/pull/2452) [@dead-claudia](https://github.com/dead-claudia))
- route: don't pollute globals ([#2453](https://github.com/MithrilJS/mithril.js/pull/2453) [@dead-claudia](https://github.com/dead-claudia))
- request: track xhr replacements correctly ([#2455](https://github.com/MithrilJS/mithril.js/pull/2455) [@dead-claudia](https://github.com/dead-claudia))

## `mithril-stream` change log

Formerly, `mithril/stream` was available standalone as the package `mithril-stream`, but this package has been deprecated and is no longer updated. The changelog for that package prior to being merged back into Mithril.js proper is below.

### 2.0.0
_2019-02-07_

- when a stream conditionally returns HALT, dependant stream will also end ([#2200](https://github.com/MithrilJS/mithril.js/pull/2200), [#2369](https://github.com/MithrilJS/mithril.js/pull/2369))
- Add `stream.lift` as a user-friendly alternative to `merge -> map` or `combine` ([#1944](https://github.com/MithrilJS/mithril.js/issues/1944))
- renamed HALT to SKIP ([#2207](https://github.com/MithrilJS/mithril.js/pull/2207))
- rewrote implementation ([#2207](https://github.com/MithrilJS/mithril.js/pull/2207))
- Removed `valueOf` & `toString` methods ([#2150](https://github.com/MithrilJS/mithril.js/pull/2150))
- fixed `stream.end` propagation ([#2369](https://github.com/MithrilJS/mithril.js/pull/2369))

### 1.1.0
_2017-07-13_

- Move the "use strict" directive inside the IIFE [#1831](https://github.com/MithrilJS/mithril.js/issues/1831) ([#1893](https://github.com/MithrilJS/mithril.js/pull/1893))
