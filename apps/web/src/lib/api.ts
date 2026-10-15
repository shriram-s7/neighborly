import { UserSummary } from '@neighborly/shared';

// In production VITE_API_URL points at the API origin; locally it is unset and Vite proxies /api.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = `${API_ORIGIN}/api/v1`;

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export function formatINR(paise: number = 0): string {
  const rupees = Math.round(paise / 100);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('neighborly_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      // Attempt token refresh
      const refreshToken = localStorage.getItem('neighborly_refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem('neighborly_access_token', data.accessToken);
            localStorage.setItem('neighborly_refresh_token', data.refreshToken);
            // Retry original request with new token
            const retryHeaders = {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.accessToken}`,
              ...options.headers,
            };
            const retryRes = await fetch(url, { ...options, headers: retryHeaders });
            if (!retryRes.ok) throw new Error(await retryRes.text());
            return retryRes.json();
          }
        } catch {
          localStorage.removeItem('neighborly_access_token');
          localStorage.removeItem('neighborly_refresh_token');
          window.location.href = '/login';
        }
      }
    }

    if (!res.ok) {
      let errorMessage = 'Request failed';
      try {
        const errorData = await res.json();
        errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || errorData.code || 'An unexpected error occurred';
      } catch {
        errorMessage = res.statusText;
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
