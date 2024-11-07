import o from "ospec"

import {callAsync} from "../../test-utils/callAsync.js"
import {setupGlobals} from "../../test-utils/global.js"

o.spec("browserMock", function() {
	var G = setupGlobals()

	o("Mocks DOM and pushState", function() {
		o(G.window.location).notEquals(undefined)
		o(G.window.document).notEquals(undefined)
	})
	o("G.window.onhashchange can be reached from the pushStateMock functions", function(done) {
		G.window.onhashchange = o.spy()
		G.window.location.hash = "#a"

		callAsync(function(){
			o(G.window.onhashchange.callCount).equals(1)
			done()
		})
	})
	o("G.window.onpopstate can be reached from the pushStateMock functions", function() {
		G.window.onpopstate = o.spy()
		G.window.history.pushState(null, null, "#a")
		G.window.history.back()

		o(G.window.onpopstate.callCount).equals(1)
	})
	o("G.window.onunload can be reached from the pushStateMock functions", function() {
		G.window.onunload = o.spy()
		G.window.location.href = "/a"

		o(G.window.onunload.callCount).equals(1)
	})
})
