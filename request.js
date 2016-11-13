var Stream = require("./stream")
var window = require("./window")

module.exports = require("./request/request")(window, Stream)
