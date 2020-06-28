const mongoose = require('mongoose');
const chalk = require('chalk');
// const moment = require('moment'); // require

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Nepoznata greška uncaughtException');
  process.exit(1);
});

// manage your ENV varijable
const dotenv = require('dotenv');
// definiramo path za file u koji spremamo potrebne varijable
dotenv.config({ path: './config.env' });

// inicijalizacija express, morgan, routera
const app = require('./app');

// definicija linka database
const DB = process.env.DATABASE;

// spajanje na databazu
mongoose
  .connect(
    // process.env.DATABASE_LOCAL,{
    DB,
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log(process.env.OS, 'Spajanje na bazu uspješno obavljeno');
  })
  .catch((err) => {
    console.log('Greška kod spajanja na Bazu');
  });

// Start SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(chalk.blue(`App running on port ${port}`));
});

// centralo mjesto za hvatanje grešaka
process.on('unhandledRejection', (err) => {
  console.log(chalk.blue.bgRed.bold(err.name, err.message));
  console.log(chalk.blue.bgRed.bold('Nepoznata greška unhandledRejection'));
  server.close(() => {
    process.exit(1);
  });
});
