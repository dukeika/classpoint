/*
 * Tenant isolation integration harness for AppSync GraphQL.
 *
 * Required env:
 * - APPSYNC_URL
 * - JWT_SCHOOL_A
 * - JWT_SCHOOL_B
 *
 * Optional env:
 * - SCHOOL_A_ID (falls back to JWT custom:schoolId)
 * - SCHOOL_B_ID (falls back to JWT custom:schoolId)
 * - ALLOW_WRITE_TESTS=1 (enable cross-tenant mutation checks)
 * - JWT_ADMIN_A (defaults to JWT_SCHOOL_A)
 * - JWT_LIMITED_A (non-admin token for RBAC checks, same tenant as A)
 *
 * Optional IDs for richer coverage:
 * - INVOICE_NO_A
 * - INVOICE_ID_A
 * - CAMPAIGN_ID_A
 */

const fetchFn = global.fetch;
if (!fetchFn) {
  console.error("Global fetch is not available in this Node version.");
  process.exit(1);
}

const required = ["APPSYNC_URL", "JWT_SCHOOL_A", "JWT_SCHOOL_B"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.log("Skipping tests. Missing env:", missing.join(", "));
  process.exit(0);
}

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch (err) {
    return {};
  }
};

const schoolIdFromToken = (token) => {
  const payload = decodeJwtPayload(token);
  return payload["custom:schoolId"] || payload.schoolId || payload["schoolId"] || null;
};

const url = process.env.APPSYNC_URL;
const tokenA = process.env.JWT_SCHOOL_A;
const tokenB = process.env.JWT_SCHOOL_B;
const adminTokenA = process.env.JWT_ADMIN_A || tokenA;
const limitedTokenA = process.env.JWT_LIMITED_A || null;
const schoolA = process.env.SCHOOL_A_ID || schoolIdFromToken(tokenA);
const schoolB = process.env.SCHOOL_B_ID || schoolIdFromToken(tokenB);
const limitedSchool = limitedTokenA ? schoolIdFromToken(limitedTokenA) : null;

if (!schoolA || !schoolB) {
  console.log("Skipping tests. SCHOOL_A_ID/SCHOOL_B_ID not resolved.");
  process.exit(0);
}

const graphql = async (token, query, variables) => {
  const res = await fetchFn(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  return json;
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const tests = [];

const registerTest = (name, run, requires = []) => {
  tests.push({ name, run, requires });
};

const requireEnv = (keys) => keys.every((key) => process.env[key]);

const allowCrossTenantEmpty = (response) =>
  !!response.errors || !response.data || Object.values(response.data).every((value) => {
    if (Array.isArray(value)) return value.length === 0;
    return value === null;
  });

registerTest("read feeItemsBySchool (tenant A)", async () => {
  const query = `query FeeItemsBySchool($schoolId: ID!, $limit: Int) {
    feeItemsBySchool(schoolId: $schoolId, limit: $limit) { id schoolId }
  }`;
  const res = await graphql(tokenA, query, { schoolId: schoolA, limit: 2 });
  assert(!res.errors, "School A query returned errors: " + JSON.stringify(res.errors));
  const items = res.data?.feeItemsBySchool || [];
  for (const item of items) {
    assert(item.schoolId === schoolA, "Tenant A query leaked non-tenant data.");
  }
});

registerTest("rbac usersBySchool (admin ok)", async () => {
  const query = `query UsersBySchool($schoolId: ID!, $userType: UserType!, $limit: Int) {
    usersBySchool(schoolId: $schoolId, userType: $userType, limit: $limit) { id schoolId }
  }`;
  const res = await graphql(adminTokenA, query, { schoolId: schoolA, userType: "STAFF", limit: 1 });
  assert(!res.errors, "Admin usersBySchool failed: " + JSON.stringify(res.errors));
});

registerTest(
  "rbac usersBySchool (limited denied)",
  async () => {
    if (!limitedTokenA || limitedSchool !== schoolA) {
      return;
    }
    const query = `query UsersBySchool($schoolId: ID!, $userType: UserType!, $limit: Int) {
      usersBySchool(schoolId: $schoolId, userType: $userType, limit: $limit) { id schoolId }
    }`;
    const res = await graphql(limitedTokenA, query, { schoolId: schoolA, userType: "STAFF", limit: 1 });
    assert(res.errors, "Limited usersBySchool unexpectedly succeeded.");
  },
  ["JWT_LIMITED_A"]
);

registerTest("rbac paymentsBySchool (admin ok)", async () => {
  const query = `query PaymentsBySchool($schoolId: ID!, $limit: Int) {
    paymentsBySchool(schoolId: $schoolId, limit: $limit) { id schoolId }
  }`;
  const res = await graphql(adminTokenA, query, { schoolId: schoolA, limit: 1 });
  assert(!res.errors, "Admin paymentsBySchool failed: " + JSON.stringify(res.errors));
});

registerTest(
  "rbac paymentsBySchool (limited denied)",
  async () => {
    if (!limitedTokenA || limitedSchool !== schoolA) {
      return;
    }
    const query = `query PaymentsBySchool($schoolId: ID!, $limit: Int) {
      paymentsBySchool(schoolId: $schoolId, limit: $limit) { id schoolId }
    }`;
    const res = await graphql(limitedTokenA, query, { schoolId: schoolA, limit: 1 });
    assert(res.errors, "Limited paymentsBySchool unexpectedly succeeded.");
  },
  ["JWT_LIMITED_A"]
);

registerTest("read feeItemsBySchool cross-tenant (tenant B -> A)", async () => {
  const query = `query FeeItemsBySchool($schoolId: ID!, $limit: Int) {
    feeItemsBySchool(schoolId: $schoolId, limit: $limit) { id schoolId }
  }`;
  const res = await graphql(tokenB, query, { schoolId: schoolA, limit: 1 });
  assert(allowCrossTenantEmpty(res), "Cross-tenant feeItemsBySchool returned data.");
});

registerTest(
  "read invoiceByNumber (tenant A)",
  async () => {
    const query = `query InvoiceByNumber($schoolId: ID!, $invoiceNo: String!) {
      invoiceByNumber(schoolId: $schoolId, invoiceNo: $invoiceNo) { id schoolId invoiceNo }
    }`;
    const res = await graphql(tokenA, query, {
      schoolId: schoolA,
      invoiceNo: process.env.INVOICE_NO_A
    });
    assert(!res.errors, "InvoiceByNumber failed: " + JSON.stringify(res.errors));
    const invoice = res.data?.invoiceByNumber;
    assert(!invoice || invoice.schoolId === schoolA, "InvoiceByNumber returned wrong tenant.");
  },
  ["INVOICE_NO_A"]
);

registerTest(
  "read invoiceByNumber cross-tenant (tenant B -> A)",
  async () => {
    const query = `query InvoiceByNumber($schoolId: ID!, $invoiceNo: String!) {
      invoiceByNumber(schoolId: $schoolId, invoiceNo: $invoiceNo) { id schoolId invoiceNo }
    }`;
    const res = await graphql(tokenB, query, {
      schoolId: schoolA,
      invoiceNo: process.env.INVOICE_NO_A
    });
    assert(allowCrossTenantEmpty(res), "Cross-tenant invoiceByNumber returned data.");
  },
  ["INVOICE_NO_A"]
);

registerTest(
  "read invoiceLinesByInvoice (tenant A)",
  async () => {
    const query = `query InvoiceLinesByInvoice($invoiceId: ID!, $limit: Int) {
      invoiceLinesByInvoice(invoiceId: $invoiceId, limit: $limit) { id schoolId invoiceId }
    }`;
    const res = await graphql(tokenA, query, {
      invoiceId: process.env.INVOICE_ID_A,
      limit: 5
    });
    assert(!res.errors, "InvoiceLinesByInvoice failed: " + JSON.stringify(res.errors));
    const items = res.data?.invoiceLinesByInvoice || [];
    for (const item of items) {
      assert(item.schoolId === schoolA, "InvoiceLinesByInvoice returned wrong tenant.");
    }
  },
  ["INVOICE_ID_A"]
);

registerTest(
  "read invoiceLinesByInvoice cross-tenant (tenant B -> A)",
  async () => {
    const query = `query InvoiceLinesByInvoice($invoiceId: ID!, $limit: Int) {
      invoiceLinesByInvoice(invoiceId: $invoiceId, limit: $limit) { id schoolId }
    }`;
    const res = await graphql(tokenB, query, {
      invoiceId: process.env.INVOICE_ID_A,
      limit: 5
    });
    assert(allowCrossTenantEmpty(res), "Cross-tenant invoiceLinesByInvoice returned data.");
  },
  ["INVOICE_ID_A"]
);

registerTest(
  "read paymentsByInvoice (tenant A)",
  async () => {
    const query = `query PaymentsByInvoice($invoiceId: ID!, $limit: Int) {
      paymentsByInvoice(invoiceId: $invoiceId, limit: $limit) { id schoolId invoiceId }
    }`;
    const res = await graphql(tokenA, query, {
      invoiceId: process.env.INVOICE_ID_A,
      limit: 5
    });
    assert(!res.errors, "PaymentsByInvoice failed: " + JSON.stringify(res.errors));
    const items = res.data?.paymentsByInvoice || [];
    for (const item of items) {
      assert(item.schoolId === schoolA, "PaymentsByInvoice returned wrong tenant.");
    }
  },
  ["INVOICE_ID_A"]
);

registerTest(
  "read paymentsByInvoice cross-tenant (tenant B -> A)",
  async () => {
    const query = `query PaymentsByInvoice($invoiceId: ID!, $limit: Int) {
      paymentsByInvoice(invoiceId: $invoiceId, limit: $limit) { id schoolId }
    }`;
    const res = await graphql(tokenB, query, {
      invoiceId: process.env.INVOICE_ID_A,
      limit: 5
    });
    assert(allowCrossTenantEmpty(res), "Cross-tenant paymentsByInvoice returned data.");
  },
  ["INVOICE_ID_A"]
);

registerTest(
  "read recipientsByCampaign (tenant A)",
  async () => {
    const query = `query RecipientsByCampaign($campaignId: ID!, $limit: Int) {
      recipientsByCampaign(campaignId: $campaignId, limit: $limit) { id schoolId campaignId }
    }`;
    const res = await graphql(tokenA, query, {
      campaignId: process.env.CAMPAIGN_ID_A,
      limit: 5
    });
    assert(!res.errors, "RecipientsByCampaign failed: " + JSON.stringify(res.errors));
    const items = res.data?.recipientsByCampaign || [];
    for (const item of items) {
      assert(item.schoolId === schoolA, "RecipientsByCampaign returned wrong tenant.");
    }
  },
  ["CAMPAIGN_ID_A"]
);

registerTest(
  "read recipientsByCampaign cross-tenant (tenant B -> A)",
  async () => {
    const query = `query RecipientsByCampaign($campaignId: ID!, $limit: Int) {
      recipientsByCampaign(campaignId: $campaignId, limit: $limit) { id schoolId }
    }`;
    const res = await graphql(tokenB, query, {
      campaignId: process.env.CAMPAIGN_ID_A,
      limit: 5
    });
    assert(allowCrossTenantEmpty(res), "Cross-tenant recipientsByCampaign returned data.");
  },
  ["CAMPAIGN_ID_A"]
);

registerTest(
  "cross-tenant mutation blocked (createFeeItem, tenant B -> A)",
  async () => {
    const mutation = `mutation CreateFeeItem($input: CreateFeeItemInput!) {
      createFeeItem(input: $input) { id schoolId name }
    }`;
    const res = await graphql(tokenB, mutation, {
      input: {
        schoolId: schoolA,
        name: "Isolation Test Item",
        description: "Do not use",
        category: "OTHER",
        isOptional: true,
        isActive: false
      }
    });
    assert(res.errors, "Cross-tenant mutation unexpectedly succeeded.");
  },
  ["ALLOW_WRITE_TESTS"]
);

const runTests = async () => {
  console.log("Running AppSync tenant isolation harness...");
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const test of tests) {
    if (test.requires.length && !requireEnv(test.requires)) {
      console.log(`[skip] ${test.name} (missing env: ${test.requires.join(", ")})`);
      skipped += 1;
      continue;
    }
    if (test.requires.includes("ALLOW_WRITE_TESTS") && process.env.ALLOW_WRITE_TESTS !== "1") {
      console.log(`[skip] ${test.name} (ALLOW_WRITE_TESTS not enabled)`);
      skipped += 1;
      continue;
    }
    try {
      await test.run();
      console.log(`[ok]   ${test.name}`);
      passed += 1;
    } catch (err) {
      console.log(`[fail] ${test.name}: ${err.message}`);
      failed += 1;
    }
  }

  console.log(`Summary: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  if (failed > 0) {
    process.exitCode = 1;
  }
};

runTests().catch((err) => {
  console.error("Harness failed:", err.message);
  process.exitCode = 1;
});
