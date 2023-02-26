"use strict"

// Log levels are:
// * 0 error
// * 1 warning
// * 2 info
// * 3 debug

module.exports = {
  em: {
    log(level, message) {
      switch (level) {
        case 0:
          console.error(message)
          break;
        case 1:
          console.warn(message)
          break;
        case 2:
          console.info(message)
          break;
        case 3:
          console.debug(message)
          break;
      }
    },

    fail(error, vnode) {
      this.debugVnode(0, vnode)
      if (e instanceof Error) 
        throw error
      else
        throw new Error(e)
    },

    debugVnode(level, vnode) {
      if (vnode) {
        this.log(level, "Context: " + JSON.stringify(vnode))
      }
    }
  }
}
