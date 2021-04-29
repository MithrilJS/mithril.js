import PromisePolyfill from "./promise/polyfill.js"
import Vnode from "./render/vnode.js"
import buildPathname from "./pathname/build.js"
import buildQueryString from "./querystring/build.js"
import censor from "./util/censor.js"
import hyperscript from "./hyperscript.js"
import mountRedraw from "./mount-redraw.js"
import parsePathname from "./pathname/parse.js"
import parseQueryString from "./querystring/parse.js"
import render from "./render.js"
import request from "./request.js"
import route from "./route.js"

var m = function m() { return hyperscript.apply(this, arguments) }
m.m = hyperscript
m.trust = hyperscript.trust
m.fragment = hyperscript.fragment
m.mount = mountRedraw.mount
m.route = route
m.render = render
m.redraw = mountRedraw.redraw
m.request = request.request
m.jsonp = request.jsonp
m.parseQueryString = parseQueryString
m.buildQueryString = buildQueryString
m.parsePathname = parsePathname
m.buildPathname = buildPathname
m.vnode = Vnode
m.PromisePolyfill = PromisePolyfill
m.censor = censor

export default m
