import m from "../core.js"

import {checkCallback, noop} from "../util.js"

var lazy = (opts) => {
	checkCallback(opts.fetch, false, "opts.fetch")
	checkCallback(opts.pending, true, "opts.pending")
	checkCallback(opts.error, true, "opts.error")

	// Capture the error here so stack traces make more sense
	var error = new ReferenceError("Component not found")
	var redraws = new Set()
	var Comp = function () {
		redraws.add(checkCallback(this.redraw, false, "context.redraw"))
		return opts.pending && opts.pending()
	}
	var init = async () => {
		init = noop
		try {
			Comp = await opts.fetch()
			if (typeof Comp !== "function") {
				Comp = Comp.default
				if (typeof Comp !== "function") throw error
			}
		} catch (e) {
			console.error(e)
			Comp = () => opts.error && opts.error(e)
		}
		var r = redraws
		redraws = null
		for (var f of r) f()
	}

	return (attrs) => {
		init()
		return m(Comp, attrs)
	}
}

export {lazy as default}
