const chalk = require('chalk');

class AppErrorEdit {
  constructor() {}

  baciGresku(err, res) {
    err.status = err.status || 'error';
    err.statusCode = err.statusCode || 500;
    //
    // Greske koje se prikazuju samo u DEV modu
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.red('AppErrorEdit message:', err.message));
      console.log(chalk.bgMagentaBright('AppErrorEdit name = ', err.name));
      // console.log('AppErrorEdit.baciGresku = ', err._message, err.name);
      res.status(err.statusCode).json({
        status: err.status,
        greška: err,
        stack: err.stack,
      });
    } else if (err.name === 'CastError') {
      res.status(err.statusCode).json({
        status: err.status,
        message: 'Takvog horisnika nema',
      });
      //
      // korisnik vec postoji dupli kljuc
    } else if (err.code === 11000) {
      res.status(err.statusCode).json({
        status: err.status,
        message: `duplicate key. Vrijednost: ${err.keyValue.name} vec postoji.`,
      });
      //
      // Neispravan unos podataka
    } else if (err._message === 'Validation failed') {
      // stvara polje od vrijednosri...
      let errorData = Object.values(err.errors).map((el) => {
        return el.message;
      });

      errorData = errorData.join('; ');

      res.status(err.statusCode).json({
        status: err.status,
        message: `Invalid input data. ${errorData}`,
      });
      //
      // Neispravan token
    } else if (err.message.startsWith('JsonWebTokenError')) {
      console.log('JsonWebTokenError');
      
      res.status(err.statusCode).json({
        status: err.status,
        message: 'Neispravan token. Please log in again',
      });
      //
      // Vrijeme tokena je isteklo
    } else if (err.message.startsWith('TokenExpiredError')) {
      res.status(err.statusCode).json({
        status: err.status,
        message: 'Vrijeme ulogiranja je isteklo. Molim logirajte se ponovo',
      });
      //
      // Poruka koju ce vidjeti korisnik
    } else {
      res.status(err.statusCode).json({
        status: err.status,
        message: 'Nešto nije u redu....',
      });
    }
  }
}

module.exports = AppErrorEdit;
