const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Rewiew can not bee empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Rewiew must belong to thour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Rewiew must have User'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// indexirali BAZU prema tour i schema
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// pronalazi sve querie sa predznakom find****
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   // select:.... izbacujemo ono sto ne zelimo vidjeti
  //   // select: 'name -__v -passwordChangedAt',
  //   select: 'name',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  if (tourId) {
    const stats = await this.aggregate([
      {
        $match: { tour: tourId },
      },
      {
        $group: {
          _id: '$tour',
          numRating: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: Math.round(stats[0].numRating * 100) / 100,
      ratingAverage: Math.round(stats[0].avgRating * 100) / 100,
    });
  }
};

reviewSchema.post('save', function () {
  // this point to the current reviewSchema
  // this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  console.log(this.r);
  console.log('reviewSchema.pre -----');
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.tours);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
