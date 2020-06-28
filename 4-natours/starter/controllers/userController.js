const User = require('../models/userModul');
const AppErrorEdit = require('../utility/appErrorEdit');
const AppError = require('../utility/appError');

const greske = new AppErrorEdit();

// prikaži sve USERE iz baze
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(500).json({
      status: 'succes',
      results: users.length,
      data: {
        users: users,
      },
    });
  } catch (error) {
    greske.baciGresku(error, res);
  }
};

// dohvati jednog usera
exports.getUser = (req, res) => {
  console.log(req.user);

  res.status(500).json({
    status: 'error',
    message: ' This route is not defined  getUser',
  });
};

// dohvati current usera
exports.getMe = (req, res) => {
  res.status(200).json({
    status: 'sucess',
    data: {
      data: req.user,
    }
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: ' This route is not defined createUser. Please use LOGIN',
  });
};

// Opcija kada user sam zeli promjeniti 'name' ili 'email'
exports.updateMe = async (req, res, next) => {
  try {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword.',
          400
        )
      );
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const newObj = {};
    const dozvoljenaPolja = ['name', 'email'];
    Object.keys(req.body).forEach((el) => {
      if (dozvoljenaPolja.includes(el)) {
        newObj[el] = req.body[el];
      }
    });

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, newObj, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        updatedUser: updatedUser,
      },
    });
  } catch (error) {
    greske.baciGresku(error, res);
  }
};

exports.updateUser = async (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: ' This route is not defined updateUser',
  });
};

// brisemo usera
exports.deleteUser = async (req, res) => {
  try {
    let podaciUser = await User.find();

    podaciUser = podaciUser.map((el) => {
      return el.id;
    });
    console.log(podaciUser);

    const obrisaniUser = await User.findByIdAndDelete(req.params.id);
    res.status(500).json({
      status: 'error',
      obrisaniUser,
      podaciUser,
      reqUser: req.user,
    });
  } catch (error) {
    greske.baciGresku(error, res);
  }
};

// deaktiviramo usera tj. kada se uzer zeli obrisati on se u stvari deaktivira
exports.activeInactive = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(500).json({
      status: 'deaktiviran',
      data: null,
    });
  } catch (error) {
    greske.baciGresku(error, res);
  }
};
