"use strict"

var mountRedraw = require("../mount-redraw")
var m = require("../render/hyperscript")
var censor = require("./censor")

module.exports = (opts, redraw = mountRedraw.redraw) => {
	var fetched = false
	var Comp = () => ({view: () => opts.pending && opts.pending()})
	var e = new ReferenceError("Component not found")
	var ShowError = () => ({view: () => opts.error && opts.error(e)})

	return () => {
		if (!fetched) {
			fetched = true
			new Promise((resolve) => resolve(opts.fetch())).then(
				(result) => {
					Comp = typeof result === "function"
						? result
						: result && typeof result.default === "function"
							? result.default
							: ShowError
					redraw()
				},
				(error) => {
					Comp = ShowError
					e = error
					if (!opts.error) console.error(error)
					redraw()
				}
			)
		}

		return {view: ({attrs}) => m(Comp, censor(attrs))}
	}
}
