"use strict"

module.exports = function(renderers) {
    return function() {
        if (renderers.length === 0) return
        if (renderers.length === 1) return renderers[0]()
        
        for (var i = 0; i < renderers.length; i++) {
            renderers[i]()
        }
    }
}
