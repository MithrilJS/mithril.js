import m from "../core.js"

import {p} from "../util.js"

var Init = ({f}) => m.layout((_, signal, isInit) => isInit && p.then(() => f(signal)))
var init = (f) => m(Init, {f})

export {init as default}
