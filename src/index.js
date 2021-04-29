/* eslint-env commonjs */
import "./render.js"
import "./mount-redraw.js"
import "./promise.js"
import "./route.js"
import "./request.js"
import "./buildPathname.js"
import "./buildQueryString.js"
import "./censor.js"
import m from "./m.js"

if (typeof module !== "undefined") module["exports"] = m
else window.m = m
