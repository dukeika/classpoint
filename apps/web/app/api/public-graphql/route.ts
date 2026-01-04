export async function POST(request: Request) {
  const url = process.env.APPSYNC_URL;
  const apiKey = process.env.APPSYNC_API_KEY;
  if (!url || !apiKey) {
    return new Response(JSON.stringify({ error: "APPSYNC_URL or APPSYNC_API_KEY missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = await request.json();

  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey
    },
    body: JSON.stringify(body)
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" }
  });
}
