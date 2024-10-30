import m from "../core.js"

import {Link, WithRouter} from "../std/router.js"
import {debouncer, throttler} from "../std/rate-limit.js"
import {match, p, query} from "../std/path-query.js"
import init from "../std/init.js"
import lazy from "../std/lazy.js"
import tracked from "../std/tracked.js"
import withProgress from "../std/with-progress.js"

m.WithRouter = WithRouter
m.Link = Link
m.p = p
m.query = query
m.match = match
m.withProgress = withProgress
m.lazy = lazy
m.init = init
m.tracked = tracked
m.throttler = throttler
m.debouncer = debouncer

export default m
