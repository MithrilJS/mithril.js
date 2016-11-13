module.exports = typeof window === "undefined" ? require("./test-utils/browserMock")() : window
