const API_URL = "http://127.0.0.1:8000/api";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("access");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || data.error || "Something went wrong"
    );
  }

  return data;
}