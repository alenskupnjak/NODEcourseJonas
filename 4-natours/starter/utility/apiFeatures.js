class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //BUILD QUERY
    //1 a) filtering
    // kreirana nova kopija
    const queryObj = { ...this.queryString };

    // definiram polja koja zelim iskljuciti iz upita
    const excludesFileds = ['page', 'sort', 'limit', 'fields'];

    // iz queria brisem vrijednosti excludesFileds , ako ih ima
    excludesFileds.forEach((el) => {
      return delete queryObj[el];
    });

    // 1b) advanced filtering, mijenjamo npr gte => $gtr zbog sintakse mongoosa
    let queryStr = JSON.stringify(queryObj);

    //  gte => $gtr, gt =>$gte, lte => $gte, lt =>$gte
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      // sintaksa za filtriranje po dva krirerija je
      // ...sort('price ratingAverage)
      // za obrnuti smjer filtriranja treba dodati predznak minus (-)
      // ...sort('-price ratingAverage)
      // console.log(req.query.sort, req.query.sort.split(','));
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryStringpage * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
