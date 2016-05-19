module.exports = {
    setTimeout : function($window) {
        $window.setTimeout = window.setTimeout;
        $window.clearTimeout = window.clearTimeout;
    },

    requestAnimationFrame : function($window) {
        $window.requestAnimationFrame = window.requestAnimationFrame;
        $window.cancelAnimationFrame = window.cancelAnimationFrame;
    }
}

