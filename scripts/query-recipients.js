/**
 * Quick smoke script to fetch messaging recipients for an invoice.
 *
 * Usage:
 *   node scripts/query-recipients.js \
 *     --url https://<api-endpoint>/graphql \
 *     --token "<ID token>" \
 *     --invoice <invoiceId> \
 *     [--limit 50]
 */

const https = require('https');

const args = process.argv.slice(2).reduce((acc, cur, idx, arr) => {
  if (cur.startsWith('--')) {
    const key = cur.replace(/^--/, '');
    const val = arr[idx + 1] && !arr[idx + 1].startsWith('--') ? arr[idx + 1] : true;
    acc[key] = val;
  }
  return acc;
}, {});

const endpoint = args.url || process.env.GRAPHQL_URL;
const token = args.token || process.env.AUTH_TOKEN || process.env.ID_TOKEN;
const invoiceId = args.invoice || process.env.INVOICE_ID;
const limit = Number(args.limit || process.env.LIMIT || 50);

if (!endpoint || !token || !invoiceId) {
  console.error('Missing required params. Provide --url, --token, --invoice.');
  process.exit(1);
}

const query = `
  query RecipientsByInvoice($invoiceId: ID!, $limit: Int) {
    recipientsByInvoice(invoiceId: $invoiceId, limit: $limit) {
      id
      destination
      status
      lastError
      providerMessageId
      statusHistory {
        status
        at
        providerMessageId
        error
      }
    }
  }
`;

const payload = JSON.stringify({
  query,
  variables: { invoiceId, limit }
});

const url = new URL(endpoint);
const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname + (url.search || ''),
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    Authorization: token
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.errors) {
        console.error('GraphQL errors:', parsed.errors);
        process.exit(1);
      }
      console.log(JSON.stringify(parsed.data, null, 2));
    } catch (err) {
      console.error('Failed parsing response', err, data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error', err);
  process.exit(1);
});

req.write(payload);
req.end();
