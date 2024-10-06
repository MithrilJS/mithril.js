import m from "../core.js"

var lazy = (opts, redraw = m.redraw) => {
	// Capture the error here so stack traces make more sense
	var error = new ReferenceError("Component not found")
	var Comp = () => opts.pending && opts.pending()
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
		redraw()
	}

	return (attrs) => {
		var f = init
		init = undefined
		if (typeof f === "function") f()
		return m(Comp, attrs)
	}
}

export {lazy as default}
