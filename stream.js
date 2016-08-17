var StreamFactory = require("./util/stream")
module.exports = StreamFactory(console.log.bind(console))