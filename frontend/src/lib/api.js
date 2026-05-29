import { supabase } from './supabase.js';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

async function request(path, { method = 'GET', body, query } = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const url = new URL(BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null) url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  profile: {
    get: () => request('/api/profile'),
    update: (patch) => request('/api/profile', { method: 'PUT', body: patch }),
  },
  categories: {
    list: () => request('/api/categories'),
    create: (data) => request('/api/categories', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/categories/${id}`, { method: 'PUT', body: data }),
    remove: (id) => request(`/api/categories/${id}`, { method: 'DELETE' }),
  },
  tasks: {
    list: (range) => request('/api/tasks', { query: range }),
    create: (data) => request('/api/tasks', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/tasks/${id}`, { method: 'PUT', body: data }),
    remove: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
  },
};
