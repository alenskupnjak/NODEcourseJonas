const AppError = require('../utility/appError');
const Tour = require('../models/tourModel');

//
// Overview stranica
exports.getOverview = async (req, res, next) => {
  try {
    // 1) Get tour data from collection
    const tours = await Tour.find();

    // 2) Build template
    // 3) Render that template using tour data from 1)

    res.status(200).render('overview', {
      title: 'All tours',
      tours: tours,
    });
  } catch (error) {
    next(new AppError(error, 400));
  }
};

//
// Tour stranica
exports.getTour = async (req, res, next) => {
  try {
    // 1) Get the data, for the requested tour (including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });

    if (!tour) {
      // return window.location.assign('/');
      res.status(400).render('error', {
        title: 'Nešto je prošlo u krivo',
        msg: 'Takva tura ne postoji',
      });
      return next(new AppError('Nema ture sa takvim imenom', 400));
    }

    res.status(200).render('tour', {
      title: `${tour.name} tour`,
      tour,
    });
  } catch (error) {
    return new AppError(error, 400);
  }
};

//
// LOGIN
exports.login = async (req, res, next) => {
  try {
    res.status(200).render('login', {
      title: ' Login',
    });
  } catch (error) {
    return new AppError(error, 400);
  }
};

//
// Tour stranica
exports.pokus = async (req, res) => {
  try {
    res.status(200).render('tourTemplate', {
      title: 'Tour title',
    });
  } catch (error) {
    return new AppError(error, 400);
  }
};

// Tour stranica
exports.getAccount = async (req, res, next) => {
  try {
    res.status(200).render('account', {
      title: 'Your account',
    });
  } catch (error) {
    return new AppError(error, 400);
  }
};