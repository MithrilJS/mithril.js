import PromisePolyfill from "./promise/promise.js"
import makeRequest from "./request/request.js"
import mountRedraw from "./mount-redraw.js"

export default makeRequest(typeof window !== "undefined" ? window : null, PromisePolyfill, mountRedraw.redraw)
