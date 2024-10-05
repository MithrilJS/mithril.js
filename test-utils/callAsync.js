/* global setImmediate */
export default typeof setImmediate === "function" ? setImmediate : setTimeout
