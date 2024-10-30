import m from "../core.js"

function Init({f}, old) {
	if (old) return m.retain()
	var ctrl = new AbortController()
	void (async () => {
		await 0 // wait for next microtask
		if ((await f(ctrl.signal)) !== false) this.redraw()
	})()
	return m.remove(() => ctrl.abort())
}

var init = (f) => m(Init, {f})

export {init as default}
