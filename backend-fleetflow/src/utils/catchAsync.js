/**
* Wraps an async route handler to automatically catch errors
* and forward them to the global error handler.
* @param {Function} fn - async express handler
*/
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
