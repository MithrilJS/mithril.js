var _fns = []
var _last  = 0
var _frame = 1000 / 60

module.exports = {
    setTimeout : function($window) {
        $window.setTimeout = typeof window === "object" ? window.setTimeout : global.setTimeout;
        $window.clearTimeout = typeof window === "object" ? window.clearTimeout : global.setTimeout;
    },

    requestAnimationFrame : function($window) {
        // Modified version of https://github.com/chrisdickinson/raf
        // Copyright chrisdickinson I guess?
        $window.requestAnimationFrame = typeof window === "object" ? window.requestAnimationFrame : function(fn) {
            if(!_fns.length) {
                var now = Date.now()
                var next = Math.max(0, _frame - (now - _last))
                
                _last = next + now
                
                setTimeout(function() {
                    var fns = _fns.slice()
                    
                    _fns = []
                    
                    for(var i = 0; i < fns.length; i++) {
                        if(typeof fns[i] !== "function") {
                            continue
                        }
                        
                        fns[i](_last)
                    }
                }, Math.round(next))
            }
            
            _fns.push(fn)
            
            return _fns.length - 1;
        }
        
        $window.cancelAnimationFrame = typeof window === "object" ? window.cancelAnimationFrame : function(handle) {
            _fns[handle] = null
        };
    }
}

