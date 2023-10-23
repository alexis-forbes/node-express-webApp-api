const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

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
  .then(() => console.log('DB connection successful!'))
  .catch(() => {
    //error handling
  });

// READ JSON FILE
// convert JSON into a JS object
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`));

// IMPORT DATA INTO DATABASE
const importData = async () => {
  try {
    // create a new object for each of the objects in the array
    await Tour.create(tours);
    console.log('Data successfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE DATA ALREADY IN THE DATABASE
const deleteData = async () => {
  try {
    // create a new object for each of the objects in the array
    await Tour.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
}
if (process.argv[2] === '--delete') {
  deleteData();
}
