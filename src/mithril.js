import {initialize} from "./env.js";

import {component} from "./component.js";
import {mount} from "./mount.js";
import {parse} from "./parse.js";
import {prop} from "./prop.js";
import {redraw} from "./redraw.js";
import {render} from "./render.js";
import {request} from "./request.js";
import {route} from "./route.js";
import {trust} from "./trust.js";

initialize(window);

var m = parse;

m.version = function() {
    return "v0.2.3";
};

m.component = component;
m.mount = mount;
m.prop = prop;
m.redraw = redraw;
m.render = render;
m.request = request;
m.route = route;
m.trust = trust;

export default m;
