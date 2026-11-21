// API Service for Women Safety App — Real Backend Only (No Simulation)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

let warmupPromise = null;

/**
 * Silently pings the backend health endpoint to wake up cold-started servers
 * (e.g., Render free tier) before the user submits the login/signup form.
 */
const warmup = () => {
  if (warmupPromise) return warmupPromise;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  warmupPromise = fetch(`${API_URL}/health`, {
    method: 'GET',
    signal: controller.signal,
    keepalive: true,
  })
    .catch(() => {
      // Silently ignore warmup errors; actual requests will surface real errors
    })
    .finally(() => {
      clearTimeout(timeoutId);
      // Allow re-warming after 4 minutes of inactivity
      setTimeout(() => {
        warmupPromise = null;
      }, 4 * 60 * 1000);
    });

  return warmupPromise;
};

// HTTP request wrapper with auth token injection, timeout, and error handling
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const timeoutMs = options.timeoutMs || 25000;

  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  // Only set Content-Type to JSON if it's not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const config = {
    ...options,
    headers,
    signal: options.signal || controller.signal,
  };

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, config);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Server is taking too long to respond (waking up). Please try again in a moment.', { cause: err });
    }
    console.error(`Fetch failed from: ${API_URL}${endpoint}`, err);
    throw new Error('Unable to connect to the server. Please check your internet connection.', { cause: err });
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle 401 Unauthorized — clear token and redirect to login
  if (response.status === 401) {
    localStorage.removeItem('token');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized - Session expired');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error (${response.status})`);
  }

  return await response.json();
};

// Expose API client methods
export const api = {
  warmup,
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body)
  }),
};
