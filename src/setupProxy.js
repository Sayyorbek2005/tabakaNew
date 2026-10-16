/* eslint-env node */
const { createStorageApi } = require("../server/storage-api.cjs");
module.exports = function setupStorage(app) { app.use(createStorageApi()); };
