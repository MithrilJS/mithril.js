"use strict"

var mountRedraw = require("../core/mount-redraw")
var m = require("../core/hyperscript")

module.exports = (opts, redraw = mountRedraw.redraw) => {
	var fetched = false
	var Comp = () => opts.pending && opts.pending()
	var e = new ReferenceError("Component not found")
	var ShowError = () => opts.error && opts.error(e)

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

		return (attrs) => m(Comp, attrs)
	}
}
