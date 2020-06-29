const crypto = require('crypto');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModul');
const AppErrorEdit = require('../utility/appErrorEdit');
const AppError = require('../utility/appError');
const sendEmail = require('../utility/email');

const greske = new AppErrorEdit();
//
// SIGNUP SIGNUP SIGNUP SIGNUP
exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: new Date().toISOString(),
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      secure: false,
      httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    res.status(201).json({
      status: 'success',
      token: token,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    greske.baciGresku(error, res);
  }
};

//
// LOGIN logiranje korisnika
exports.login = async (req, res, next) => {
  try {
    // upisan email i password
    const { email } = req.body;
    const { password } = req.body;

    // const { email, password } = req.body;

    // 1) Check if email and password exists
    if (!email || !password) {
      return next(new AppError('Upisi ispravni email i lozinku', 400));
    }

    // 2) Check if user exist && password is correctPassword
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Takav korisnik ne postoji u bazi', 400));
      // throw new Error('Nema usera');
    }

    // provjeravamo dali je upisani password jednak passwordu u bazi
    // const correct = await user.correctPassword(password, user.password);

    const correct = await bcryptjs.compare(password, user.password);

    if (!correct) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3) if everythin is OK, send token to client
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      secure: false,
      httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    res.status(201).json({
      status: 'success',
      token: token,
      data: {
        user,
      },
    });
  } catch (err) {
    greske.baciGresku(err, res);
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

/////////////////////////////////////
///// Zastita rute
exports.protect = async (req, res, next) => {
  try {
    let token;
    //1) Getting the token an check of it is there
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    // ako nema tokena salje ga u centralni Middelware za greške
    if (!token) {
      return next(new AppError('Nisi logiran. Molim logirajte ste', 401));
    }

    // 2) verification tokens, dekodira usera, vraca vrijednost npr { id: '5ee8a752decbb00b601e3cc5', iat: 1592390190, exp: 1592393790 }
    const decoded = jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
      if (err) {
        throw new Error(err);
      } else {
        return data;
      }
    });

    // 3) Check if user still exists
    const currentUuser = await User.findById(decoded.id);
    if (!currentUuser) {
      return next(new AppError('Korisnik vise ne postoji', 401));
    }

    // 4) Check if user changed password
    if (currentUuser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('Password nedavno promjenjen', 401));
    }

    // ako je program došao do ovoga sva testiranja su OK, nastavlja dalje sa radom
    req.user = currentUuser;

    next();
  } catch (error) {
    greske.baciGresku(error, res);
  }
};

//
// Ograničavamo mogučnost DELETE i kreiranju rutaobičnim usima
exports.restrictTo = (poljeAdmin) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']
    if (!poljeAdmin.includes(req.user.role)) {
      return next(
        new AppError('You do not have permision to do to action'),
        403
      );
    }
    next();
  };
};

//
// davanje user novi password
exports.forgotPassword = async (req, res, next) => {
  try {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });

    // ako korisnik nije pronaden prikazuje grešku
    if (!user) {
      return next(new AppError('Takav korisnik ne postoji', 404));
    }

    // 2) generate random reset TOKENS, ovo šaljemo korisniku
    const resetToken = crypto.randomBytes(32).toString('hex');

    // šifriramo  generirani tokenToken koji cemo privremeno zapisati u bazu
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    // console.log('passwordResetToken', user.passwordResetToken);

    // Definiramo 60 minuta za promjenu lozinke
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;

    // snimamo passwordResetToken, passwordResetExpires kod usera, NE u bazu!
    await user.save({ validateBeforeSave: false });

    // 3) send it to user email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Zaboravio si password?....${resetURL}`;

    await sendEmail({
      email: user.email,
      subject: 'Tvoj reset token',
      message: message,
    });

    res.status(200).json({
      komentar: 'Token poslan korisniku',
      status: 'success',
    });
  } catch (error) {
    greske.baciGresku(error, res);
  }
};

// Reseriranje tokena
exports.resetPassword = async (req, res, next) => {
  try {
    console.log(req.params.token);

    // 1) Get user based on token
    const hashToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    console.log(' passwordResetToken:=', hashToken);

    // 2) If token has not expired, and there is user, set the new password
    const user = await User.findOne({ passwordResetToken: hashToken });

    const nowStamp = Date.now();
    const sada = new Date(nowStamp);
    console.log(
      user.passwordResetExpires,
      user.passwordResetExpires.getTime(),
      sada,
      nowStamp,
      user.passwordResetExpires.getTime() / nowStamp
    );

    if (user.passwordResetExpires.getTime() < nowStamp) {
      return next(
        new AppError(
          'Vrijeme je isteklo, ponovite postupak za obnavljanje passworda',
          401
        )
      );
    }

    // 3) Update changedPasswordAt property for the user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordChangedAt = Date.now();
    // user.passwordResetToken = undefined;
    // user.passwordResetExpires = undefined;
    await user.save();

    // 4) Log the user in, send JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.status(200).json({
      komentar: 'Token  od korisnika je stigao, password zapisan u bazu',
      mjesto: 'authController.js',
      token: token,
      passwordResetExpires: user.passwordResetExpires,
      passwordChangedAt: user.passwordChangedAt,
      status: 'success',
    });
  } catch (error) {
    greske.baciGresku(error, res);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    console.log(req.user, req.body);

    const user = await User.findById(req.user.id).select('+password');

    console.log(user, req.body.passwordCurrent, user.password);
    console.log(req.body.password, req.body.passwordConfirm);

    // 2) Check if POSTed current password is correctPassword
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError('Nije dobar uneseni trenutni password!', 401));
    }

    // 3) Is fo, update password

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // Log user in, send JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.status(200).json({
      token: token,
      mjesto: 'authController.js updatePassword',
      status: 'success',
    });
  } catch (error) {
    next(new AppError('Došlo je do greške u obnavljanju pass', 401));
  }
};

// samo za renderirane stranice
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      const decoded = jwt.verify(
        req.cookies.jwt,
        process.env.JWT_SECRET,
        (err, data) => {
          if (err) {
            throw new Error(err);
          } else {
            return data;
          }
        }
      );

      // 3) Check if user still exists
      const currentUuser = await User.findById(decoded.id);
      if (!currentUuser) {
        return next();
      }

      // 4) Check if user changed password
      if (currentUuser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUuser;
      // req.user = currentUuser;
      return next();
    }
  } catch (error) {
    return next();
  }
  next();
};
