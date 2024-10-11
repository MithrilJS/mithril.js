import m from "../core.js"

import {Link, WithRouter} from "../std/router.js"
import init from "../std/init.js"
import lazy from "../std/lazy.js"
import p from "../std/p.js"
import tracked from "../std/tracked.js"
import use from "../std/use.js"
import withProgress from "../std/with-progress.js"

m.WithRouter = WithRouter
m.Link = Link
m.p = p
m.withProgress = withProgress
m.lazy = lazy
m.init = init
m.use = use
m.tracked = tracked

export default m
