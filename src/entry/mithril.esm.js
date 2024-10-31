import m from "../core.js"

import {debouncer, throttler} from "../std/rate-limit.js"
import {link, route} from "../std/router.js"
import {match, p, query} from "../std/path-query.js"
import {tracked, trackedList} from "../std/tracked.js"
import fetch from "../std/fetch.js"
import init from "../std/init.js"
import lazy from "../std/lazy.js"

m.route = route
m.link = link
m.p = p
m.query = query
m.match = match
m.fetch = fetch
m.lazy = lazy
m.init = init
m.tracked = tracked
m.trackedList = trackedList
m.throttler = throttler
m.debouncer = debouncer

export default m
