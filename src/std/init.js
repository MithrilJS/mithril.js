import m from "../core.js"

var Init = ({f}, _, {redraw}) => m.layout(async (_, signal) => {
	await 0 // wait for next microtask
	if ((await f(signal)) !== false) redraw()
})
var init = (f) => m(Init, {f})

export {init as default}
