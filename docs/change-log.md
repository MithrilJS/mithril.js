## Change Log

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