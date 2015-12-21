import {initialize} from "./env.js";

//testing API
function deps(mock) {
    initialize(window = mock || window);
    return window;
};

//for internal testing only, do not use `m.deps.factory`
deps.factory = app;

export {deps};
