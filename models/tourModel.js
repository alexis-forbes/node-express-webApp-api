/* eslint-disable prefer-arrow-callback */
const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');

// to perform CRUD we need a schema to describe data, for that we need a model
// schema type options are nested objects containing more configurations
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      //DATA VALIDATOR ON NEW DOCUMENT CREATION ONLY SO => POST TOUR
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
      validate: {
        validator: validator.isAlpha,
        message: 'Tour must only contain characters',
      },
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 4.5,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      //here in args we have access to the price value inputed
      validate: {
        validator: function (val) {
          //Validator: function which returns true or false.
          //If false: there is an error.
          //If true: validation is correct and input is accepted
          //this => will point to the current document ON NEW DOCUMENT CREATION ONLY
          return val < this.price;
        },
        //({VALUE}) is the value inputed (same as val) => Mongo thing
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      //will remove whitespace at beginning and end
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
      // select: false is to hide data from the client
      // good for info we don't want to show in the client like passwords
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    //options where we add virtuals to the schema object above when data is outputed as json and as object
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//virtual properties are fields we can define on our schema but they will not be saved in the db to save space
//e.g fields that can be derived from one another, conversion from miles to km
//it will be created each time we get data from the db

tourSchema.virtual('durationWeeks').get(function () {
  //arrow function does not get this keyword that points to the current document
  return this.duration / 7;
});

//document middelware to make something happen btw 2 events
//e.g run a command between the save command and the actual saving of the document or after
//also called pre and post hooks: document,query,aggregate and modal middleware

//DOCUMENT MIDDLEWARE
//can act on the currently processed document
//runs before .save() and .create() methods
//this middleware only runs on the methods above not in insertMany()
tourSchema.pre('save', function (next) {
  //will be called bf a document is saved in the db
  //this => current document being processed
  //argument objects are available in regular functions which makes it possible to get this
  //we want a slug for each document
  //slug => string we can put in the url based on some string like name
  //with this we can define a new property on the current document
  //we need to add this field in the schema as well for it to be saved in the db
  this.slug = slugify(this.name, { lower: true });
  next();
});

//we can have multiple pre and post middlewares for the same hook .save() .create()
// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });
//executed after all middlewares are completed
//we don't have this
//we have the finished document in doc
// tourSchema.post('save', function (doc, next) {
//   next();
// });

//QUERY MIDDLEWARE
//allows us to run functions before or after a query is executed
//will run before any .find() query gets executed
//REGEX for all methods starting with find to include findOne middleware GetOneTour
tourSchema.pre(/^find/, function (next) {
  //image we can have secret tours, for vip and public should not know
  //they won't appear in the result output
  //create secret tour field and query only for tours that are not secret
  //this is now a query object and we can change all query methods we have for queries
  //filter out the secret tour field set to true
  this.find({ secretTour: { $ne: true } });
  //measure how long it takes to execute current query
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  //query will be executed
  //current time - start time
  console.log(`Query took ${Date.now() - this.start} miliseconds`);
  next();
});

//AGREGGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  //this => points to the current aggregation object
  //to remove secret tours we have to add a match stage at the beginning of this pipeline array
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

//DATA VALIDATION
//checking if entered values are valid: in the right format and if all required fields are filled

//SANITAZATION
//if the input data is not malicious
//we remove unwanted characters or code from input data

// create a model for the schema
// always uppercase
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
