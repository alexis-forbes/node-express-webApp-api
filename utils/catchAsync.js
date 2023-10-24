/* ----------- CATCH ASYNC ERRORS -------------- */
//why? to avoid having try catch blocks in every controller, we handle errors here
module.exports =
  (fn) =>
  //receives an async function which returns a promise
  //return an anonymous function which will catch the error and return the result of the function call back to the client
  //result will be assigned to createTour
  //this way this function can be called when necessary
  //otherwise we would not have access to the parameters
  (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
