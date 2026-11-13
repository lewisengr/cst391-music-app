type Method = "GET" | "POST" | "PUT";

async function request<T>(
  path: string,
  method: Method,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    signal,
    cache: "no-store",
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });

  if (!response.ok) {
    throw new Error(`Request failed (HTTP ${response.status}).`);
  }

  return response.json();
}

export function get<T>(path: string, signal?: AbortSignal) {
  return request<T>(path, "GET", undefined, signal);
}

export function post<T>(path: string, body: unknown) {
  return request<T>(path, "POST", body);
}

export function put<T>(path: string, body: unknown) {
  return request<T>(path, "PUT", body);
}
