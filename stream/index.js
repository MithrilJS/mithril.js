"use strict"

var log = console.error.bind(console)
var StreamFactory = require("../util/stream")
var Stream = StreamFactory(log)

var defaultStream = Stream.stream
defaultStream.combine = Stream.combine
defaultStream.reject = Stream.reject
defaultStream.merge = Stream.merge
defaultStream.HALT = Stream.HALT

module.exports = defaultStream
