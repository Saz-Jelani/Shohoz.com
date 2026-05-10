const seed = require('../db.json');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getDb() {
  if (!globalThis.__shohozDb) {
    globalThis.__shohozDb = clone(seed);
  }
  return globalThis.__shohozDb;
}

function getCollection(name) {
  const db = getDb();
  if (!Array.isArray(db[name])) {
    db[name] = [];
  }
  return db[name];
}

function nextId(rows) {
  return rows.reduce((max, item) => Math.max(max, Number(item?.id) || 0), 0) + 1;
}

module.exports = {
  getCollection,
  nextId
};
