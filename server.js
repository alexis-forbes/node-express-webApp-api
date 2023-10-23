//here we will listen to our server, database configuration, env virables or error handling
const mongoose = require('mongoose');

const dotenv = require('dotenv');
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
app.listen(port, () => {
  // will be called as soon as server starts listening
  console.log(`listening on port ${port}`);
});
