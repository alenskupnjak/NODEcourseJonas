const Review = require('../models/reviewModel');
const AppErrorEdit = require('../utility/appErrorEdit');

const greske = new AppErrorEdit();

exports.getAllReviews = async (req, res) => {
  try {
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }
    //EXECUTE QUERY
    const reviews = await Review.find(filter);

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: {
        tours: reviews,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.createReview = async (req, res, next) => {
  try {
    // ako u body nema tour , očiravamo iz linka
    if (!req.body.tour) {
      req.body.tour = req.params.tourId;
    }
    // dobivamo podatak koji je user iz authController.protect
    if (!req.body.user) {
      req.body.user = req.user.id;
    }
    const newRewiew = await Review.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newRewiew,
      },
    });
  } catch (err) {
    greske.baciGresku(err, res);
  }
};

// brisemo Review
exports.deleteReview = async (req, res) => {
  try {
    let podaciUser = await Review.find();

    podaciUser = podaciUser.map((el) => {
      return el.id;
    });
    console.log(req.params.id);
    
    const obrisaniUser = await Review.findByIdAndDelete(req.params.id);
    res.status(200).json({
      reqUser: req.user,
      status: 'sucess',
      obrisaniUser,
      podaciUser,
    });
  } catch (error) {
    greske.baciGresku(error, res);
  }
};

//
// UPDATE Review
exports.updatedReview = async (req, res) => {
  try {
    let podaciUser = await Review.find();

    podaciUser = podaciUser.map((el) => {
      return el.id;
    });

    // const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    //   new: true,
    //   runValidators: true,
    // });

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    res.status(200).json({
      reqUser: req.user,
      status: 'sucess',
      updatedReview,
      podaciUser,
    });
  } catch (error) {
    greske.baciGresku(error, res);
  }
};
