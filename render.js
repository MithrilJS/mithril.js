"use strict"

// When running in node, we get reference errors on import
// unless we have window, document, requestAnimationFrame
try {
	var isRunningInNode = global.process.version // a good enough proxy
	if (isRunningInNode){
		global.window = global.window || undefined
		global.document = global.document || undefined
		global.requestAnimationFrame = global.requestAnimationFrame || undefined
	}
}
finally {
	null
}

module.exports = require("./render/render")(window)
