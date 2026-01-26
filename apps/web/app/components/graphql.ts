type GraphqlResponse<T> = {
  data?: T;
  errors?: { message?: string }[];
};

export const graphqlFetch = async <T>(
  query: string,
  variables: Record<string, unknown>,
  token?: string,
  usePublic = false
) => {
  const endpoint = usePublic ? "/api/public-graphql" : "/api/graphql";
  const hasJwt = typeof token === "string" && token.includes(".");
  if (variables?.input && typeof variables.input === "object") {
    const input = variables.input as Record<string, unknown>;
    if (input.configJson && typeof input.configJson === "object") {
      input.configJson = JSON.stringify(input.configJson);
    }
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(hasJwt ? { Authorization: token } : {})
    },
    body: JSON.stringify({ query, variables })
  });

  let json: GraphqlResponse<T> | null = null;
  try {
    json = (await res.json()) as GraphqlResponse<T>;
  } catch (error) {
    const fallback = await res.text().catch(() => "");
    throw new Error(fallback ? `Invalid JSON response: ${fallback.slice(0, 200)}` : "Invalid JSON response.");
  }
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.message || `Request failed (${res.status}).`);
  }
  if (json?.errors?.length) {
    const message = json.errors?.[0]?.message || "GraphQL request failed.";
    throw new Error(message);
  }
  return (json?.data ?? ({} as T)) as T;
};
