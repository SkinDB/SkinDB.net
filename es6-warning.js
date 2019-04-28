var supportsES6 = function () {
  try {
    new Function('(a = 0) => a');
    return true;
  } catch (err) {
    return false;
  }
}();

if (!supportsES6) {
  // ToDo Show warning
}