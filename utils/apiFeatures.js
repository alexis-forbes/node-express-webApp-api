class APIFeatures {
  // this function gets called when we create a new object out of this class
  // mongosh query, queryString from express coming from the route
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  //create a method for each functionality
  filter() {
    // 1) Build query, allow filtering by creating a copy of the request query obj
    const queryObj = { ...this.queryString };
    // array of all fields to exclude
    const exclFields = ['page', 'sort', 'limit', 'fields'];
    exclFields.forEach((field) => {
      // remove fields from each query object in the array
      delete queryObj[field];
    });

    // 2) Advanced filtering
    // Convert obj to string
    let queryStr = JSON.stringify(queryObj);
    // use it to use replace function on it with REGEX
    // match and replace gte, gt, lte, lt with $... which is Mongodb operator
    // if we don't do this, the queryObj will not contain the $
    // g is to repeat the occurance not only replace it once
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    //find needs an object so we parse it
    //result from find is stored in this.query
    this.query = this.query.find(JSON.parse(queryStr));
    // this is the object for chaining these functions
    // if not, we don't get anything to sort on
    return this;
  }

  sorting() {
    // 3) Sorting
    if (this.queryString.sort) {
      // we want to sort the results based on the sort value
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      // sort('price ratingsAverage')
    } else {
      // add a default sorting -descending
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    // 4) Field limiting
    if (this.queryString.fields) {
      // we want to sort the results based on the fields value
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
      // select('price ratingsAverage difficulty')
    } else {
      // mongosh uses __v parameter to keep query fields
      // if there are no fields, we have everything except the __v field
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    // 5) Pagination
    // 1 is the default value
    const page = parseInt(this.queryString.page, 10) || 1;
    // the amount of results to return per page
    const limit = parseInt(this.queryString.limit, 10) || 100;
    //all resulsts before the page we are requesting now
    // if we want page #3, results will start at 21, if we want to skip 21 results,
    // 20 results is bcs we have 2 pages * 10 results in each
    // page -1 is previous page * number of results in each page will be skipped
    const skip = (page - 1) * limit;
    //request will be page=2&limit=10
    //1-10 page 1, 11-20 page 2, 21-30 page 3
    this.query = this.query.skip(skip).limit(limit);

    if (this.queryString.page) {
      //will return the # of documents
      const numTours = this.query.countDocuments();
      if (skip >= numTours) throw new Error('This page does not exist');
    }

    return this;
  }
}

module.exports = APIFeatures;
