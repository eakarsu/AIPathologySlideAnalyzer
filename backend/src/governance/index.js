'use strict';
const jwt = require('jsonwebtoken');
const { createRouter } = require('./router');
const { postgres } = require('./store');
const { evaluate } = require('./domain');
const { pool } = require('../database');

function auth(req, res, next) {
  const secret = process.env.JWT_SECRET || '';
  const token = req.headers.authorization && req.headers.authorization.match(/^Bearer (.+)$/)?.[1];
  if (secret.length < 32) return res.status(503).json({ error: 'secure JWT configuration required' });
  if (!token) return res.status(401).json({ error: 'bearer token required' });
  try { req.user = jwt.verify(token, secret, { algorithms: ['HS256'] }); }
  catch (_) { return res.status(401).json({ error: 'invalid token' }); }
  next();
}

module.exports = createRouter({
  db: postgres(pool), auth, evaluate, workflow: 'pathology-review',
  providers: ['dicom','wsi-store','scanner','laboratory','annotation-store','case-management','model-registry','report-delivery'],
  approverRoles: ['pathologist','clinical_reviewer','laboratory_director','privacy_officer','admin']
});
