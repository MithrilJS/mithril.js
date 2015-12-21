function withAttr(prop, withAttrCallback, callbackThis) {
    return function(e) {
        e = e || event;
        var currentTarget = e.currentTarget || this;
        var _this = callbackThis || this;
        withAttrCallback.call(_this, prop in currentTarget ? currentTarget[prop] : currentTarget.getAttribute(prop));
    };
}

export {withAttr};
