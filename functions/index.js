const functions = require('firebase-functions');
const https     = require('https');

const ANTHROPIC_KEY = 'ANTHROPIC_KEY_PLACEHOLDER';

exports.askKevin = functions
  .region('europe-west1')
  .https.onRequest(function(req, res) {

    // CORS
    res.set('Access-Control-Allow-Origin', 'https://mats-create.github.io');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Require auth header (Firebase ID token)
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorised' });
      return;
    }

    const body = JSON.stringify({
      model:      req.body.model      || 'claude-sonnet-4-20250514',
      max_tokens: req.body.max_tokens || 1024,
      system:     req.body.system,
      messages:   req.body.messages,
    });

    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers:  {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(body),
      },
    };

    const apiReq = https.request(options, function(apiRes) {
      let data = '';
      apiRes.on('data', function(chunk) { data += chunk; });
      apiRes.on('end',  function() {
        res.status(apiRes.statusCode).set('Content-Type', 'application/json').send(data);
      });
    });

    apiReq.on('error', function(e) {
      res.status(500).json({ error: e.message });
    });

    apiReq.write(body);
    apiReq.end();
  });
