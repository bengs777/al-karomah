const { createServer } = require('http');
const app = require('../../server.js');

// Vercel Serverless Function - catch-all route
// Maps /api/* requests to Express routes
export default function handler(req, res) {
  const server = createServer(app);
  server.emit('request', req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};