import {redraw} from "./redraw.js";

var pendingRequests = 0;

function start() {
    pendingRequests++;
}

function end() {
    if (pendingRequests > 1) {
        pendingRequests--;
    }
    else {
        pendingRequests = 0;
        redraw();
    }
}

function endFirst() {
    if (redraw.strategy() === "none") {
        pendingRequests--;
        redraw.strategy("diff");
    }
    else {
        end();
    }
}

function clear() {
    pendingRequests = 0;
}

export {
    start,
    end,
    endFirst,
    clear,
    pendingRequests
};
