var renderService = require("./render")
var redrawService = require("./redraw")

module.exports = require("./api/mount")(renderService, redrawService)