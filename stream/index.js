"use strict"

var log = console.error.bind(console)
var StreamFactory = require("../util/stream")
var Stream = StreamFactory(log)

var s = Stream.stream
s.combine = Stream.combine
s.reject = Stream.reject
s.merge = Stream.merge
s.HALT = Stream.HALT

module.exports = s
