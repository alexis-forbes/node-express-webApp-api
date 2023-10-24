// Convention to have all Express configuration here
const express = require('express');

const app = express();

// for logging purposes
const morgan = require('morgan');

//custom AppError class
const AppError = require('./utils/appError');

//error middleware handler
const globalErrorHandler = require('./controllers/errorController');

/* ------ APP FLOW EXPLINATION -------- */
/* We start by receiving a request in app.js file, 
it will then depending on the route enter one of the routers in the routes folder. 
Depending on that route or request it will execute one of the controllers
in the controller file. Then the response gets sent and finishes the request-response cycle  */

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

/* ----------- MIDDLEWARES -------------- */

// we only want the logging when the app is in dev and not in prod mode
if (process.env.NODE_ENV === 'development') {
  // calling this function will return a function which returns a logger function
  // can be seen in index.js in github.com/morgan/morgan
  // it logs info about the request to the console
  app.use(morgan('dev'));
}

// express.json() calling it returns a function
// this function is added to the middleware stack
// this middleware can modify the income request data
// in the middle of request and response
// the data from the body is added to the request object by using this middleware
// this already parses the data from the request body
app.use(express.json());

// with this middleware we can access static files in our file system within public folder
// we don't need public in the url path it sets the folder to the root of the website
// go to http://localhost:3000/overview.html
app.use(express.static(`${__dirname}/public`));

//we can create our own middleware function with app.use
// pass in function we want to use in the middleware stack
app.use((req, res, next) => {
  // we have defined a middleware function
  next();
});

// middleware to manipulate the request object
app.use((req, res, next) => {
  // add current time to the request object
  req.requestTime = new Date().toISOString();
  next();
});

/* ----------- ALL ROUTES -------------- */

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getOneTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// mounting the routers into the routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

/* ------ ROUTE HANDLER FOR NON-EXISTING ROUTES -------- */
//at the end because if the above routes have not catched any route, it means it does not exist
//if we do it above, every request will hit this route
//app.all => for all http methods
//* => everything
app.all('*', (req, res, next) => {
  //send a JSON response
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

/* ------ ERROR MIDDLEWARE -------- */
app.use(globalErrorHandler);

module.exports = app;
