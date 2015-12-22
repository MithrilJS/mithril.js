import {deferred} from "./deferred.js";
import {forEach} from "./_iterate.js";

function sync(args) {
    var method = "resolve";
    var local = deferred();
    var outstanding = args.length;
    var results = new Array(outstanding);

    function synchronizer(pos, resolved) {
        return function(value) {
            results[pos] = value;
            if (!resolved) method = "reject";
            if (--outstanding === 0) {
                local.promise(results);
                local[method](results);
            }
            return value;
        };
    }

    if (args.length > 0) {
        forEach(args, function(arg, i) {
            arg.then(synchronizer(i, true), synchronizer(i, false));
        });
    }
    else local.resolve([]);

    return local.promise;
}

export {sync};
