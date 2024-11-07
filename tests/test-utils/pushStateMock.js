import o from "ospec"

import {callAsync, waitAsync} from "../../test-utils/callAsync.js"
import {setupGlobals} from "../../test-utils/global.js"

o.spec("pushStateMock", function() {
	var G = setupGlobals()

	o.spec("initial state", function() {
		o("has url on page load", function() {
			o(G.window.location.href).equals("http://localhost/")
		})
	})

	o.spec("set href", function() {
		o("changes url on location.href change", function() {
			var old = G.window.location.href
			G.window.location.href = "http://localhost/a"

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/a")
		})
		o("changes url on relative location.href change", function() {
			var old = G.window.location.href
			G.window.location.href = "a"

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/a")
			o(G.window.location.pathname).equals("/a")
		})
		o("changes url on dotdot location.href change", function() {
			G.window.location.href = "a"
			var old = G.window.location.href
			G.window.location.href = ".."

			o(old).equals("http://localhost/a")
			o(G.window.location.href).equals("http://localhost/")
			o(G.window.location.pathname).equals("/")
		})
		o("changes url on deep dotdot location.href change", function() {
			G.window.location.href = "a/b/c"
			var old = G.window.location.href
			G.window.location.href = ".."

			o(old).equals("http://localhost/a/b/c")
			o(G.window.location.href).equals("http://localhost/a")
			o(G.window.location.pathname).equals("/a")
		})
		o("does not change url on dotdot location.href change from root", function() {
			var old = G.window.location.href
			G.window.location.href = ".."

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/")
			o(G.window.location.pathname).equals("/")
		})
		o("changes url on dot relative location.href change", function() {
			var old = G.window.location.href
			G.window.location.href = "a"
			G.window.location.href = "./b"

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/b")
			o(G.window.location.pathname).equals("/b")
		})
		o("does not change url on dot location.href change", function() {
			var old = G.window.location.href
			G.window.location.href = "a"
			G.window.location.href = "."

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/a")
			o(G.window.location.pathname).equals("/a")
		})
		o("changes url on hash-only location.href change", function() {
			var old = G.window.location.href
			G.window.location.href = "#a"

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/#a")
			o(G.window.location.hash).equals("#a")
		})
		o("changes url on search-only location.href change", function() {
			var old = G.window.location.href
			G.window.location.href = "?a"

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/?a")
			o(G.window.location.search).equals("?a")
		})
		o("changes hash on location.href change", function() {
			var old = G.window.location.href
			G.window.location.href = "http://localhost/a#b"

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/a#b")
			o(G.window.location.hash).equals("#b")
		})
		o("changes search on location.href change", function() {
			var old = G.window.location.href
			G.window.location.href = "http://localhost/a?b"

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/a?b")
			o(G.window.location.search).equals("?b")
		})
		o("changes search and hash on location.href change", function() {
			var old = G.window.location.href
			G.window.location.href = "http://localhost/a?b#c"

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/a?b#c")
			o(G.window.location.search).equals("?b")
			o(G.window.location.hash).equals("#c")
		})
		o("handles search with search and hash", function() {
			var old = G.window.location.href
			G.window.location.href = "http://localhost/a?b?c#d"

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/a?b?c#d")
			o(G.window.location.search).equals("?b?c")
			o(G.window.location.hash).equals("#d")
		})
		o("handles hash with search and hash", function() {
			var old = G.window.location.href
			G.window.location.href = "http://localhost/a#b?c#d"

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/a#b?c#d")
			o(G.window.location.search).equals("")
			o(G.window.location.hash).equals("#b?c#d")
		})
	})
	o.spec("set search", function() {
		o("changes url on location.search change", function() {
			var old = G.window.location.href
			G.window.location.search = "?b"

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/?b")
			o(G.window.location.search).equals("?b")
		})
	})
	o.spec("set hash", function() {
		o("changes url on location.hash change", function() {
			var old = G.window.location.href
			G.window.location.hash = "#b"

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/#b")
			o(G.window.location.hash).equals("#b")
		})
	})
	o.spec("set pathname", function() {
		o("changes url on location.pathname change", function() {
			var old = G.window.location.href
			G.window.location.pathname = "/a"

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/a")
			o(G.window.location.pathname).equals("/a")
		})
	})
	o.spec("set protocol", function() {
		o("setting protocol throws", function(done) {
			try {
				G.window.location.protocol = "https://"
			}
			catch (e) {
				return done()
			}
			throw new Error("Expected an error")
		})
	})
	o.spec("set port", function() {
		o("setting origin changes href", function() {
			var old = G.window.location.href
			G.window.location.port = "81"

			o(old).equals("http://localhost/")
			o(G.window.location.port).equals("81")
			o(G.window.location.href).equals("http://localhost:81/")
		})
	})
	o.spec("set hostname", function() {
		o("setting hostname changes href", function() {
			var old = G.window.location.href
			G.window.location.hostname = "127.0.0.1"

			o(old).equals("http://localhost/")
			o(G.window.location.hostname).equals("127.0.0.1")
			o(G.window.location.href).equals("http://127.0.0.1/")
		})
	})
	o.spec("set origin", function() {
		o("setting origin is ignored", function() {
			var old = G.window.location.href
			G.window.location.origin = "http://127.0.0.1"

			o(old).equals("http://localhost/")
			o(G.window.location.origin).equals("http://localhost")
		})
	})
	o.spec("set host", function() {
		o("setting host is ignored", function() {
			var old = G.window.location.href
			G.window.location.host = "http://127.0.0.1"

			o(old).equals("http://localhost/")
			o(G.window.location.host).equals("localhost")
		})
	})
	o.spec("pushState", function() {
		o("changes url on pushstate", function() {
			var old = G.window.location.href
			G.window.history.pushState(null, null, "http://localhost/a")

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/a")
		})
		o("changes search on pushstate", function() {
			var old = G.window.location.href
			G.window.history.pushState(null, null, "http://localhost/?a")

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/?a")
			o(G.window.location.search).equals("?a")
		})
		o("changes search on relative pushstate", function() {
			var old = G.window.location.href
			G.window.history.pushState(null, null, "?a")

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/?a")
			o(G.window.location.search).equals("?a")
		})
		o("changes hash on pushstate", function() {
			var old = G.window.location.href
			G.window.history.pushState(null, null, "http://localhost/#a")

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/#a")
			o(G.window.location.hash).equals("#a")
		})
		o("changes hash on relative pushstate", function() {
			var old = G.window.location.href
			G.window.history.pushState(null, null, "#a")

			o(old).equals("http://localhost/")
			o(G.window.location.href).equals("http://localhost/#a")
			o(G.window.location.hash).equals("#a")
		})
	})
	o.spec("onpopstate", function() {
		o("history.back() without history does not trigger onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(0)
		})
		o("history.back() after pushstate triggers onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.pushState(null, null, "http://localhost/a")
			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(1)
			o(G.window.onpopstate.args[0].type).equals("popstate")
		})
		o("history.back() after relative pushstate triggers onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.pushState(null, null, "a")
			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(1)
		})
		o("history.back() after search pushstate triggers onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.pushState(null, null, "http://localhost/?a")
			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(1)
		})
		o("history.back() after relative search pushstate triggers onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.pushState(null, null, "?a")
			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(1)
		})
		o("history.back() after hash pushstate triggers onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.pushState(null, null, "http://localhost/#a")
			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(1)
		})
		o("history.back() after relative hash pushstate triggers onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.pushState(null, null, "#a")
			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(1)
		})
		o("history.back() after replacestate does not trigger onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.replaceState(null, null, "http://localhost/a")
			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(0)
		})
		o("history.back() after relative replacestate does not trigger onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.replaceState(null, null, "a")
			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(0)
		})
		o("history.back() after relative search replacestate does not trigger onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.replaceState(null, null, "?a")
			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(0)
		})
		o("history.back() after relative hash replacestate does not trigger onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.replaceState(null, null, "#a")
			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(0)
		})
		o("history.forward() after pushstate triggers onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.pushState(null, null, "http://localhost/a")
			G.window.history.back()
			G.window.history.forward()

			o(G.window.onpopstate.callCount).equals(2)
		})
		o("history.forward() after relative pushstate triggers onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.pushState(null, null, "a")
			G.window.history.back()
			G.window.history.forward()

			o(G.window.onpopstate.callCount).equals(2)
		})
		o("history.forward() after search pushstate triggers onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.pushState(null, null, "http://localhost/?a")
			G.window.history.back()
			G.window.history.forward()

			o(G.window.onpopstate.callCount).equals(2)
		})
		o("history.forward() after relative search pushstate triggers onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.pushState(null, null, "?a")
			G.window.history.back()
			G.window.history.forward()

			o(G.window.onpopstate.callCount).equals(2)
		})
		o("history.forward() after hash pushstate triggers onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.pushState(null, null, "http://localhost/#a")
			G.window.history.back()
			G.window.history.forward()

			o(G.window.onpopstate.callCount).equals(2)
		})
		o("history.forward() after relative hash pushstate triggers onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.pushState(null, null, "#a")
			G.window.history.back()
			G.window.history.forward()

			o(G.window.onpopstate.callCount).equals(2)
		})
		o("history.forward() without history does not trigger onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.forward()

			o(G.window.onpopstate.callCount).equals(0)
		})
		o("history navigation without history does not trigger onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.back()
			G.window.history.forward()

			o(G.window.onpopstate.callCount).equals(0)
		})
		o("reverse history navigation without history does not trigger onpopstate", function() {
			G.window.onpopstate = o.spy()
			G.window.history.forward()
			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(0)
		})
		o("onpopstate has correct url during call", function(done) {
			G.window.location.href = "a"
			G.window.onpopstate = function() {
				o(G.window.location.href).equals("http://localhost/a")
				done()
			}
			G.window.history.pushState(null, null, "b")
			G.window.history.back()
		})
		o("replaceState does not break forward history", function() {
			G.window.onpopstate = o.spy()

			G.window.history.pushState(null, null, "b")
			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(1)
			o(G.window.location.href).equals("http://localhost/")

			G.window.history.replaceState(null, null, "a")

			o(G.window.location.href).equals("http://localhost/a")

			G.window.history.forward()

			o(G.window.onpopstate.callCount).equals(2)
			o(G.window.location.href).equals("http://localhost/b")
		})
		o("pushstate retains state", function() {
			G.window.onpopstate = o.spy()

			G.window.history.pushState({a: 1}, null, "#a")
			G.window.history.pushState({b: 2}, null, "#b")

			o(G.window.onpopstate.callCount).equals(0)

			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(1)
			o(G.window.onpopstate.args[0].type).equals("popstate")
			o(G.window.onpopstate.args[0].state).deepEquals({a: 1})

			G.window.history.back()

			o(G.window.onpopstate.callCount).equals(2)
			o(G.window.onpopstate.args[0].type).equals("popstate")
			o(G.window.onpopstate.args[0].state).equals(null)

			G.window.history.forward()

			o(G.window.onpopstate.callCount).equals(3)
			o(G.window.onpopstate.args[0].type).equals("popstate")
			o(G.window.onpopstate.args[0].state).deepEquals({a: 1})

			G.window.history.forward()

			o(G.window.onpopstate.callCount).equals(4)
			o(G.window.onpopstate.args[0].type).equals("popstate")
			o(G.window.onpopstate.args[0].state).deepEquals({b: 2})
		})
		o("replacestate replaces state", function() {
			G.window.onpopstate = o.spy(pop)

			G.window.history.replaceState({a: 1}, null, "a")

			o(G.window.history.state).deepEquals({a: 1})

			G.window.history.pushState(null, null, "a")
			G.window.history.back()

			function pop(e) {
				o(e.state).deepEquals({a: 1})
				o(G.window.history.state).deepEquals({a: 1})
			}
		})
	})
	o.spec("onhashchance", function() {
		o("onhashchange triggers on location.href change", function(done) {
			G.window.onhashchange = o.spy()
			G.window.location.href = "http://localhost/#a"

			callAsync(function(){
				o(G.window.onhashchange.callCount).equals(1)
				o(G.window.onhashchange.args[0].type).equals("hashchange")
				done()
			})
		})
		o("onhashchange triggers on relative location.href change", function(done) {
			G.window.onhashchange = o.spy()
			G.window.location.href = "#a"

			callAsync(function(){
				o(G.window.onhashchange.callCount).equals(1)
				done()
			})
		})
		o("onhashchange triggers on location.hash change", function(done) {
			G.window.onhashchange = o.spy()
			G.window.location.hash = "#a"

			callAsync(function(){
				o(G.window.onhashchange.callCount).equals(1)
				done()
			})
		})
		o("onhashchange does not trigger on page change", function(done) {
			G.window.onhashchange = o.spy()
			G.window.location.href = "http://localhost/a"

			callAsync(function(){
				o(G.window.onhashchange.callCount).equals(0)
				done()
			})
		})
		o("onhashchange does not trigger on page change with different hash", function(done) {
			G.window.location.href = "http://localhost/#a"
			callAsync(function(){
				G.window.onhashchange = o.spy()
				G.window.location.href = "http://localhost/a#b"

				callAsync(function(){
					o(G.window.onhashchange.callCount).equals(0)
					done()
				})
			})
		})
		o("onhashchange does not trigger on page change with same hash", function(done) {
			G.window.location.href = "http://localhost/#b"
			callAsync(function(){
				G.window.onhashchange = o.spy()
				G.window.location.href = "http://localhost/a#b"

				callAsync(function(){
					o(G.window.onhashchange.callCount).equals(0)
					done()
				})
			})
		})
		o("onhashchange triggers on history.back()", function(done) {
			G.window.location.href = "#a"
			callAsync(function(){
				G.window.onhashchange = o.spy()
				G.window.history.back()

				callAsync(function(){
					o(G.window.onhashchange.callCount).equals(1)
					done()
				})
			})
		})
		o("onhashchange triggers on history.forward()", function(done) {
			G.window.location.href = "#a"
			callAsync(function(){
				G.window.onhashchange = o.spy()
				G.window.history.back()
				callAsync(function(){
					G.window.history.forward()

					callAsync(function(){
						o(G.window.onhashchange.callCount).equals(2)
						done()
					})
				})
			})
		})
		o("onhashchange triggers once when the hash changes twice in a single tick", async () => {
			G.window.location.href = "#a"
			await waitAsync()
			G.window.onhashchange = o.spy()
			G.window.history.back()
			G.window.history.forward()
			await waitAsync()
			o(G.window.onhashchange.callCount).equals(1)
		})
		o("onhashchange does not trigger on history.back() that causes page change with different hash", function(done) {
			G.window.location.href = "#a"
			G.window.location.href = "a#b"
			callAsync(function(){
				G.window.onhashchange = o.spy()
				G.window.history.back()

				callAsync(function(){
					o(G.window.onhashchange.callCount).equals(0)
					done()
				})
			})
		})
		o("onhashchange does not trigger on history.back() that causes page change with same hash", function(done) {
			G.window.location.href = "#a"
			G.window.location.href = "a#a"
			callAsync(function(){
				G.window.onhashchange = o.spy()
				G.window.history.back()

				callAsync(function(){
					o(G.window.onhashchange.callCount).equals(0)
					done()
				})
			})
		})
		o("onhashchange does not trigger on history.forward() that causes page change with different hash", function(done) {
			G.window.location.href = "#a"
			G.window.location.href = "a#b"
			callAsync(function(){
				G.window.onhashchange = o.spy()
				G.window.history.back()
				G.window.history.forward()

				callAsync(function(){
					o(G.window.onhashchange.callCount).equals(0)
					done()
				})
			})
		})
		o("onhashchange does not trigger on history.forward() that causes page change with same hash", function(done) {
			G.window.location.href = "#a"
			G.window.location.href = "a#b"
			callAsync(function(){
				G.window.onhashchange = o.spy()
				G.window.history.back()
				G.window.history.forward()

				callAsync(function(){
					o(G.window.onhashchange.callCount).equals(0)
					done()
				})
			})
		})
	})
	o.spec("onunload", function() {
		o("onunload triggers on location.href change", function() {
			G.window.onunload = o.spy()
			G.window.location.href = "http://localhost/a"

			o(G.window.onunload.callCount).equals(1)
			o(G.window.onunload.args[0].type).equals("unload")
		})
		o("onunload triggers on relative location.href change", function() {
			G.window.onunload = o.spy()
			G.window.location.href = "a"

			o(G.window.onunload.callCount).equals(1)
		})
		o("onunload triggers on search change via location.href", function() {
			G.window.onunload = o.spy()
			G.window.location.href = "http://localhost/?a"

			o(G.window.onunload.callCount).equals(1)
		})
		o("onunload triggers on relative search change via location.href", function() {
			G.window.onunload = o.spy()
			G.window.location.href = "?a"

			o(G.window.onunload.callCount).equals(1)
		})
		o("onunload does not trigger on hash change via location.href", function() {
			G.window.onunload = o.spy()
			G.window.location.href = "http://localhost/#a"

			o(G.window.onunload.callCount).equals(0)
		})
		o("onunload does not trigger on relative hash change via location.href", function() {
			G.window.onunload = o.spy()
			G.window.location.href = "#a"

			o(G.window.onunload.callCount).equals(0)
		})
		o("onunload does not trigger on hash-only history.back()", function() {
			G.window.location.href = "#a"
			G.window.onunload = o.spy()
			G.window.history.back()

			o(G.window.onunload.callCount).equals(0)
		})
		o("onunload does not trigger on hash-only history.forward()", function() {
			G.window.location.href = "#a"
			G.window.history.back()
			G.window.onunload = o.spy()
			G.window.history.forward()

			o(G.window.onunload.callCount).equals(0)
		})
		o("onunload has correct url during call via location.href change", function(done) {
			G.window.onunload = function() {
				o(G.window.location.href).equals("http://localhost/")
				done()
			}
			G.window.location.href = "a"
		})
		o("onunload has correct url during call via location.search change", function(done) {
			G.window.onunload = function() {
				o(G.window.location.href).equals("http://localhost/")
				done()
			}
			G.window.location.search = "?a"
		})
	})
})
