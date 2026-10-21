import { loadAuth, clearAuth } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(endpoint, options = {}) {
  const auth = loadAuth();
  const headers = {
    ...options.headers,
  };

  if (auth?.token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${auth.token}`;
  }

  // If body is JSON and not FormData, set Content-Type
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If not on login page, clear auth
    if (!endpoint.includes("/auth/login") && !endpoint.includes("/auth/signup")) {
      clearAuth();
      window.dispatchEvent(new Event("auth-expired"));
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.detail || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    signup: (credentials) => request("/api/auth/signup", { method: "POST", body: JSON.stringify(credentials) }),
    login: (credentials) => request("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
    me: () => request("/api/auth/me"),
  },

  // Documents
  documents: {
    list: () => request("/api/documents"),
    upload: (formData) => request("/api/documents/upload", { method: "POST", body: formData }),
    delete: (documentId) => request(`/api/documents/${documentId}`, { method: "DELETE" }),
  },

  // Conversations
  conversations: {
    list: () => request("/api/conversations"),
    create: (data) => request("/api/conversations", { method: "POST", body: JSON.stringify(data) }),
    get: (conversationId) => request(`/api/conversations/${conversationId}`),
    update: (conversationId, data) => request(`/api/conversations/${conversationId}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (conversationId) => request(`/api/conversations/${conversationId}`, { method: "DELETE" }),
    sendMessage: (conversationId, data) => request(`/api/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify(data) }),
    regenerate: (conversationId) => request(`/api/conversations/${conversationId}/regenerate`, { method: "POST" }),
    editLastMessage: (conversationId, content) => request(`/api/conversations/${conversationId}/messages/last`, { method: "PUT", body: JSON.stringify({ content }) }),
  },

  // Sharing
  share: {
    create: (conversationId) => request(`/api/share/${conversationId}`, { method: "POST" }),
    get: (shareToken) => request(`/api/share/${shareToken}`),
    revoke: (shareToken) => request(`/api/share/${shareToken}`, { method: "DELETE" }),
  },
};
