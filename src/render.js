import makeRender from "./render/render.js"

export default makeRender(typeof window !== "undefined" ? window : null)
