var $document,
    $location,
    $cancelAnimationFrame,
    $requestAnimationFrame;

function initialize(window) {
    $document = window.document;
    $location = window.location;
    $cancelAnimationFrame = window.cancelAnimationFrame || window.clearTimeout;
    $requestAnimationFrame = window.requestAnimationFrame || window.setTimeout;
}

export {
    initialize,
    $document,
    $location,
    $requestAnimationFrame,
    $cancelAnimationFrame
};
