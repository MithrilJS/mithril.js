## Change Log

[v0.1.1](/archive/v0.1.1) - maintenance

### Bug Fixes:

-	`m.route.param` now resets on route change correctly [#15](https://github.com/lhorie/mithril.js/issues/15)

### Breaking changes:

-	changed default value for `xhr.withCredentials` from `true` to `false` for `m.request`, since public APIs are more common than auth-walled ones. [#14](https://github.com/lhorie/mithril.js/issues/14)

	In order to configure this flag, the following configuration should be used:
	
	```javascript
	var privateAPI = function(xhr) {xhr.withCredentials = true};
	
	m.request({method: "GET", url: "/foo", config: privateAPI});
	```

---

[v0.1](/archive/v0.1) - Initial release