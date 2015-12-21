import {prop} from "./prop.js";
import {request} from "./request.js";
import {redraw} from "./redraw.js";
import {route} from "./route.js";
import {mount} from "./mount.js";
import {component} from "./component.js";
import {trust} from "./trust.js";
import {parse} from "./parse.js";

var m = parse;

m.version = function() {
    return "v0.2.3";
};

m.mount = mount;
m.prop = prop;
m.redraw = redraw;
m.request = request;
m.route = route;
m.trust = trust;
m.component = component;

export default m;
