export var hasOwn = {}.hasOwnProperty

export var invokeRedrawable = async (redraw, fn, thisValue, ...args) => {
	if (typeof fn === "function") {
		thisValue = Reflect.apply(fn, thisValue, args)
		if (thisValue === "skip-redraw") return
		if (thisValue && typeof thisValue.then === "function" && (await thisValue) === "skip-redraw") return
		redraw()
	}
}

export var checkCallback = (callback, allowNull, label = "callback") => {
	if (allowNull && callback == null || typeof callback === "function") {
		return callback
	}

	throw new TypeError(`\`${label}\` must be a function${allowNull ? " if provided." : "."}`)
}
