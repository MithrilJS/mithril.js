import { prop } from "./prop.js";
import { request } from "./request.js";
import parse from "./parse.js";

var m = parse;

m.version = function () {
    return "v0.2.2-rc.1";
};

m.prop = prop;
m.request = request;

export default m;
