"use strict"

// Log levels are:
// * 0 error
// * 1 warning
// * 2 info
// * 3 debug

module.exports = {
  em: {
    logEventListeners:[],
    failEventListeners:[],

    log(level, message) {
      this.executeListeners(
        this.logEventListeners, 
        {level:level,message:message},
        () => {
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
        })
    },

    fail(error, vnode) {
      this.executeListeners(
        this.failEventListeners,
        {error:error, vnode:vnode},
        () => {
          this.debugVnode(0, vnode)
          if (error instanceof Error) 
            throw error
          else
            throw new Error(error)
        }
      )
    },

    debugVnode(level, vnode) {
      if (vnode) {
        this.log(level, "Context: " + JSON.stringify(vnode))
      }
    },

    addEventListener(name, callback) {
      switch (name) {
        case "log":
          this.addToArray(this.logEventListeners, callback)
          break
        case "fail":
          this.addToArray(this.failEventListeners, callback)
          break
      }
    },

    executeListeners(listeners, param, defaultHandler) {
      let stopProcessing = false;
      for (let i=0 ; i<listeners.length ; i++) {
        listeners[i](param, () => {stopProcessing=true})
        if (stopProcessing) return
      }
      defaultHandler()
    },

    addToArray(array, object) {
      for (let i=0 ; i<array.length ; i++) {
        if (array[i] === object) return
      }
      array.push(object)
    }
  }
}
