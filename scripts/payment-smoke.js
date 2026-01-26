const GRAPHQL_URL = process.env.GRAPHQL_URL || process.env.APPSYNC_URL || '';
const AUTH_TOKEN = process.env.AUTH_TOKEN || process.env.ID_TOKEN || '';
const INVOICE_ID = process.env.INVOICE_ID || '';
const SCHOOL_ID = process.env.SCHOOL_ID || '';

if (!GRAPHQL_URL || !AUTH_TOKEN || !INVOICE_ID || !SCHOOL_ID) {
  console.error(
    'Missing required env: GRAPHQL_URL/APPSYNC_URL, AUTH_TOKEN/ID_TOKEN, INVOICE_ID, SCHOOL_ID'
  );
  process.exit(1);
}

const graphql = async (query, variables) => {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) {
    throw new Error(json.errors?.[0]?.message || `GraphQL error (${res.status})`);
  }
  return json.data;
};

const uniqBy = (items, key) => {
  const seen = new Set();
  return items.filter((item) => {
    const value = item[key];
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

const run = async () => {
  const data = await graphql(
    `query PaymentSmoke($invoiceId: ID!, $limit: Int, $schoolId: ID!) {
      paymentsByInvoice(invoiceId: $invoiceId, limit: $limit) {
        id
        reference
        status
        amount
        grossAmount
        paidAt
        paymentIntentId
      }
      paymentIntentsByInvoice(invoiceId: $invoiceId, limit: $limit) {
        id
        status
        amount
        externalReference
        providerReference
      }
      invoiceById(schoolId: $schoolId, id: $invoiceId) {
        id
        status
        amountPaid
        amountDue
      }
    }`,
    { invoiceId: INVOICE_ID, limit: 25, schoolId: SCHOOL_ID }
  );

  const payments = data.paymentsByInvoice || [];
  const intents = data.paymentIntentsByInvoice || [];
  const invoice = data.invoiceById || null;

  const duplicates = payments.length - uniqBy(payments, 'reference').length;

  console.log('Invoice', invoice);
  console.log('PaymentIntents', intents);
  console.log('PaymentTransactions', payments);
  if (duplicates > 0) {
    console.warn(`Duplicate references detected: ${duplicates}`);
  }
};

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
