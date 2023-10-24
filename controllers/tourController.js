const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/* ----------- Read data before sending it -------------- */
// we need to parse the json so that it gets converted into an array of JS objects

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
// );

/* ----------------------------------  ROUTE HANDLERS/CONTROLLERS ---------------------------------- */

/* ----------- middleware for manipulating route for aliases ------------ */

exports.aliasTopTours = (req, res, next) => {
  // 6) Alises
  // a popular request we provide a simple route for the user
  // e.g. tours?limit=5&sort=-ratingsAverage,price = best and cheapest
  // a. we create a route in tourRoutes => top-5-cheap route
  // b. middleware to manipulate the tours we get => tourRoutes.js
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

/* ----------- GET tours and send it to the client -------------- */

exports.getAllTours = catchAsync(async (req, res, next) => {
  // 7) execute the query
  // Tour.find is the query object from mongosh
  // req.query is the query string ?... from the request route
  // features are an intance of our APIFeatures class
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sorting()
    .limitFields()
    .paginate();

  // features has all the documents after filtering
  const tours = await features.query;

  // 8) send response to the client
  res.status(200).json({
    status: 'Success',
    results: tours.length,
    data: {
      tours: tours,
    },
  });
});

/* ----------- GET one tour id and send it to the client -------------- */
// :id variable called id
// these variables are parameters and they are available in req.params
// to set optional parameters => /:id?/

exports.getOneTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // same as: Tour.findOne({ _id: req.params.id })
  // send data to the client
  if (!tour) {
    //go into catchAsync function
    return next(new AppError('No tour found with that id', 404));
  }
  res.status(200).json({
    status: 'Success',
    data: {
      tour: tour,
    },
  });
});

/* ----------- POST to create a new tour -------------- */

exports.createTour = catchAsync(async (req, res, next) => {
  // same as this: const newTour = new Tour({}) - newTour.save()
  // get data from request and send back response document with Mongoose
  const newTour = await Tour.create(req.body);
  // 201 stands for created a new resource
  res.status(201).json({
    status: 'created',
    data: {
      tour: newTour,
    },
    message: 'New tour created successfully',
  });
});

/* ----------- PATCH to update the properties that were updated -------------- */
// just send the data that is changing and not the entire object

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    // the new document will be returned instead of the original
    // each time we run a document the validators specified in the schema will run again
    // e.g. price is a Number, if we send a string we get an error message
  });

  if (!tour) {
    //go into catchAsync function
    return next(new AppError('No tour found with that id', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour,
    },
    message: 'Tour updated successfully',
  });
});

/* ----------- DELETE a tour  -------------- */

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    //go into catchAsync function
    return next(new AppError('No tour found with that id', 404));
  }

  // 204 is no content
  res.status(204).json({
    status: 'success',
    // resource deleted no longer exists
    // we don't send anything back to the client
    data: null,
    message: 'Tour deleted successfully',
  });
});

/* ----------- Aggregation: matching and grouping pipeline  -------------- */
exports.getTourStats = catchAsync(async (req, res, next) => {
  //aggregation pipeline is a mongodb feature
  //https://www.mongodb.com/docs/v7.0/reference/operator/aggregation-pipeline/
  //mongoosh gives us access in its driver
  //pipeline is like a query but we can manipulate the data
  //only when we await it, it comes back with the response object
  const stats = await Tour.aggregate([
    //stages: each one is a stage
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        //grouping results based on different fields like difficulty
        _id: { $toUpper: '$difficulty' },
        //for each of the docs that enter the pipeline +1 will be added
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      //sort descending
      $sort: { avgPrice: -1 },
    },
    //not include easy on the result
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
    message: 'Tour stats loaded successfully!',
  });
});

/* ----------- Aggregation: Unwinding and Projecting pipeline  -------------- */
// calculate bussiest month of a given year
// how many tours start at beginning of the month for each given year

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = parseInt(req.params.year, 10);
  const plan = await Tour.aggregate([
    //it will create a document for each month so if each document (9) has 3 months,
    //it will create 27 documents
    {
      $unwind: '$startDates',
    },
    //select documents for the year we passed as param
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    //we will group all these documents together into a single document by month
    //month will extract the month of the date
    {
      $group: {
        _id: { $month: '$startDates' },
        //how many tours start in that month
        numTourStats: { $sum: 1 },
        //which tour, with push we create an array
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        //we add a field called month w/ value of field _id
        month: '$_id',
      },
    },
    {
      $project: {
        //remove id field
        _id: 0,
      },
    },
    {
      $sort: {
        //sort by number of tours descending
        numTourStats: -1,
      },
    },
    {
      //will allow us to limit the number of outputs
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: plan,
    message: 'Tour with bussiest months loaded successfully!',
  });
});
