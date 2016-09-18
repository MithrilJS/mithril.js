var mount = require("./mount")
var window = require("./window")

module.exports = require("./api/router")(window, mount)
