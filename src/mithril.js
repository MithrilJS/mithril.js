import {initialize} from "./env.js";

import {component} from "./component.js";
import {deps} from "./deps.js";
import {mount} from "./mount.js";
import {parse} from "./parse.js";
import {prop} from "./prop.js";
import {redraw} from "./redraw.js";
import {render} from "./render.js";
import {request} from "./request.js";
import {route} from "./route.js";
import {sync} from "./sync.js";
import {trust} from "./trust.js";
import {withAttr} from "./with-attr.js";

initialize(window);

var m = parse;

m.version = function() {
    return "v0.2.3";
};

m.component = component;
m.deps = deps;
m.mount = mount;
m.prop = prop;
m.redraw = redraw;
m.render = render;
m.request = request;
m.route = route;
m.sync = sync;
m.trust = trust;
m.withAttr = withAttr;

export default m;
