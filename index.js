"use strict"

var m = require("./hyperscript")
var requestService = require("./request")
var redrawService = require("./redraw")

m.mount = require("./mount")
m.route = require("./route")
m.withAttr = require("./util/withAttr")
m.render = require("./render").render
m.redraw = redrawService.redraw
m.request = function(){
  var request = requestService.request.apply(this, arguments)
  var options = arguments[1] || arguments[0]

  if(options.redraw !== false){
    request.then(redrawService.publish)
    request.catch(redrawService.publish)
  }

  return request
}
m.jsonp = requestService.jsonp
m.parseQueryString = require("./querystring/parse")
m.buildQueryString = require("./querystring/build")
m.version = "bleeding-edge"

module.exports = m
