import makeMountRedraw from "./api/mount-redraw.js"
import render from "./render.js"

export default makeMountRedraw(render, typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : null, typeof console !== "undefined" ? console : null)
