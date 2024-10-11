import m from "../core.js"

var lazy = (opts) => {
	// Capture the error here so stack traces make more sense
	var error = new ReferenceError("Component not found")
	var redraws = new Set()
	var Comp = (_, __, context) => {
		redraws.add(context.redraw)
		return opts.pending && opts.pending()
	}
	var init = async () => {
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
		var f = init
		init = undefined
		if (typeof f === "function") f()
		return m(Comp, attrs)
	}
}

export {lazy as default}
