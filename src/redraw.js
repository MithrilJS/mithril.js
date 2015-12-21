import {prop} from "./prop.js";
import {$requestAnimationFrame, $cancelAnimationFrame} from "./_env.js";

var redrawing = false,
    forcing = false,
    lastRedrawId = null,
    lastRedrawCallTime = 0,
    FRAME_BUDGET = 16, //60 frames per second = 1 call per 16 ms
    computePreRedrawHook = null,
    computePostRedrawHook = null;

function preredraw(value) {
    computePreRedrawHook = value;
}

function postredraw(value) {
    computePostRedrawHook = value;
}

function redraw(force) {
    if (redrawing) return;
    redrawing = true;
    if (force) forcing = true;
    try {
        //lastRedrawId is a positive number if a second redraw is requested before the next animation frame
        //lastRedrawID is null if it's the first redraw and not an event handler
        if (lastRedrawId && !force) {
            //when rAF: always reschedule redraw
            //when setTimeout: only reschedule redraw if time between now and previous redraw is bigger than a frame,
            //otherwise keep currently scheduled timeout
            if ($requestAnimationFrame === window.requestAnimationFrame
                || Date.now() - lastRedrawCallTime > FRAME_BUDGET) {
                if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId);
                lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET);
            }
        }
        else {
            redraw();
            lastRedrawId = $requestAnimationFrame(function() { lastRedrawId = null; }, FRAME_BUDGET);
        }
    }
    finally {
        redrawing = forcing = false;
    }
}

redraw.strategy = prop();

export {
    redraw,
    forcing,
    lastRedrawCallTime,
    lastRedrawId,
    preredraw,
    postredraw
};
