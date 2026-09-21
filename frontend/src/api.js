const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

export { API_URL };

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    const hint =
      response.status === 404
        ? "The endpoint does not exist on the backend."
        : "Check VITE_API_URL.";
    throw new Error(
      `Unexpected response from ${response.url} — expected JSON but got ` +
        (contentType || "unknown") +
        ` (status ${response.status}). ${hint} ` +
        text.slice(0, 120)
    );
  }

  return response.json();
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("access");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        `Could not reach the backend at ${API_URL}. ` +
          `Check that the Django server is running and that ` +
          `${window.location.origin} is allowed in ` +
          `CORS_ALLOWED_ORIGINS.`
      );
    }
    throw err;
  }

  if (response.status === 204) {
    return null;
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail || data.error || `Request failed (status ${response.status})`
    );
  }

  return data;
}