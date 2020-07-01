const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const chalk = require('chalk');
const cookieParser = require('cookie-parser');

const AppError = require('./utility/appError');
const tourRouter = require('./routes/tourRoute');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoute');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// definiramo templete engine koji cemo koristiti u aplikaciji
app.set('view engine', 'pug');
// kreiramo stazu odakle cemo vuci template
app.set('views', path.join(__dirname, 'views'));

// dodavanje linka za statičke stranice,bolji kod nego ovaj iznad
app.use(express.static(path.join(__dirname, 'public')));

// 1)MIDDLEWARES

// securyity HTTP headers
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}


// brojac posjeta sa jedne adrese
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP',
});
app.use('/api', limiter);

app.use(express.json());

// instaliran npm i cookie-parser, omogucije rad sa cookiem
app.use(cookieParser());

//
// primjer
app.use((req, res, next) => {
  console.log(chalk.bgCyan('Hello from middleware'));
  console.log(chalk.keyword('orange')('Yay for orange colored text!'));
  console.log(chalk.blue.bgRed.bold('Hello world!'));
  console.log(
    chalk.green(
      `I am a green line ${chalk.blue.underline.bold(
        'with a blue substring'
      )} that becomes green again!`
    )
  );
  next();
});

//
// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

app.get('/pazi', (req, res) => {
  res.status(200).json({ nesto: 'Helllo ....', app: 'Natours' });
});

////
// za primjer
app.post('/', (req, res) => {
  res.send('Primjer');
});

// ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// nisam nasao nijedan link, izbacujem grešku
app.all('*', (req, res, next) => {
  // 1) nacin
  // res.status(404).json({
  //   status: 'fail',
  //   message: 'Nisam nista nasao',
  // });

  // // 2) drugi nacin
  // const err = new Error('Nisam nista nasao');
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);

  next(new AppError('Nisam nista nasao pod tim linkom', 404));
});

//
// Centralna konzola za MIDDLEWARES greške
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    mjesto: 'app.js, konzola za MIDDLEWARES greške',
    status: err.status,
    message: err.message,
    greska: err,
  });
});

module.exports = app;
