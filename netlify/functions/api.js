const serverless = require('serverless-http');
const app = require('../../server/index');

// Create the Netlify serverless handler using the Express app
exports.handler = serverless(app);
