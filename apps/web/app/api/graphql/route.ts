export async function POST(request: Request) {
  const url = process.env.APPSYNC_URL;
  if (!url) {
    return new Response(JSON.stringify({ error: "APPSYNC_URL missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const auth = request.headers.get("authorization") || request.cookies.get("cp.id_token")?.value || "";
  const body = await request.json();
  if (body?.variables?.input?.configJson) {
    const value = body.variables.input.configJson;
    if (typeof value === "object") {
      body.variables.input.configJson = JSON.stringify(value);
    }
  }

  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: auth } : {})
    },
    body: JSON.stringify(body)
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" }
  });
}
