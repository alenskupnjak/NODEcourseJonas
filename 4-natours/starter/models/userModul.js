const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, ' Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, ' Please provide password'],
    minlength: 4,
    // ne prikazuje password u nijednomquery
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, ' Please confirm passvord'],
    validate: {
      validator: function (el) {
        // Ovo radi samo na  create i save
        return el === this.password;
      },
      message: 'Nisu isti passwordi! (poruka iz userModul.js)',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// ova funkcija radi za SIGNIN, generira enkripciju za password !
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcryptjs.hash(this.password, 12);

  // nakon provjere dobrog unosa passworda, passwordConfirm nam vise ne treba
  this.passwordConfirm = undefined;
  next();
});

// ovime obuhvatamo sve Query-e i definiramo da ne prikazuje neaktivne usere
userSchema.pre(/^find/, function (next) {
  // this points to the current query  svi koji nisu jednaki false.
  this.find({ active: { $ne: false } });
  next();
});

// usporeduje upisani pasword sa zapisanim u bazi, vraca TRUE/FALSE
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcryptjs.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  // False znači nema promjene
  return false;
};

// Definicija zapisa
const User = mongoose.model('User', userSchema);

module.exports = User;
