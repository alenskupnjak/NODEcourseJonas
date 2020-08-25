const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const korisnik = require('./userModul');
const User = require('./userModul');
const Review = require('./reviewModel');

// Definiramo shemu zapisa koji ce nam sluziti za rad u programu
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, ' A tour must have name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have  < 40 characters'],
      minlength: [10, 'A tour name must have  > 10 characters'],
      validate: [validator.isAscii, 'Naslov smije imati samo slova'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have group size'],
    },
    difficulty: {
      type: String,
      required: [true, ' A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: ' Vrijednost težine mora biti easy/ medium / difficult',
      },
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, ' Rating must be above 1'],
      max: [5, ' Rating mora biti ispod 5'],
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // ovo vrijedi samo za nove dokumente
          return val < this.price;
        },
        message: '  priceDiscount je veci od price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // geojson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//
// Indeksiranje baze zbog bržeg pretraživanja
tourSchema.index({ price: 1, ratingAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

//
// Virtualna vrijednost, ne sprema se u bazu
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//
// document MIDDLEWARE, runs before .save() and .create()
// stvaramo npr. The snow adventure -> the-snow-adventure
// koji ce nam sluziti za izgradnju linka
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//
// prema unesenim korisnicima unesenim u polje "guide", pronalazimo korisnike i spremamo u bazi tours
tourSchema.pre('save', async function (next) {
  // dobivamo polje promise
  const guidesPromise = this.guides.map(async (el) => {
    return await korisnik.findById(el);
  });
  // riješavamo se Promise
  this.guides = await Promise.all(guidesPromise);

  next();
});

//
// za primjer document MIDDLEWARE, runs BEFORE .save() and .create()
tourSchema.pre('save', function (next) {
  console.log('Will save document..');
  next();
});

//
// document MIDDLEWARE, runs AFTER .save() and .create()
tourSchema.post('save', function (doc, next) {
  console.log('Poslije snimanja');

  next();
});

//
// pronalazi sve querie sa predznakom find****
// Izbacuje secret Tour iz query-ia
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

//
// pronalazi sve querie sa predznakom find****
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    // select:.... izbacujemo ono sto ne zelimo vidjeti
    select: '-__v -passwordChangedAt',
  });
  next();
});

//
//
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

//
// Definicija zapisa
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
