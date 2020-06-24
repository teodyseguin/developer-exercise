const fcsv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const states = require('./states.json');

let newRecord = [];

fs.createReadStream(path.resolve(__dirname, '.', 'contacts.csv'))
  .pipe(fcsv.parse({ headers: true }))
  .on('error', error => console.error(error))
  .on('data', row => createNewRow(row))
  .on('end', rowCount => generateNewFile(rowCount));

/**
 * Create a new record row, based on the conditions below.
 * @param {object} row 
 */
const createNewRow = row => {
  const { Last, Email, State } = row;
  const found = states.find(state => state.state === State);

  // If no matching state is found, we stop.
  if (!found) {
    return;
  }

  // If largetCity is jacksonville, we replace the Email property with '---@-.-'.
  if (found.largestCity.toLowerCase() === 'jacksonville') {
    row.Email = '---@-.-';
  }

  // A record that has less than 10 million population will be added to the new record.
  if (parseInt(found.population) < 10000000) {
    newRecord.push(row);
  }
};

/**
 * Generate a new file based on newRecord.
 * @param {number} rowCount 
 */
const generateNewFile = rowCount => {
  console.log(`Parsed ${rowCount} rows`);
  fcsv.writeToPath(path.resolve(__dirname, 'new-contacts.csv'), newRecord)
    .on('error', error => console.log('Something went wrong while trying to generate new-contacts.csv', error))
    .on('finish', () => console.log('new-contacts.csv has been successfully generated'));
};
