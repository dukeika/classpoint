import { getPaystackClient, resolvePaystackConfig } from "../paystack";

type ProviderConfig = {
  id: string;
  type: string;
  providerName: string;
  status: string;
  configJson?: unknown;
};

type Invoice = {
  id: string;
  invoiceNo: string;
  status: string;
  amountDue: number;
  amountPaid: number;
};

type Receipt = {
  id: string;
  receiptNo: string;
  amount: number;
  currency: string;
  paidAt?: string | null;
};

const APPSYNC_URL = process.env.APPSYNC_URL || "";

const decodeJwt = (token: string) => {
  if (!token || token.split(".").length < 2) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const graphqlRequest = async <T>(
  query: string,
  variables: Record<string, unknown>,
  authToken: string
): Promise<T> => {
  if (!APPSYNC_URL) {
    throw new Error("APPSYNC_URL missing");
  }
  const res = await fetch(APPSYNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: authToken } : {})
    },
    body: JSON.stringify({ query, variables })
  });
  const json = (await res.json()) as { data?: T; errors?: { message?: string }[] };
  if (!res.ok || json.errors?.length) {
    const message = json.errors?.[0]?.message || `GraphQL request failed (${res.status}).`;
    throw new Error(message);
  }
  if (!json.data) {
    throw new Error("GraphQL response missing data.");
  }
  return json.data;
};

const findPaystackConfig = (configs: ProviderConfig[]) => {
  const paymentConfigs = configs.filter((config) =>
    ["PAYMENT_GATEWAY", "PAYMENTS"].includes(config.type?.toUpperCase?.() || "")
  );
  return (
    paymentConfigs.find((config) => config.providerName?.toUpperCase?.() === "PAYSTACK") || null
  );
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { reference?: string; schoolId?: string };
    const url = new URL(request.url);
    const reference = body.reference || url.searchParams.get("reference") || "";
    const authToken =
      request.headers.get("authorization") || request.cookies.get("cp.id_token")?.value || "";
    if (!authToken) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!reference) {
      return new Response(JSON.stringify({ error: "reference is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const claims = decodeJwt(authToken) || {};
    const tokenSchoolId = claims["custom:schoolId"] || claims.schoolId || "";
    const schoolId = body.schoolId || tokenSchoolId;
    if (!schoolId) {
      return new Response(JSON.stringify({ error: "schoolId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (tokenSchoolId && schoolId !== tokenSchoolId) {
      return new Response(JSON.stringify({ error: "Unauthorized school context" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const providerData = await graphqlRequest<{ providerConfigsBySchool: ProviderConfig[] }>(
      `query ProviderConfigsBySchool($schoolId: ID!, $limit: Int) {
        providerConfigsBySchool(schoolId: $schoolId, limit: $limit) {
          id
          type
          providerName
          status
          configJson
        }
      }`,
      { schoolId, limit: 100 },
      authToken
    );
    const paystackConfigRecord = findPaystackConfig(providerData.providerConfigsBySchool || []);
    if (!paystackConfigRecord || paystackConfigRecord.status !== "ACTIVE") {
      return new Response(JSON.stringify({ error: "Paystack is not configured for this school." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const paystackConfig = resolvePaystackConfig(paystackConfigRecord.configJson);
    const secretKey = String(paystackConfig?.secretKey || paystackConfig?.webhookSecret || "");
    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: "Paystack secret key missing in provider config." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const paystack = getPaystackClient(secretKey);
    const paystackJson = (await paystack.transaction.verify(reference)) as {
      status: boolean;
      message?: string;
      data?: {
        status?: string;
        amount?: number;
        currency?: string;
        paid_at?: string;
        reference?: string;
        metadata?: Record<string, unknown>;
      };
    };
    if (!paystackJson.status) {
      return new Response(
        JSON.stringify({
          error: paystackJson.message || "Paystack verify failed."
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const metadata = paystackJson.data?.metadata || {};
    const invoiceId = String(metadata.invoiceId || "");
    let invoice: Invoice | null = null;
    let receipts: Receipt[] = [];
    if (invoiceId) {
      try {
        const invoiceData = await graphqlRequest<{ invoiceById: Invoice | null }>(
          `query InvoiceById($schoolId: ID!, $id: ID!) {
            invoiceById(schoolId: $schoolId, id: $id) {
              id
              invoiceNo
              status
              amountDue
              amountPaid
            }
          }`,
          { schoolId, id: invoiceId },
          authToken
        );
        invoice = invoiceData.invoiceById || null;
      } catch (_err) {
        invoice = null;
      }
      try {
        const receiptData = await graphqlRequest<{ receiptsByInvoice: Receipt[] }>(
          `query ReceiptsByInvoice($invoiceId: ID!, $limit: Int) {
            receiptsByInvoice(invoiceId: $invoiceId, limit: $limit) {
              id
              receiptNo
              amount
              currency
              paidAt
            }
          }`,
          { invoiceId, limit: 5 },
          authToken
        );
        receipts = receiptData.receiptsByInvoice || [];
      } catch (_err) {
        receipts = [];
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        status: paystackJson.data?.status || "unknown",
        reference: paystackJson.data?.reference || reference,
        amount: paystackJson.data?.amount ? paystackJson.data.amount / 100 : null,
        currency: paystackJson.data?.currency || "NGN",
        paidAt: paystackJson.data?.paid_at || null,
        invoiceId,
        paymentIntentId: metadata.paymentIntentId || null,
        invoice,
        receipts
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment verification failed.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
