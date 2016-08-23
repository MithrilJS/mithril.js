var redrawService = require("./redraw")

requestService.setCompletionCallback(redrawService.publish)

module.exports = require("./request/request")(window, console.error.bind(console))
