const fcsv = require('fast-csv');
const fs = require('fs');
const path = require('path');
// I have created this json file, based on the information gathered here https://www.nationsonline.org/oneworld/US-states-population.htm
const states = require('./states.json');
const _ = require('lodash');

// This will contain the new set of records for generating a new csv file.
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

  if (!validateEmail(Email)) {
    return;
  }

  let emailChunks = Email.split('@');
  let emailDomain = emailChunks[1];

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
    // We are adding a temporary property named emailDomain.
    // The purpose of this, is so that we can easily pass it as an argument for sorting later.
    row['emailDomain'] = emailDomain;
    newRecord.push(row);
  }
};

/**
 * Generate a new file based on newRecord.
 * @param {number} rowCount 
 */
const generateNewFile = rowCount => {
  console.log(`Parsed ${rowCount} rows`);
  // Sort the record by email domain and last name.
  newRecord = _.sortBy(newRecord, ['emailDomain', 'Last']);

  // Once everything has been sorted, we are now going to remove the emailDomain property for each record object.
  newRecord.forEach(element => {
    delete element.emailDomain;
  });

  fcsv.writeToPath(path.resolve(__dirname, 'new-contacts.csv'), newRecord)
    .on('error', error => console.log('Something went wrong while trying to generate new-contacts.csv', error))
    .on('finish', () => console.log('new-contacts.csv has been successfully generated'));
};

/**
 * https://stackoverflow.com/a/46181
 */
const validateEmail = email => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

