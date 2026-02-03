// Vercel serverless function - wraps the Express app
// Vercel automatically routes /api/* requests to this function
// The Express app routes are already defined with /api prefix
const app = require('../server/index');

module.exports = app;
