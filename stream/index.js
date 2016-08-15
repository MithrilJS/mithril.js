"use strict";

var log = console.error.bind(console)
var StreamFactory = require("../util/stream")
var Stream = StreamFactory(log)

var stream = Stream.stream;
stream.combine = Stream.combine
stream.reject = Stream.reject
stream.merge = Stream.merge
stream.HALT = Stream.HALT

module.exports = stream;
