'use strict';

const client = require('./client'),
  bluebird = require('bluebird'),
  { DATA_STRUCTURES, POSTGRES_HOST, POSTGRES_PORT } = require('../services/constants'),
  { getComponents, getLayouts } = require('amphora-fs');

/**
 * @return {Promise[]}
 */
function createRemainingTables() {
  var promises = [];

  for (let i = 0; i < DATA_STRUCTURES.length; i++) {
    let STRUCTURE = DATA_STRUCTURES[i];

    if (STRUCTURE !== 'components' && STRUCTURE !== 'pages' && STRUCTURE !== 'layouts' && STRUCTURE !== 'uris') {
      promises.push(client.createTable(STRUCTURE));
    }
  }

  return bluebird.all(promises);
}

/**
 * Create all tables needed
 *
 * @return {Promise}
 */
function createTables() {
  return bluebird.all(getComponents().map(component => client.createTable(`components.${component}`)))
    .then(() => bluebird.all(getLayouts().map(layout => client.createTableWithMeta(`layouts.${layout}`))))
    .then(() => client.createTableWithMeta('pages'))
    .then(() => client.raw('CREATE TABLE IF NOT EXISTS ?? ( id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL );', ['uris']))
    .then(() => createRemainingTables());

}

/**
 * Connect and create schemas/tables
 *
 * @return {Promise}
 */
function setup() {
  if (!POSTGRES_HOST) {
    return Promise.reject(new Error('No postgres host set'));
  }

  return client.connect()
    .then(() => client.createSchema('components'))
    .then(() => client.createSchema('layouts'))
    .then(() => client.createSchema('lists'))
    .then(createTables)
    .then(() => ({ server: `${POSTGRES_HOST}${POSTGRES_PORT}:${POSTGRES_PORT}` }));
}

module.exports.setup = setup;
