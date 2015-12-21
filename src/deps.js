import {initialize} from "./_env.js";

//testing API
function deps(mock) {
    initialize(window = mock || window);
    return window;
}

export {deps};
