/**
 * SkillPath AI - Centralized Production API Client
 * Automatically uses same-origin '/api/...' in Vercel production by default,
 * or prepends VITE_API_BASE_URL if an external backend is configured.
 */

export const getApiUrl = (endpoint: string): string => {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
};

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**
 * Robust fetch wrapper that handles JSON parsing, HTTP status codes,
 * and produces informative error messages without exposing secrets.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = getApiUrl(endpoint);

  const token = localStorage.getItem('skillpath_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const contentType = res.headers.get('content-type') || '';
    let parsedData: any = null;

    if (contentType.includes('application/json')) {
      try {
        parsedData = await res.json();
      } catch {
        parsedData = null;
      }
    }

    if (!res.ok) {
      if (parsedData?.error) {
        return { ok: false, status: res.status, error: parsedData.error };
      }

      if (res.status === 401) {
        return { ok: false, status: 401, error: 'Session expired or unauthenticated. Please log in again.' };
      }
      if (res.status === 403) {
        return { ok: false, status: 403, error: 'Access denied. You do not have permission for this resource.' };
      }
      if (res.status === 404) {
        return {
          ok: false,
          status: 404,
          error: `API route not found (404). Ensure Vercel serverless function is deployed.`
        };
      }
      if (res.status === 500) {
        return {
          ok: false,
          status: 500,
          error: parsedData?.error || 'Internal server error (500). Please check server logs.'
        };
      }

      return {
        ok: false,
        status: res.status,
        error: `Request failed with HTTP ${res.status} (${res.statusText || 'Error'}).`
      };
    }

    return {
      ok: true,
      status: res.status,
      data: parsedData ?? (await res.text().catch(() => null))
    };
  } catch (err: any) {
    console.error(`[SkillPath AI API Error] Request to ${url} failed:`, err);
    const isNetworkError =
      err?.name === 'TypeError' ||
      err?.message?.includes('fetch') ||
      err?.message?.includes('network') ||
      err?.message?.includes('Failed to fetch');

    return {
      ok: false,
      status: 0,
      error: isNetworkError
        ? 'Unable to connect to the SkillPath AI backend. Please verify your internet connection and API deployment.'
        : (err?.message || 'An unexpected request error occurred.')
    };
  }
}
