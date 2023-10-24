//here we will listen to our server, database configuration, env virables or error handling
const mongoose = require('mongoose');

const dotenv = require('dotenv');

/* ----------- Handle uncaught exceptions -------------- */
// e.g. calling something not defined
// console.log(x);
// needs to be listening from the beginning that is why it is here
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION! App crashed! Shutting down...');
  // gracefully shutdown server
  process.exit(1);
  // here we could restart the application (normally in production)
  // many hosting services do that out of the box
});

// it will read the variables and save them as env variables
// we need to do this before requiring our app as we configure Morgan there
dotenv.config({ path: './config.env' });

//this is our own module created in app.js
const app = require('./app');

/* ----------- Setting up Mongoose to connect to DB -------------- */

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() =>
    // the connection returns a promise
    // that value is the object passed into the ()
    // run the app
    // : means run so this command in package.json start:prod
    // would be npm run start: prod
    console.log('DB connection successful!'),
  )
  .catch(() => {
    //error handling
  });

/* ----------- Setting up the server -------------- */
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  // will be called as soon as server starts listening
  console.log(`listening on port ${port}`);
});

/* ----------- Handle unhandled rejections -------------- */
// e.g wrong password when connecting the DB
// each time there is an unhandled rejection in the app, the process object will emit an object called unhandledRejection
// we can subscribe to that event
//this is the last safety net
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! App crashed! Shutting down...');
  // 0 => success 1 => uncaught exception
  // shut down gracefully: first shutdown server
  server.close(() => {
    // and then shut the application
    process.exit(1);
  });
  // here we could restart the application (normally in production)
});
