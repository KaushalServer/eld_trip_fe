import { buildMockResult } from './mockData';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000/api';
export const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) throw new Error(data?.detail || `Request failed: ${response.status}`);
  return data;
}

export const health = () => request('/health/');
export const login = (username, password) => 
  request('/auth/signin/', { 
    method: 'POST', 
    body: JSON.stringify({ username, password })
  });
export const register = (username, password) => 
  request('/auth/signup/', { 
    method: 'POST', 
    body: JSON.stringify({ username, password }) 
  });
export const logout = () => 
  request('/auth/logout/', { 
    method: 'POST' 
  });
export const me = () => request('/auth/me/');
export const listTrips = () => request('/trip/');
export const deleteTrip = (id) => 
  request(`/trip/${id}/`, { 
    method: 'DELETE' 
  });

export async function createAndPlanTrip(payload) {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return buildMockResult(payload);
  }
  const trip = await request('/trip/', { method: 'POST', body: JSON.stringify(payload) });
  return request(`/trip/${trip.id}/plan/`, { method: 'POST' });
}

export async function downloadPdf(id) {
  const response = await fetch(`${API}/trip/${id}/eld.pdf`, { credentials: 'include' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `PDF request failed: ${response.status}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trip-${id}-eld.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
