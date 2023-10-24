class AppError extends Error {
  //we want all out appError objects to inherit from the built in Error class
  constructor(message, statusCode) {
    //when we extend we pass super to call parent constructor
    //message is the only parameter the built in Error takes
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    //operational error
    this.isOperational = true;

    //when a new object is created and the constructor function is called
    //that function call is not going to polute the stack strace
    //this is our current object
    //this.constructor is our class constructor
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
