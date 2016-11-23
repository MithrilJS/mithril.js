var m = require("./index")
m.stream = require("./stream")
m.stream.scan = require("./stream/scan")
m.stream.scanMerge = require("./stream/scanMerge")
if (typeof module !== "undefined") module["exports"] = m
else window.m = m
