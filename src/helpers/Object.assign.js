module.exports = function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];
    for (var prop in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        target[prop] = obj[prop];
      }
    }
  }
  return target;
};