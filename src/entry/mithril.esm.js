/* global window: false, requestAnimationFrame: false */
import m from "../core/hyperscript.js"
import makeMountRedraw from "../core/mount-redraw.js"
import render from "../core/render.js"

import init from "../std/init.js"
import lazy from "../std/lazy.js"
import makeRouter from "../std/router.js"
import p from "../std/p.js"
import tracked from "../std/tracked.js"
import use from "../std/use.js"
import withProgress from "../std/with-progress.js"

var mountRedraw = makeMountRedraw(typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : null, typeof console !== "undefined" ? console : null)

m.mount = mountRedraw.mount
m.redraw = mountRedraw.redraw
m.redrawSync = mountRedraw.redrawSync
m.route = makeRouter(typeof window !== "undefined" ? window : null, mountRedraw.redraw)
m.render = render
m.p = p
m.withProgress = withProgress
m.lazy = lazy
m.init = init
m.use = use
m.tracked = tracked

export default m
