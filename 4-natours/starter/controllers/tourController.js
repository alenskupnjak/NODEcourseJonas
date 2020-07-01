const multer = require('multer');
const sharp = require('sharp');
const APIFeatures = require('../utility/apiFeatures');
const Tour = require('../models/tourModel');
const AppErrorEdit = require('../utility/appErrorEdit');
const AppError = require('../utility/appError');

const greske = new AppErrorEdit();

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = async (req, res, next) => {
  console.log('001', req.files);
  console.log('002', req.files.images);

  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];

  // riješavamo se Promise
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
};

// upload.single('image');
// upload.array('images', 5);

//
// Middelwear, predefinirani query za rutu:
exports.aliasTopTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingAverage';
  req.query.fields = 'name,price,difficulty,summary';
  next();
};

//
// GET - povlačenje svih tura
exports.getAllTours = async (req, res) => {
  try {
    //EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // konačni podatak
    const tours = await features.query;
    const toursExplain = await features.query.explain();

    // tours.forEach((element) => {
    //   console.log(element.name);
    //   console.log(element.startDates);
    // });

    // send response
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours: tours,
        toursExplain: toursExplain,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
};

//
// get podatke jedne ture
exports.getTour = async (req, res) => {
  try {
    // dohvacamo sve zapise
    const tours = await Tour.findById(req.params.id).populate('reviews');

    // const tours1 = await Tour.findOne({ price: 397 });
    // console.log(tours1);

    let id = await Tour.find();
    let idzadnjiUpisan;
    const lista = [];
    id = id.map((el, index) => {
      if (id.length - 1 === index) {
        idzadnjiUpisan = el.id;
      }
      lista.push(el.id, el.name);
      return [el.id, el.name];
    });

    res.status(200).json({
      status: 'success',
      data: {
        tours: tours,
      },
      lista: lista,
      id,
      idzadnjiUpisan: idzadnjiUpisan,
    });
  } catch (error) {
    greske.baciGresku(error, res);
    // console.log(nesto);

    // if (process.env.NODE_ENV === 'development') {
    //   res.status(404).json({
    //     status: 'fail',
    //     message: 'Nisam uspio pronaci zapis u datoteci',
    //   });
    // } else {
    //   res.status(404).json({
    //     message: 'Nešto nije u redu....',
    //   });
    // }
  }
};

//
// CREATE TOUR
exports.createTour = async (req, res, next) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    greske.baciGresku(err, res);
    // res.status(400).json({
    //   status: 'fail',
    //   message: err,
    // });
  }
};

//
// DELETE - jednu turu
exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    let tours = await Tour.find();

    tours = tours.map((el) => {
      return el.id;
    });
    // console.log(tours);

    res.status(200).json({
      status: 'success',
      data: {
        tours: tours,
      },
      // data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

//
// DELETE - Brisem zadnje ture brema unesenom broju sluzi za testitanje
exports.obrisiViseTura = async (req, res) => {
  try {
    // broj zadnjih tura koje zelimo obrisati.
    const broj = req.params.brojTuraObrisati;

    // dohvacam sve ture iz baze
    const tours = await Tour.find();

    tours.forEach(async (el, index) => {
      if (index >= tours.length - broj) {
        await Tour.findByIdAndDelete(el.id);
      }
    });

    //  tours = await Tour.find();

    // console.log(poljetours);

    // poljetours.forEach(async (el) => {
    //   await Tour.findByIdAndDelete(el);
    // });

    res.status(201).json({
      status: 'success',
      brojZapisa: tours.length,
      data: {
        tours: tours,
      },
      // data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

//
// UPDATE - mijenjamo podatke u turi
exports.updateTour = async (req, res) => {
  try {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    let ture = await Tour.find();
    const podaci = [];
    ture = ture.map((el) => {
      podaci.push(el.name, el.id);
      const data = {
        name: el.name,
        id: el.id,
      };
      return data;
    });
    res.status(200).json({
      status: 'success',
      podaciture: podaci,
      turedata: ture,
      data: {
        tour: updatedTour,
      },
    });
  } catch (err) {
    greske.baciGresku(err, res);
    // res.status(400).json({
    //   status: 'fail',
    //   message: err,
    // });
  }
};

//
// za rutu '/tour-stats'
exports.getTourStatus = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: '&ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);

    res.status(200).json({
      status: 'success',
      duljinaZapisa: stats.length,
      data: {
        stats: stats,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getMontlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 6,
      },
    ]);

    res.status(200).json({
      status: 'success',
      duljinaZapisa: plan.length,
      data: {
        plan: plan,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'pao sam',
      message: err,
    });
  }
};

//
//
exports.getAllTourID = async (req, res) => {
  try {
    //EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    let toursID = await Tour.find();
    toursID = Object.values(toursID);

    // konačni podatak
    const tours = await features.query;

    const allId = tours.map((element) => {
      return { id: element.id, summary: element.summary };
    });

    // send response
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        id: allId,
        toursID: toursID,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
};

//
// racuna udaljenost izmedu gradova
exports.getToursWithin = async (req, res, next) => {
  try {
    console.log('tutu');

    console.log(req.params);

    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    // const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    let radius;
    if (unit === 'mi') {
      radius = distance / 3963.2;
    } else {
      radius = distance / 6378.1;
    }

    console.log(radius);

    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitutr and longitude in the format lat,lng.',
          400
        )
      );
    }

    console.log(distance, lat, lng, unit);

    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours,
      },
    });
  } catch (error) {
    greske.baciGresku(error, res);
  }
};

//
// Racunanje udaljenosti izmedu tocaka
exports.getDistances = async (req, res, next) => {
  console.log('tutu');

  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
        duration: true,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
};
