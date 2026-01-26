import { getPaystackClient, loadClasspointPaystackConfig, resolvePaystackConfig } from "../paystack";

type ProviderConfig = {
  id: string;
  type: string;
  providerName: string;
  status: string;
  configJson?: unknown;
};

type Invoice = {
  id: string;
  amountDue: number;
  status?: string;
  currency?: string | null;
  studentId?: string | null;
};

type Plan = {
  id: string;
  name: string;
  billingCycle: string;
  basePrice: number;
  currency: string;
  status?: string;
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

const getGroups = (claims: Record<string, unknown>) => {
  const raw = claims["cognito:groups"];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") return [raw];
  return [];
};

const hasGroup = (groups: string[], allowed: string[]) =>
  allowed.some((group) => groups.includes(group));

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
    const body = (await request.json()) as {
      schoolId?: string;
      invoiceId?: string;
      planId?: string;
      subscriptionId?: string;
      type?: string;
      paymentType?: string;
      provider?: string;
      paymentMethod?: string;
      payerParentId?: string;
      payerEmail?: string;
      callbackUrl?: string;
    };
    const authToken =
      request.headers.get("authorization") || request.cookies.get("cp.id_token")?.value || "";
    if (!authToken) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const claims = decodeJwt(authToken) || {};
    const groups = getGroups(claims);
    const tokenSchoolId = claims["custom:schoolId"] || claims.schoolId || "";
    const schoolId = body.schoolId || tokenSchoolId;
    const provider = (body.provider || "PAYSTACK").toUpperCase();
    const paymentType = String(body.type || body.paymentType || "SCHOOL_FEE").toUpperCase();

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
    if (provider !== "PAYSTACK") {
      return new Response(JSON.stringify({ error: "Only Paystack is supported right now." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const rawMethod = String(body.paymentMethod || "CARD").toUpperCase();
    const method = ["CARD", "TRANSFER", "USSD"].includes(rawMethod) ? rawMethod : "CARD";
    const channels: string[] = [];
    if (method === "CARD") channels.push("card");
    if (method === "TRANSFER") channels.push("bank_transfer");
    if (method === "USSD") channels.push("ussd");

    if (paymentType === "SCHOOL_FEE") {
      const invoiceId = body.invoiceId;
      if (!invoiceId) {
        return new Response(JSON.stringify({ error: "invoiceId is required" }), {
          status: 400,
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
        return new Response(
          JSON.stringify({ error: "Paystack is not configured for this school." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const paystackConfig = resolvePaystackConfig(paystackConfigRecord.configJson);
      const secretKey = paystackConfig?.secretKey || paystackConfig?.webhookSecret || "";
      if (!secretKey) {
        return new Response(
          JSON.stringify({ error: "Paystack secret key missing in provider config." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      if (!paystackConfig?.publicKey) {
        return new Response(JSON.stringify({ error: "Paystack public key missing in provider config." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const invoiceData = await graphqlRequest<{ invoiceById: Invoice | null }>(
        `query InvoiceById($schoolId: ID!, $id: ID!) {
          invoiceById(schoolId: $schoolId, id: $id) {
            id
            amountDue
            status
            currency
            studentId
          }
        }`,
        { schoolId, id: invoiceId },
        authToken
      );
      const invoice = invoiceData.invoiceById;
      if (!invoice) {
        return new Response(JSON.stringify({ error: "Invoice not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (invoice.status === "PAID" || invoice.status === "VOID" || invoice.status === "DRAFT") {
        return new Response(JSON.stringify({ error: "Invoice is not payable." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      const amount = Number(invoice.amountDue || 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        return new Response(JSON.stringify({ error: "Invoice is not ready for payment yet." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const reference = `CP-INV-${invoiceId}-${Date.now()}`;
      const currency = String(invoice.currency || paystackConfig?.currency || "NGN");
      const paymentIntentData = await graphqlRequest<{ createPaymentIntent: { id: string } | null }>(
        `mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {
          createPaymentIntent(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            invoiceId,
            payerParentId: body.payerParentId || null,
            provider,
            amount,
            currency,
            status: "INITIATED",
            externalReference: reference
          }
        },
        authToken
      );

      const email = body.payerEmail || claims.email || claims["cognito:username"] || "";
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required for Paystack payments." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const metadata = {
        type: "SCHOOL_FEE",
        schoolId,
        invoiceId,
        studentId: invoice.studentId || null,
        subscriptionId: null,
        environment: paystackConfig?.environment || "test"
      };
      const paymentTransactionData = await graphqlRequest<{ createPaymentTransaction: { id: string } | null }>(
        `mutation CreatePaymentTransaction($input: CreatePaymentTransactionInput!) {
          createPaymentTransaction(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            invoiceId,
            paymentIntentId: paymentIntentData.createPaymentIntent?.id || null,
            provider,
            method,
            amount,
            currency,
            status: "PENDING",
            reference,
            providerReference: reference,
            type: "SCHOOL_FEE",
            metadata: JSON.stringify(metadata),
            environment: paystackConfig?.environment || "test"
          }
        },
        authToken
      );
      const paymentTransactionId = paymentTransactionData.createPaymentTransaction?.id || null;
      if (!paymentTransactionId) {
        return new Response(JSON.stringify({ error: "Unable to create payment transaction." }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      const amountKobo = Math.round(amount * 100);
      const payload: Record<string, unknown> = {
        email,
        amount: amountKobo,
        currency,
        reference,
        callback_url: body.callbackUrl || paystackConfig?.callbackUrl || undefined,
        metadata: {
          ...metadata,
          paymentIntentId: paymentIntentData.createPaymentIntent?.id || null,
          paymentTransactionId
        }
      };

      if (channels.length) payload.channels = channels;
      if (paystackConfig?.splitCode) payload.split_code = paystackConfig.splitCode;
      if (paystackConfig?.subaccount) payload.subaccount = paystackConfig.subaccount;
      if (typeof paystackConfig?.platformFeePercent === "number") {
        const fee = Math.round((amountKobo * paystackConfig.platformFeePercent) / 100);
        if (fee > 0) payload.transaction_charge = fee;
      }

      const paystack = getPaystackClient(secretKey);
      const paystackJson = (await paystack.transaction.initialize(payload)) as {
        status: boolean;
        message?: string;
        data?: { authorization_url?: string; reference?: string };
      };
      if (!paystackJson.status || !paystackJson.data?.authorization_url) {
        return new Response(
          JSON.stringify({
            error: paystackJson.message || "Paystack init failed."
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const paystackReference = paystackJson.data.reference || reference;
      try {
        if (paymentIntentData.createPaymentIntent?.id) {
          await graphqlRequest(
            `mutation UpdatePaymentIntent($input: UpdatePaymentIntentInput!) {
              updatePaymentIntent(input: $input) { id }
            }`,
            {
              input: {
                schoolId,
                id: paymentIntentData.createPaymentIntent.id,
                status: "REDIRECTED",
                externalReference: paystackReference,
                providerReference: paystackReference,
                redirectedAt: new Date().toISOString()
              }
            },
            authToken
          );
        }
      } catch (err) {
        console.warn("Failed to update payment intent after Paystack init", err);
      }

      return new Response(
        JSON.stringify({
          ok: true,
          authorizationUrl: paystackJson.data.authorization_url,
          reference: paystackReference,
          paymentIntentId: paymentIntentData.createPaymentIntent?.id || null,
          paymentTransactionId,
          publicKey: paystackConfig?.publicKey || "",
          amountKobo,
          currency,
          email,
          environment: paystackConfig?.environment || "test"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (paymentType === "SUBSCRIPTION") {
      if (!hasGroup(groups, ["APP_ADMIN", "SCHOOL_ADMIN"])) {
        return new Response(JSON.stringify({ error: "Not authorized to manage subscriptions." }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      const planId = body.planId;
      if (!planId) {
        return new Response(JSON.stringify({ error: "planId is required for subscriptions." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const paystackConfig = loadClasspointPaystackConfig();
      if (!paystackConfig?.secretKey || !paystackConfig.publicKey) {
        return new Response(JSON.stringify({ error: "ClassPoint Paystack config missing." }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      const planData = await graphqlRequest<{ planById: Plan | null }>(
        `query PlanById($id: ID!) {
          planById(id: $id) {
            id
            name
            billingCycle
            basePrice
            currency
            status
          }
        }`,
        { id: planId },
        authToken
      );
      const plan = planData.planById;
      if (!plan || String(plan.status || "").toUpperCase() !== "ACTIVE") {
        return new Response(JSON.stringify({ error: "Plan is not available." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const amount = Number(plan.basePrice || 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        return new Response(JSON.stringify({ error: "Plan amount is invalid." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const email = body.payerEmail || claims.email || claims["cognito:username"] || "";
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required for Paystack payments." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const reference = `CP-SUB-${schoolId}-${Date.now()}`;
      const currency = String(plan.currency || "NGN");
      const metadata = {
        type: "SUBSCRIPTION",
        schoolId,
        invoiceId: null,
        studentId: null,
        subscriptionId: body.subscriptionId || null,
        environment: paystackConfig.environment,
        planId: plan.id,
        billingCycle: plan.billingCycle
      };
      const paymentTransactionData = await graphqlRequest<{ createPaymentTransaction: { id: string } | null }>(
        `mutation CreatePaymentTransaction($input: CreatePaymentTransactionInput!) {
          createPaymentTransaction(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            subscriptionId: body.subscriptionId || null,
            provider,
            method,
            amount,
            currency,
            status: "PENDING",
            reference,
            providerReference: reference,
            type: "SUBSCRIPTION",
            metadata: JSON.stringify(metadata),
            environment: paystackConfig.environment
          }
        },
        authToken
      );
      const paymentTransactionId = paymentTransactionData.createPaymentTransaction?.id || null;
      if (!paymentTransactionId) {
        return new Response(JSON.stringify({ error: "Unable to create payment transaction." }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      const amountKobo = Math.round(amount * 100);
      const payload: Record<string, unknown> = {
        email,
        amount: amountKobo,
        currency,
        reference,
        callback_url: body.callbackUrl || undefined,
        metadata: {
          ...metadata,
          paymentTransactionId
        }
      };
      if (channels.length) payload.channels = channels;

      const paystack = getPaystackClient(paystackConfig.secretKey);
      const paystackJson = (await paystack.transaction.initialize(payload)) as {
        status: boolean;
        message?: string;
        data?: { authorization_url?: string; reference?: string };
      };
      if (!paystackJson.status || !paystackJson.data?.authorization_url) {
        return new Response(
          JSON.stringify({
            error: paystackJson.message || "Paystack init failed."
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          authorizationUrl: paystackJson.data.authorization_url,
          reference: paystackJson.data.reference || reference,
          paymentTransactionId,
          publicKey: paystackConfig.publicKey,
          amountKobo,
          currency,
          email,
          environment: paystackConfig.environment
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unsupported payment type." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment initialization failed.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
