import apiRouter from "./api/router.js"
import mountRedraw from "./mount-redraw.js"

export default apiRouter(typeof window !== "undefined" ? window : null, mountRedraw)
