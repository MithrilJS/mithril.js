module.exports = function() {
  var queue = []
  return {
    throttle: function(fn) {
      var pending = false
      return function() {
        if (!pending) {
          queue.push(function(){
            pending = false
            fn()
          })
          pending = true
        }
      }
    },
    fire: function() {
      queue.forEach(function(fn) {fn()})
      queue.length = 0
    },
    queueLength: function(){
      return queue.length
    }
  }
}
